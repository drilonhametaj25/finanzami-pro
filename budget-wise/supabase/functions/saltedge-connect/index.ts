// Edge Function: Create SaltEdge Connect Session
// Returns a connect_url for the Salt Edge Connect widget

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  saltedgeRequest,
  createSupabaseAdmin,
  verifyAuth,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/saltedge.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const user = await verifyAuth(req);
    const supabase = createSupabaseAdmin();

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { return_to, country_code } = body;

    if (!return_to) {
      return errorResponse('return_to URL is required', 400);
    }

    // Get SaltEdge customer - should already exist from create-customer endpoint
    let { data: customer } = await supabase
      .from('saltedge_customers')
      .select('saltedge_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!customer) {
      // Customer should be created first via saltedge-create-customer
      // But handle this case gracefully for robustness
      console.log('No customer in DB, attempting to create or fetch from SaltEdge...');

      let saltedgeCustomerId: string;

      try {
        // Try to create customer
        const customerResponse = await saltedgeRequest('/customers', 'POST', {
          data: {
            identifier: user.id,
          },
        }) as { data: { id: string } };
        saltedgeCustomerId = customerResponse.data.id;
        console.log('Created new SaltEdge customer:', saltedgeCustomerId);
      } catch (createError: any) {
        // If customer already exists on SaltEdge, fetch it
        if (createError.message?.includes('already exists') || createError.message?.includes('identifier has already been taken')) {
          console.log('Customer already exists on SaltEdge, fetching...');
          const listResponse = await saltedgeRequest('/customers') as {
            data: Array<{ id: string; identifier: string }>;
          };

          console.log('Customers from SaltEdge:', JSON.stringify(listResponse.data?.map(c => ({ id: c.id, identifier: c.identifier }))));

          const existingCustomer = listResponse.data?.find(c => c.identifier === user.id);
          if (existingCustomer) {
            saltedgeCustomerId = existingCustomer.id;
            console.log('Found existing customer:', saltedgeCustomerId);
          } else {
            throw new Error('Customer exists on SaltEdge but could not find matching identifier');
          }
        } else {
          throw createError;
        }
      }

      // Save to database
      const { error: insertError } = await supabase.from('saltedge_customers').insert({
        user_id: user.id,
        saltedge_customer_id: saltedgeCustomerId,
      });

      if (insertError) {
        console.error('Failed to save customer:', insertError);
        // If insert failed due to duplicate, try to fetch again
        if (insertError.code === '23505') {
          const { data: existingCustomer } = await supabase
            .from('saltedge_customers')
            .select('saltedge_customer_id')
            .eq('user_id', user.id)
            .single();
          if (existingCustomer) {
            customer = existingCustomer;
          } else {
            throw new Error('Failed to create or fetch customer');
          }
        } else {
          throw new Error(`Failed to save customer: ${insertError.message}`);
        }
      } else {
        customer = { saltedge_customer_id: saltedgeCustomerId };
      }
    }

    // Get Supabase project URL for webhook callback
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const webhookUrl = `${supabaseUrl}/functions/v1/saltedge-webhook`;

    // Create connect session
    // include_sandboxes: true is needed for Test/Pending accounts to see Fake Banks
    const connectData: Record<string, unknown> = {
      data: {
        customer_id: customer.saltedge_customer_id,
        consent: {
          scopes: ['account_details', 'transactions_details'],
          from_date: new Date().toISOString().split('T')[0], // Today's date
        },
        attempt: {
          return_to: return_to,
          fetch_scopes: ['accounts', 'transactions'],
          include_sandboxes: true, // Required for Test/Pending mode
        },
        daily_refresh: true,
        categorization: 'personal',
        javascript_callback_type: 'post_message',
        include_sandboxes: true, // Show Fake Banks and Sandboxes
      },
    };

    // Add country filter if specified
    if (country_code) {
      (connectData.data as Record<string, unknown>).allowed_countries = [country_code];
    }

    console.log('Creating connect session:', JSON.stringify(connectData));

    const response = await saltedgeRequest('/connect_sessions/create', 'POST', connectData) as {
      data: { connect_url: string; expires_at: string };
    };

    return jsonResponse({
      success: true,
      connect_url: response.data.connect_url,
      expires_at: response.data.expires_at,
    });
  } catch (error) {
    console.error('Error creating connect session:', error);
    return errorResponse(error.message, 500);
  }
});
