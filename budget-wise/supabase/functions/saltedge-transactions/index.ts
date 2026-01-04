// Edge Function: Sync SaltEdge Transactions
// Fetches transactions from SaltEdge and saves them to the database

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  saltedgeRequest,
  createSupabaseAdmin,
  verifyAuth,
  jsonResponse,
  errorResponse,
  corsHeaders,
  mapCategory,
} from '../_shared/saltedge.ts';

interface SaltEdgeTransaction {
  id: string;
  account_id: string;
  amount: number;
  currency_code: string;
  description: string;
  made_on: string;
  category: string;
  duplicated: boolean;
  mode: string;
  status: string;
  extra?: {
    merchant_name?: string;
    original_amount?: number;
    original_currency_code?: string;
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
    const body = await req.json().catch(() => ({}));
    const { account_id, connection_id } = body;

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

    // Update sync status
    await supabase
      .from('saltedge_connections')
      .update({ sync_status: 'syncing' })
      .eq('saltedge_connection_id', connection_id);

    // Build query for transactions
    let endpoint = `/transactions?connection_id=${connection_id}`;
    if (account_id) {
      endpoint += `&account_id=${account_id}`;
    }

    // Get user's categories for mapping
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id);

    const categoryMap = new Map(categories?.map(c => [c.name, c.id]) || []);

    // Fetch transactions from SaltEdge
    let allTransactions: SaltEdgeTransaction[] = [];
    let nextId: string | undefined;

    // Paginate through all transactions
    do {
      const paginatedEndpoint = nextId ? `${endpoint}&from_id=${nextId}` : endpoint;
      const response = await saltedgeRequest(paginatedEndpoint) as {
        data: SaltEdgeTransaction[];
        meta: { next_id?: string };
      };

      allTransactions = allTransactions.concat(response.data);
      nextId = response.meta.next_id;

      // Limit to avoid timeout (max 1000 transactions per sync)
      if (allTransactions.length >= 1000) break;
    } while (nextId);

    console.log(`Fetched ${allTransactions.length} transactions`);

    // Get bank accounts for this connection
    const { data: bankAccounts } = await supabase
      .from('bank_accounts')
      .select('id, saltedge_account_id')
      .eq('saltedge_connection_id', connection_id);

    const accountMap = new Map(bankAccounts?.map(a => [a.saltedge_account_id, a.id]) || []);

    // Process and save transactions
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const tx of allTransactions) {
      try {
        // Skip duplicated or pending transactions
        if (tx.duplicated || tx.status === 'pending') {
          skipped++;
          continue;
        }

        // Map category
        const { categoryName, isIncome, skip } = mapCategory(tx.category);

        if (skip) {
          skipped++;
          continue;
        }

        // Find category ID
        let categoryId = categoryMap.get(categoryName);

        // If category not found, use "Altro"
        if (!categoryId) {
          categoryId = categoryMap.get('Altro');
        }

        // If still no category, skip (shouldn't happen)
        if (!categoryId) {
          console.warn(`No category found for: ${categoryName}`);
          skipped++;
          continue;
        }

        // Get bank account ID
        const bankAccountId = accountMap.get(tx.account_id);

        // Determine transaction type based on amount and category
        const type = tx.amount > 0 || isIncome ? 'income' : 'expense';
        const amount = Math.abs(tx.amount);

        // Check if transaction already exists
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('saltedge_transaction_id', tx.id)
          .single();

        if (existing) {
          // Update existing transaction
          await supabase
            .from('transactions')
            .update({
              amount,
              type,
              description: tx.description || tx.extra?.merchant_name || 'Transazione bancaria',
              category_id: categoryId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          // Insert new transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              saltedge_transaction_id: tx.id,
              bank_account_id: bankAccountId,
              category_id: categoryId,
              amount,
              type,
              description: tx.description || tx.extra?.merchant_name || 'Transazione bancaria',
              date: tx.made_on,
              is_synced: true,
              saltedge_category: tx.category,
              merchant_name: tx.extra?.merchant_name,
              original_amount: tx.extra?.original_amount,
              original_currency: tx.extra?.original_currency_code,
            });

          imported++;
        }
      } catch (txError) {
        console.error(`Error processing transaction ${tx.id}:`, txError);
        errors++;
      }
    }

    // Update sync status and last sync time
    await supabase
      .from('saltedge_connections')
      .update({
        sync_status: 'success',
        last_sync_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq('saltedge_connection_id', connection_id);

    // Update bank accounts last sync
    await supabase
      .from('bank_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('saltedge_connection_id', connection_id);

    return jsonResponse({
      success: true,
      stats: {
        total: allTransactions.length,
        imported,
        skipped,
        errors,
      },
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);

    // Try to update sync status to error
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.connection_id) {
        const supabase = createSupabaseAdmin();
        await supabase
          .from('saltedge_connections')
          .update({
            sync_status: 'error',
            sync_error: error.message,
          })
          .eq('saltedge_connection_id', body.connection_id);
      }
    } catch {}

    return errorResponse(error.message, 500);
  }
});
