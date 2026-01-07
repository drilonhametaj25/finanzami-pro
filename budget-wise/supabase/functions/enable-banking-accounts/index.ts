// Edge Function: Get Enable Banking Connected Accounts
// Returns all connected bank accounts for the current user

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  enableBankingRequest,
  createSupabaseAdmin,
  verifyAuth,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/enableBanking.ts';

interface BalanceResponse {
  balances: Array<{
    balance_amount: {
      amount: string;
      currency: string;
    };
    balance_type: string;
    reference_date?: string;
  }>;
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

    // Get all connected accounts with their sessions
    const { data: accounts, error: accountsError } = await supabase
      .from('enable_banking_accounts')
      .select(`
        *,
        session:enable_banking_sessions(
          session_id,
          status,
          valid_until
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return errorResponse('Error fetching accounts', 500);
    }

    // Get all sessions for this user
    const { data: sessions, error: sessionsError } = await supabase
      .from('enable_banking_sessions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['authorized', 'pending']);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    }

    // Optionally refresh balances for accounts with valid sessions
    const refreshBalances = req.method === 'POST';

    if (refreshBalances && accounts && accounts.length > 0) {
      for (const account of accounts) {
        const session = account.session;
        if (!session || session.status !== 'authorized') continue;

        // Check if session is still valid
        const validUntil = new Date(session.valid_until);
        if (validUntil < new Date()) {
          // Session expired, mark it
          await supabase
            .from('enable_banking_sessions')
            .update({ status: 'expired' })
            .eq('session_id', session.session_id);
          continue;
        }

        try {
          // Fetch latest balance
          const balanceResponse = await enableBankingRequest<BalanceResponse>(
            `/accounts/${account.account_id}/balances`
          );

          const primaryBalance = balanceResponse.balances?.find(
            b => b.balance_type === 'closingBooked' || b.balance_type === 'interimAvailable'
          ) || balanceResponse.balances?.[0];

          if (primaryBalance) {
            await supabase
              .from('enable_banking_accounts')
              .update({
                balance_amount: parseFloat(primaryBalance.balance_amount.amount),
                balance_type: primaryBalance.balance_type,
                balance_date: primaryBalance.reference_date,
                updated_at: new Date().toISOString(),
              })
              .eq('id', account.id);

            // Update local account object
            account.balance_amount = parseFloat(primaryBalance.balance_amount.amount);
            account.balance_type = primaryBalance.balance_type;
          }
        } catch (error) {
          console.error(`Error refreshing balance for account ${account.account_id}:`, error);
        }
      }
    }

    return jsonResponse({
      success: true,
      accounts: accounts?.map(a => ({
        id: a.id,
        account_id: a.account_id,
        iban: a.iban,
        bban: a.bban,
        name: a.account_name,
        type: a.account_type,
        currency: a.currency,
        balance: a.balance_amount,
        balance_type: a.balance_type,
        balance_date: a.balance_date,
        bank_name: a.bank_name,
        bank_country: a.bank_country,
        last_sync_at: a.last_sync_at,
        sync_status: a.sync_status,
        session_valid_until: a.session?.valid_until,
        session_status: a.session?.status,
      })) || [],
      sessions: sessions?.map(s => ({
        id: s.id,
        session_id: s.session_id,
        status: s.status,
        valid_until: s.valid_until,
        created_at: s.created_at,
      })) || [],
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return errorResponse(error.message, 500);
  }
});
