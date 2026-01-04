// SaltEdge service - calls Supabase Edge Functions for bank integration
import { supabase } from './supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

// Types for API responses
export interface SaltEdgeConnection {
  id: string;
  user_id: string;
  saltedge_connection_id: string;
  saltedge_customer_id: string;
  provider_code: string;
  provider_name: string;
  country_code: string | null;
  status: string;
  last_sync_at: string | null;
  next_refresh_at: string | null;
  sync_status: 'pending' | 'syncing' | 'success' | 'error';
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectedBankAccount {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  currency_code: string;
  iban: string | null;
  account_number: string | null;
  is_connected: boolean;
  last_sync_at: string | null;
  saltedge_account_id: string | null;
  saltedge_connection_id: string | null;
  connection?: {
    provider_name: string;
    provider_code: string;
    status: string;
    sync_status: string;
    last_sync_at: string | null;
    next_refresh_at: string | null;
  };
}

export interface SyncStats {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
}

// Helper to call Edge Functions
const callEdgeFunction = async <T>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<T> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Non autenticato');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Errore nella chiamata a ${functionName}`);
  }

  return data;
};

/**
 * Create or get SaltEdge customer for the current user
 */
export const createCustomer = async (): Promise<{ customer_id: string }> => {
  return callEdgeFunction<{ success: boolean; customer_id: string }>(
    'saltedge-create-customer'
  );
};

/**
 * Get connect URL for Salt Edge Connect widget
 * @param returnTo - URL to redirect after connection (deep link)
 * @param countryCode - Optional country code to filter banks (e.g., 'IT', 'DE')
 */
export const getConnectUrl = async (
  returnTo: string,
  countryCode?: string
): Promise<{ connect_url: string; expires_at: string }> => {
  return callEdgeFunction<{ success: boolean; connect_url: string; expires_at: string }>(
    'saltedge-connect',
    { return_to: returnTo, country_code: countryCode }
  );
};

/**
 * Get all connected bank accounts for the current user
 */
export const getConnectedAccounts = async (): Promise<{
  accounts: ConnectedBankAccount[];
  connections: SaltEdgeConnection[];
}> => {
  return callEdgeFunction<{
    success: boolean;
    accounts: ConnectedBankAccount[];
    connections: SaltEdgeConnection[];
  }>('saltedge-accounts');
};

/**
 * Sync transactions for a connection
 * @param connectionId - The SaltEdge connection ID
 * @param accountId - Optional specific account ID to sync
 */
export const syncTransactions = async (
  connectionId: string,
  accountId?: string
): Promise<{ stats: SyncStats }> => {
  return callEdgeFunction<{ success: boolean; stats: SyncStats }>(
    'saltedge-transactions',
    { connection_id: connectionId, account_id: accountId }
  );
};

/**
 * Refresh a connection to get latest data
 * @param connectionId - The SaltEdge connection ID
 */
export const refreshConnection = async (
  connectionId: string
): Promise<{ status: string; next_refresh_at: string }> => {
  return callEdgeFunction<{
    success: boolean;
    message: string;
    status: string;
    next_refresh_at: string;
  }>('saltedge-refresh', { connection_id: connectionId });
};

/**
 * Disconnect a bank connection
 * @param connectionId - The SaltEdge connection ID
 * @param deleteTransactions - Whether to delete synced transactions
 */
export const disconnectBank = async (
  connectionId: string,
  deleteTransactions = false
): Promise<void> => {
  await callEdgeFunction<{ success: boolean }>(
    'saltedge-disconnect',
    { connection_id: connectionId, delete_transactions: deleteTransactions }
  );
};

// Deep link scheme for the app - routes to /settings/bank-callback
export const BANK_CONNECT_RETURN_URL = 'budgetwise://settings/bank-callback';

/**
 * Start the bank connection flow
 * Opens the Salt Edge Connect widget in a browser
 * @param countryCode - Optional country code to filter banks
 */
export const startBankConnection = async (countryCode?: string): Promise<string> => {
  // First ensure customer exists
  await createCustomer();

  // Get the connect URL
  const { connect_url } = await getConnectUrl(BANK_CONNECT_RETURN_URL, countryCode);

  return connect_url;
};
