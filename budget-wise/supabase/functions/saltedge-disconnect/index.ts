// Edge Function: Disconnect SaltEdge Connection
// Removes a bank connection and optionally deletes synced transactions

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
    const { connection_id, delete_transactions = false } = body;

    if (!connection_id) {
      return errorResponse('connection_id is required', 400);
    }

    // Verify the connection belongs to the user
    const { data: connection, error: connectionError } = await supabase
      .from('saltedge_connections')
      .select('*')
      .eq('saltedge_connection_id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connectionError || !connection) {
      return errorResponse('Connection not found or unauthorized', 404);
    }

    // Delete connection from SaltEdge
    try {
      await saltedgeRequest(`/connections/${connection_id}`, 'DELETE');
    } catch (saltEdgeError) {
      console.warn('Failed to delete from SaltEdge (may already be deleted):', saltEdgeError);
    }

    // Optionally delete synced transactions
    if (delete_transactions) {
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)
        .not('saltedge_transaction_id', 'is', null);
    } else {
      // Mark transactions as no longer synced but keep them
      await supabase
        .from('transactions')
        .update({
          is_synced: false,
          bank_account_id: null,
        })
        .eq('user_id', user.id)
        .not('saltedge_transaction_id', 'is', null);
    }

    // Delete bank accounts linked to this connection
    await supabase
      .from('bank_accounts')
      .delete()
      .eq('saltedge_connection_id', connection_id);

    // Delete the connection record
    await supabase
      .from('saltedge_connections')
      .delete()
      .eq('saltedge_connection_id', connection_id);

    return jsonResponse({
      success: true,
      message: 'Connection disconnected successfully',
      transactions_deleted: delete_transactions,
    });
  } catch (error) {
    console.error('Error disconnecting:', error);
    return errorResponse(error.message, 500);
  }
});
