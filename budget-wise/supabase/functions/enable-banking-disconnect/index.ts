// Edge Function: Disconnect Enable Banking Session
// Revokes consent and optionally deletes synced transactions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  enableBankingRequest,
  createSupabaseAdmin,
  verifyAuth,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/enableBanking.ts';

interface DisconnectRequest {
  session_id: string; // Our internal session ID
  delete_transactions?: boolean;
}

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
    const body: DisconnectRequest = await req.json();

    if (!body.session_id) {
      return errorResponse('session_id is required', 400);
    }

    // Get the session and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('enable_banking_sessions')
      .select('*')
      .eq('id', body.session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return errorResponse('Session not found or unauthorized', 404);
    }

    // Try to revoke consent at Enable Banking
    if (session.status === 'authorized') {
      try {
        await enableBankingRequest(
          `/sessions/${session.session_id}`,
          'DELETE'
        );
        console.log(`Revoked Enable Banking session: ${session.session_id}`);
      } catch (error) {
        // Log but don't fail - session might already be revoked
        console.error('Error revoking Enable Banking session:', error);
      }
    }

    // Get accounts for this session
    const { data: accounts } = await supabase
      .from('enable_banking_accounts')
      .select('id')
      .eq('session_id', session.id);

    const accountIds = accounts?.map(a => a.id) || [];

    // Delete or update transactions if requested
    if (body.delete_transactions && accountIds.length > 0) {
      // Delete transactions linked to these accounts
      await supabase
        .from('transactions')
        .delete()
        .in('enable_banking_account_id', accountIds);

      console.log(`Deleted transactions for ${accountIds.length} accounts`);
    } else if (accountIds.length > 0) {
      // Just unlink transactions from accounts
      await supabase
        .from('transactions')
        .update({
          enable_banking_account_id: null,
          is_synced: false,
        })
        .in('enable_banking_account_id', accountIds);
    }

    // Delete accounts
    await supabase
      .from('enable_banking_accounts')
      .delete()
      .eq('session_id', session.id);

    // Update session status
    await supabase
      .from('enable_banking_sessions')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    return jsonResponse({
      success: true,
      message: 'Bank connection disconnected successfully',
      deleted_accounts: accountIds.length,
    });
  } catch (error) {
    console.error('Error disconnecting bank:', error);
    return errorResponse(error.message, 500);
  }
});
