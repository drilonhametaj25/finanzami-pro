// Edge Function: SaltEdge Webhook Handler
// Handles callbacks from SaltEdge when connections are created/updated

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  saltedgeRequest,
  createSupabaseAdmin,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/saltedge.ts';

interface WebhookPayload {
  data: {
    connection_id: string;
    customer_id: string;
    custom_fields?: Record<string, string>;
    stage?: string;
  };
  meta: {
    version: string;
    time: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log('Webhook received:', JSON.stringify(payload));

    const { connection_id, customer_id, stage } = payload.data;

    if (!connection_id || !customer_id) {
      console.error('Missing connection_id or customer_id');
      return errorResponse('Invalid payload', 400);
    }

    const supabase = createSupabaseAdmin();

    // Find the user by SaltEdge customer ID
    const { data: customerData, error: customerError } = await supabase
      .from('saltedge_customers')
      .select('user_id')
      .eq('saltedge_customer_id', customer_id)
      .single();

    if (customerError || !customerData) {
      console.error('Customer not found:', customer_id);
      return errorResponse('Customer not found', 404);
    }

    const userId = customerData.user_id;

    // Handle different webhook stages
    if (stage === 'finish' || !stage) {
      // Connection completed - fetch connection details
      const connectionResponse = await saltedgeRequest(`/connections/${connection_id}`) as {
        data: {
          id: string;
          provider_code: string;
          provider_name: string;
          country_code: string;
          status: string;
          next_refresh_possible_at: string;
        };
      };

      const connectionData = connectionResponse.data;

      // Upsert connection in database
      const { error: connectionError } = await supabase
        .from('saltedge_connections')
        .upsert({
          user_id: userId,
          saltedge_connection_id: connection_id,
          saltedge_customer_id: customer_id,
          provider_code: connectionData.provider_code,
          provider_name: connectionData.provider_name,
          country_code: connectionData.country_code,
          status: connectionData.status,
          next_refresh_at: connectionData.next_refresh_possible_at,
          sync_status: 'syncing',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'saltedge_connection_id',
        });

      if (connectionError) {
        console.error('Failed to save connection:', connectionError);
        throw new Error('Failed to save connection');
      }

      // Fetch and save accounts
      const accountsResponse = await saltedgeRequest(`/accounts?connection_id=${connection_id}`) as {
        data: Array<{
          id: string;
          name: string;
          nature: string;
          balance: number;
          currency_code: string;
          extra?: {
            iban?: string;
            account_number?: string;
          };
        }>;
      };

      for (const account of accountsResponse.data) {
        // Map SaltEdge account nature to our types
        let accountType = 'checking';
        if (account.nature === 'savings' || account.nature === 'deposit') {
          accountType = 'savings';
        } else if (account.nature === 'credit_card' || account.nature === 'card') {
          accountType = 'credit_card';
        } else if (account.nature === 'investment') {
          accountType = 'investment';
        }

        // Upsert bank account
        await supabase
          .from('bank_accounts')
          .upsert({
            user_id: userId,
            saltedge_account_id: account.id,
            saltedge_connection_id: connection_id,
            name: account.name,
            type: accountType,
            balance: account.balance,
            currency_code: account.currency_code,
            iban: account.extra?.iban || null,
            account_number: account.extra?.account_number || null,
            is_connected: true,
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'saltedge_account_id',
          });
      }

      // Update connection status to success
      await supabase
        .from('saltedge_connections')
        .update({
          sync_status: 'success',
          last_sync_at: new Date().toISOString(),
        })
        .eq('saltedge_connection_id', connection_id);

      console.log(`Connection ${connection_id} processed successfully with ${accountsResponse.data.length} accounts`);
    } else if (stage === 'error' || stage === 'fail') {
      // Connection failed
      await supabase
        .from('saltedge_connections')
        .update({
          sync_status: 'error',
          sync_error: `Connection failed at stage: ${stage}`,
        })
        .eq('saltedge_connection_id', connection_id);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return errorResponse(error.message, 500);
  }
});
