// Edge Function: Sync Enable Banking Transactions
// Fetches transactions from Enable Banking and saves them with auto-categorization

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  enableBankingRequest,
  createSupabaseAdmin,
  verifyAuth,
  jsonResponse,
  errorResponse,
  corsHeaders,
  EnableBankingTransaction,
  mapBankTransactionCode,
} from '../_shared/enableBanking.ts';

interface TransactionsResponse {
  transactions: EnableBankingTransaction[];
  continuation_key?: string;
}

interface SyncRequest {
  account_id: string; // Our internal account ID
  from_date?: string; // YYYY-MM-DD
  to_date?: string;   // YYYY-MM-DD
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
    const body: SyncRequest = await req.json();

    if (!body.account_id) {
      return errorResponse('account_id is required', 400);
    }

    // Get the account and verify ownership
    const { data: account, error: accountError } = await supabase
      .from('enable_banking_accounts')
      .select(`
        *,
        session:enable_banking_sessions(
          session_id,
          status,
          valid_until
        )
      `)
      .eq('id', body.account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return errorResponse('Account not found or unauthorized', 404);
    }

    // Check session validity
    const session = account.session;
    console.log('Account data:', JSON.stringify(account, null, 2));
    console.log('Session data:', JSON.stringify(session, null, 2));

    if (!session || session.status !== 'authorized') {
      return errorResponse('Bank session is not active. Please reconnect.', 400);
    }

    const validUntil = new Date(session.valid_until);
    if (validUntil < new Date()) {
      await supabase
        .from('enable_banking_sessions')
        .update({ status: 'expired' })
        .eq('session_id', session.session_id);
      return errorResponse('Bank session has expired. Please reconnect.', 400);
    }

    // Update sync status
    await supabase
      .from('enable_banking_accounts')
      .update({ sync_status: 'syncing' })
      .eq('id', account.id);

    // Build query parameters
    const params = new URLSearchParams();
    if (body.from_date) params.append('date_from', body.from_date);
    if (body.to_date) params.append('date_to', body.to_date);

    // The account_id should now be a UUID (the 'uid' from Enable Banking)
    // that can be used directly in the API endpoint
    const accountUid = account.account_id;

    console.log('Fetching transactions for account UID:', accountUid);

    // Fetch transactions from Enable Banking
    // API endpoint: /accounts/{account_id}/transactions (account_id is the uid/UUID)
    let allTransactions: EnableBankingTransaction[] = [];
    let continuationKey: string | undefined;

    do {
      const endpoint = `/accounts/${accountUid}/transactions${
        continuationKey
          ? `?continuation_key=${encodeURIComponent(continuationKey)}`
          : params.toString() ? `?${params.toString()}` : ''
      }`;

      console.log('Calling Enable Banking endpoint:', endpoint);

      const response = await enableBankingRequest<TransactionsResponse>(endpoint);

      allTransactions = allTransactions.concat(response.transactions || []);
      continuationKey = response.continuation_key;

      // Limit to avoid timeout
      if (allTransactions.length >= 500) break;
    } while (continuationKey);

    console.log(`Fetched ${allTransactions.length} transactions for account ${account.account_id}`);

    // Get user's categories for mapping
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id);

    const categoryMap = new Map(categories?.map(c => [c.name, c.id]) || []);

    // Process and save transactions
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const tx of allTransactions) {
      try {
        // Skip pending or rejected transactions
        if (tx.status === 'PDNG' || tx.status === 'RJCT' || tx.status === 'CNCL') {
          skipped++;
          continue;
        }

        // Get amount and type
        const amount = Math.abs(parseFloat(tx.transaction_amount.amount));
        const isIncome = tx.credit_debit_indicator === 'CRDT';
        const type = isIncome ? 'income' : 'expense';

        // Get merchant/creditor/debtor name
        const merchantName = isIncome
          ? tx.debtor?.name
          : tx.creditor?.name;

        // Build description from remittance info
        const description = tx.remittance_information?.join(' ') ||
          merchantName ||
          'Transazione bancaria';

        // Auto-categorize using our function
        const { data: categorization } = await supabase.rpc('auto_categorize_transaction', {
          p_user_id: user.id,
          p_description: description,
          p_merchant_name: merchantName,
          p_creditor_name: tx.creditor?.name,
          p_debtor_name: tx.debtor?.name,
          p_remittance_info: tx.remittance_information?.join(' '),
          p_amount: amount,
        });

        let categoryId = categorization?.[0]?.category_id;
        const confidence = categorization?.[0]?.confidence || 0.3;

        // Fallback if auto-categorization fails
        if (!categoryId) {
          // Use bank transaction code mapping
          const { categoryName, isIncome: mappedIsIncome } = mapBankTransactionCode(
            tx.bank_transaction_code,
            tx.credit_debit_indicator
          );
          categoryId = categoryMap.get(categoryName) || categoryMap.get('Altro');
        }

        // Check if transaction already exists
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('enable_banking_id', tx.entry_reference)
          .eq('user_id', user.id)
          .single();

        const transactionData = {
          amount,
          type,
          description: description.substring(0, 500), // Limit description length
          category_id: categoryId,
          date: tx.transaction_date || tx.booking_date || tx.value_date || new Date().toISOString().split('T')[0],
          booking_date: tx.booking_date,
          value_date: tx.value_date,
          merchant_name: merchantName?.substring(0, 255),
          creditor_name: tx.creditor?.name?.substring(0, 255),
          debtor_name: tx.debtor?.name?.substring(0, 255),
          remittance_info: tx.remittance_information?.join(' ').substring(0, 1000),
          original_currency: tx.transaction_amount.currency,
          is_synced: true,
          auto_categorized: true,
          categorization_confidence: confidence,
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          // Update existing transaction (but don't override user's category choice)
          const { data: existingTx } = await supabase
            .from('transactions')
            .select('auto_categorized')
            .eq('id', existing.id)
            .single();

          // Only update category if it was auto-categorized before
          const updateData = existingTx?.auto_categorized
            ? transactionData
            : { ...transactionData, category_id: undefined, auto_categorized: undefined, categorization_confidence: undefined };

          await supabase
            .from('transactions')
            .update(updateData)
            .eq('id', existing.id);

          updated++;
        } else {
          // Insert new transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              enable_banking_id: tx.entry_reference,
              enable_banking_account_id: account.id,
              ...transactionData,
            });

          imported++;
        }
      } catch (txError) {
        console.error(`Error processing transaction ${tx.entry_reference}:`, txError);
        errors++;
      }
    }

    // Update account sync status
    await supabase
      .from('enable_banking_accounts')
      .update({
        sync_status: 'success',
        last_sync_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq('id', account.id);

    return jsonResponse({
      success: true,
      stats: {
        total: allTransactions.length,
        imported,
        updated,
        skipped,
        errors,
      },
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);

    // Try to update sync status to error
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.account_id) {
        const supabase = createSupabaseAdmin();
        await supabase
          .from('enable_banking_accounts')
          .update({
            sync_status: 'error',
            sync_error: error.message,
          })
          .eq('id', body.account_id);
      }
    } catch {}

    return errorResponse(error.message, 500);
  }
});
