// Edge Function: Complete Enable Banking Session
// Exchanges authorization code for session and retrieves accounts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  enableBankingRequest,
  createSupabaseAdmin,
  verifyAuth,
  jsonResponse,
  errorResponse,
  corsHeaders,
  EnableBankingAccount,
} from '../_shared/enableBanking.ts';

interface SessionRequest {
  code: string;
  state: string;
}

interface SessionResponse {
  session_id: string;
  accounts: EnableBankingAccount[];
  aspsp: {
    name: string;
    country: string;
  };
  access: {
    valid_until: string;
  };
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
    const body: SessionRequest = await req.json();

    if (!body.code || !body.state) {
      return errorResponse('code and state are required', 400);
    }

    // Verify the pending session exists and belongs to this user
    const { data: pendingSession, error: sessionError } = await supabase
      .from('enable_banking_sessions')
      .select('*')
      .eq('session_id', body.state)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (sessionError || !pendingSession) {
      return errorResponse('Invalid or expired authorization state', 400);
    }

    // Exchange code for session
    const sessionResponse = await enableBankingRequest<SessionResponse>(
      '/sessions',
      'POST',
      { code: body.code }
    );

    console.log('Session created:', sessionResponse.session_id);
    console.log('Accounts retrieved:', sessionResponse.accounts.length);

    // Update session record
    const { error: updateError } = await supabase
      .from('enable_banking_sessions')
      .update({
        session_id: sessionResponse.session_id,
        status: 'authorized',
        valid_until: sessionResponse.access.valid_until,
        accounts_data: sessionResponse.accounts,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendingSession.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    // Save accounts
    console.log('Raw accounts from Enable Banking:', JSON.stringify(sessionResponse.accounts, null, 2));

    const accountsToInsert = sessionResponse.accounts.map(account => {
      // Get the primary balance
      const primaryBalance = account.balances?.find(
        b => b.balance_type === 'closingBooked' || b.balance_type === 'interimAvailable'
      ) || account.balances?.[0];

      // Enable Banking returns:
      // - account_id: object like {iban: "...", other: null} - for identification/display
      // - uid: UUID string - THIS is what we use for API calls like /accounts/{uid}/transactions

      // Use uid for API calls, fall back to stringified account_id if uid not available
      let apiAccountId: string;
      let extractedIban: string | null = account.iban || null;
      let extractedBban: string | null = account.bban || null;

      // Prefer uid (the UUID) for API calls
      if (account.uid) {
        apiAccountId = account.uid;
        console.log('Using uid for account:', apiAccountId);
      } else if (typeof account.account_id === 'object') {
        // Fallback: stringify the object (shouldn't happen with proper API response)
        apiAccountId = JSON.stringify(account.account_id);
        console.log('Warning: No uid found, using stringified account_id:', apiAccountId);
      } else {
        apiAccountId = String(account.account_id);
      }

      // Extract IBAN from account_id object if not directly available
      if (!extractedIban && typeof account.account_id === 'object') {
        const accId = account.account_id as Record<string, unknown>;
        if (accId.iban) extractedIban = String(accId.iban);
      }
      if (!extractedBban && typeof account.account_id === 'object') {
        const accId = account.account_id as Record<string, unknown>;
        if (accId.bban) extractedBban = String(accId.bban);
      }

      console.log('Processing account:', { apiAccountId, extractedIban, uid: account.uid });

      return {
        user_id: user.id,
        session_id: pendingSession.id,
        account_id: apiAccountId, // Use uid (UUID) for API calls
        iban: extractedIban,
        bban: extractedBban,
        account_name: account.name || account.product,
        account_type: account.cash_account_type || 'CACC',
        currency: account.currency || primaryBalance?.balance_amount.currency || 'EUR',
        balance_amount: primaryBalance ? parseFloat(primaryBalance.balance_amount.amount) : null,
        balance_type: primaryBalance?.balance_type,
        balance_date: primaryBalance?.reference_date,
        bank_name: sessionResponse.aspsp.name,
        bank_country: sessionResponse.aspsp.country,
        is_active: true,
        sync_status: 'pending',
      };
    });

    // Insert accounts
    const { error: accountsError } = await supabase
      .from('enable_banking_accounts')
      .upsert(accountsToInsert, {
        onConflict: 'user_id,account_id',
        ignoreDuplicates: false,
      });

    if (accountsError) {
      console.error('Error saving accounts:', accountsError);
    }

    return jsonResponse({
      success: true,
      session_id: sessionResponse.session_id,
      valid_until: sessionResponse.access.valid_until,
      bank_name: sessionResponse.aspsp.name,
      accounts: sessionResponse.accounts.map(a => ({
        account_id: a.account_id,
        iban: a.iban,
        name: a.name || a.product,
        type: a.cash_account_type,
        currency: a.currency,
        balance: a.balances?.[0]?.balance_amount,
      })),
    });
  } catch (error) {
    console.error('Error completing session:', error);
    return errorResponse(error.message, 500);
  }
});
