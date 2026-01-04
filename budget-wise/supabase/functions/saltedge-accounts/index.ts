// Edge Function: Get SaltEdge Accounts
// Returns connected bank accounts for the authenticated user

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
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

    // Get all connected bank accounts with connection info
    const { data: accounts, error } = await supabase
      .from('bank_accounts')
      .select(`
        *,
        connection:saltedge_connections!saltedge_connection_id (
          provider_name,
          provider_code,
          status,
          sync_status,
          last_sync_at,
          next_refresh_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_connected', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching accounts:', error);
      throw new Error('Failed to fetch accounts');
    }

    // Also get connections (for disconnected accounts info)
    const { data: connections } = await supabase
      .from('saltedge_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return jsonResponse({
      success: true,
      accounts: accounts || [],
      connections: connections || [],
    });
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(error.message, 500);
  }
});
