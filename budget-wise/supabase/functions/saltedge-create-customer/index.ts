// Edge Function: Create SaltEdge Customer
// Creates a customer in SaltEdge for the authenticated user

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

    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('saltedge_customers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingCustomer) {
      return jsonResponse({
        success: true,
        customer_id: existingCustomer.saltedge_customer_id,
        message: 'Customer already exists',
      });
    }

    // Create customer in SaltEdge
    // Using user.id as unique identifier
    let saltedgeCustomerId: string | null = null;

    try {
      console.log('Attempting to create customer with identifier:', user.id);
      const response = await saltedgeRequest('/customers', 'POST', {
        data: {
          identifier: user.id,
        },
      }) as { data: { id: string } };
      saltedgeCustomerId = response.data.id;
      console.log('Customer created successfully:', saltedgeCustomerId);
    } catch (createError: any) {
      console.log('Create customer error:', createError.message);

      // If customer already exists on SaltEdge, fetch it
      if (createError.message?.includes('already exists') || createError.message?.includes('identifier has already been taken')) {
        console.log('Customer already exists on SaltEdge, fetching...');
        try {
          // List all customers and find the one with matching identifier
          const listResponse = await saltedgeRequest('/customers') as {
            data: Array<{ id: string; identifier: string }>;
          };

          console.log('Raw API response:', JSON.stringify(listResponse));

          if (!listResponse.data || !Array.isArray(listResponse.data)) {
            console.error('Invalid response structure from /customers API');
            throw new Error('SaltEdge API returned invalid response structure');
          }

          console.log('Customers count:', listResponse.data.length);
          console.log('Looking for identifier:', user.id);

          const existingCustomer = listResponse.data.find(c => c.identifier === user.id);

          if (existingCustomer) {
            saltedgeCustomerId = existingCustomer.id;
            console.log('Found existing customer:', saltedgeCustomerId);
          } else {
            // Customer exists but with different identifier? List all for debugging
            console.log('Available identifiers:', listResponse.data.map(c => c.identifier));
            throw new Error(`Customer exists on SaltEdge but could not find matching identifier. Found ${listResponse.data.length} customers.`);
          }
        } catch (listError: any) {
          console.error('Error listing customers:', listError);
          throw new Error(`Customer exists but failed to retrieve: ${listError.message}`);
        }
      } else {
        throw createError;
      }
    }

    // Final validation before saving
    if (!saltedgeCustomerId) {
      throw new Error('Failed to obtain SaltEdge customer ID');
    }

    // Save to database
    const { error: insertError } = await supabase
      .from('saltedge_customers')
      .insert({
        user_id: user.id,
        saltedge_customer_id: saltedgeCustomerId,
      });

    if (insertError) {
      console.error('Failed to save customer:', JSON.stringify(insertError));
      throw new Error(`Failed to save customer: ${insertError.message} (${insertError.code})`);
    }

    return jsonResponse({
      success: true,
      customer_id: saltedgeCustomerId,
      message: 'Customer created successfully',
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return errorResponse(error.message, 500);
  }
});
