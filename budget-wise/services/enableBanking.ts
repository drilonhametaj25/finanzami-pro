// Enable Banking service - calls Supabase Edge Functions for bank integration
import { supabase } from './supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

// Types for API responses
export interface EnableBankingSession {
  id: string;
  session_id: string;
  status: 'pending' | 'authorized' | 'expired' | 'revoked' | 'error';
  valid_until: string | null;
  created_at: string;
}

export interface EnableBankingAccount {
  id: string;
  account_id: string;
  iban: string | null;
  bban: string | null;
  name: string | null;
  type: string;
  currency: string;
  balance: number | null;
  balance_type: string | null;
  balance_date: string | null;
  bank_name: string | null;
  bank_country: string | null;
  last_sync_at: string | null;
  sync_status: 'pending' | 'syncing' | 'success' | 'error';
  session_valid_until: string | null;
  session_status: string | null;
}

export interface ASPSP {
  name: string;
  bic: string | null;
  country: string;
  logo_url: string | null;
  maximum_consent_validity: string | null;
}

export interface SyncStats {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
}

// Helper to call Edge Functions
const callEdgeFunction = async <T>(
  functionName: string,
  body?: Record<string, unknown>,
  method: 'GET' | 'POST' = 'POST'
): Promise<T> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Non autenticato');
  }

  const url = new URL(`${SUPABASE_URL}/functions/v1/${functionName}`);

  // Add query params for GET requests
  if (method === 'GET' && body) {
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  console.log(`[EnableBanking] Calling ${method} ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: method !== 'GET' && body ? JSON.stringify(body) : undefined,
  });

  let data;
  const responseText = await response.text();

  try {
    data = JSON.parse(responseText);
  } catch {
    console.error(`[EnableBanking] Invalid JSON response:`, responseText.substring(0, 500));
    throw new Error(`Risposta non valida dal server: ${responseText.substring(0, 100)}`);
  }

  console.log(`[EnableBanking] Response status: ${response.status}`, data);

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Errore nella chiamata a ${functionName}`;
    console.error(`[EnableBanking] Error:`, errorMsg);
    throw new Error(errorMsg);
  }

  return data;
};

/**
 * Get list of available banks (ASPSPs) for a country
 * @param country - ISO country code (e.g., 'IT', 'DE')
 */
export const getAvailableBanks = async (
  country = 'IT'
): Promise<{ aspsps: ASPSP[] }> => {
  return callEdgeFunction<{ success: boolean; aspsps: ASPSP[] }>(
    `enable-banking-banks?country=${country}`,
    undefined,
    'GET'
  );
};

/**
 * Start bank authorization flow
 * @param aspspName - Bank name from ASPSP list
 * @param aspspCountry - Bank country code
 * @param redirectUrl - URL to redirect after authorization
 */
export const startAuthorization = async (
  aspspName: string,
  aspspCountry: string,
  redirectUrl: string
): Promise<{ authorization_url: string; state: string }> => {
  return callEdgeFunction<{
    success: boolean;
    authorization_url: string;
    state: string;
  }>('enable-banking-auth', {
    aspsp_name: aspspName,
    aspsp_country: aspspCountry,
    redirect_url: redirectUrl,
  });
};

/**
 * Complete authorization with callback code
 * @param code - Authorization code from callback
 * @param state - State parameter from callback
 */
export const completeAuthorization = async (
  code: string,
  state: string
): Promise<{
  session_id: string;
  valid_until: string;
  bank_name: string;
  accounts: Array<{
    account_id: string;
    iban: string | null;
    name: string | null;
    type: string | null;
    currency: string | null;
    balance: { amount: string; currency: string } | null;
  }>;
}> => {
  return callEdgeFunction<{
    success: boolean;
    session_id: string;
    valid_until: string;
    bank_name: string;
    accounts: Array<{
      account_id: string;
      iban: string | null;
      name: string | null;
      type: string | null;
      currency: string | null;
      balance: { amount: string; currency: string } | null;
    }>;
  }>('enable-banking-session', { code, state });
};

/**
 * Get all connected bank accounts
 * @param refreshBalances - Whether to refresh balances from bank (slower)
 */
export const getConnectedAccounts = async (
  refreshBalances = false
): Promise<{
  accounts: EnableBankingAccount[];
  sessions: EnableBankingSession[];
}> => {
  const method = refreshBalances ? 'POST' : 'GET';
  return callEdgeFunction<{
    success: boolean;
    accounts: EnableBankingAccount[];
    sessions: EnableBankingSession[];
  }>('enable-banking-accounts', undefined, method);
};

/**
 * Sync transactions for an account
 * @param accountId - Internal account ID
 * @param fromDate - Start date (YYYY-MM-DD)
 * @param toDate - End date (YYYY-MM-DD)
 */
export const syncTransactions = async (
  accountId: string,
  fromDate?: string,
  toDate?: string
): Promise<{ stats: SyncStats }> => {
  return callEdgeFunction<{ success: boolean; stats: SyncStats }>(
    'enable-banking-transactions',
    {
      account_id: accountId,
      from_date: fromDate,
      to_date: toDate,
    }
  );
};

/**
 * Disconnect a bank session
 * @param sessionId - Internal session ID
 * @param deleteTransactions - Whether to delete synced transactions
 */
export const disconnectBank = async (
  sessionId: string,
  deleteTransactions = false
): Promise<{ deleted_accounts: number }> => {
  return callEdgeFunction<{
    success: boolean;
    message: string;
    deleted_accounts: number;
  }>('enable-banking-disconnect', {
    session_id: sessionId,
    delete_transactions: deleteTransactions,
  });
};

// Redirect URL - uses Supabase Edge Function that redirects to the app
// This is required because Enable Banking only accepts HTTPS URLs
export const ENABLE_BANKING_REDIRECT_URL = `${SUPABASE_URL}/functions/v1/enable-banking-callback`;

/**
 * Start the bank connection flow
 * @param bankName - Bank name from ASPSP list
 * @param country - Bank country code
 * @param appRedirectUrl - The app's deep link URL for final redirect (optional)
 */
export const startBankConnection = async (
  bankName: string,
  country = 'IT',
  appRedirectUrl?: string
): Promise<{ url: string; state: string }> => {
  const result = await startAuthorizationWithAppRedirect(
    bankName,
    country,
    ENABLE_BANKING_REDIRECT_URL,
    appRedirectUrl
  );

  return {
    url: result.authorization_url,
    state: result.state,
  };
};

/**
 * Start bank authorization flow with app redirect URL
 */
const startAuthorizationWithAppRedirect = async (
  aspspName: string,
  aspspCountry: string,
  redirectUrl: string,
  appRedirectUrl?: string
): Promise<{ authorization_url: string; state: string }> => {
  return callEdgeFunction<{
    success: boolean;
    authorization_url: string;
    state: string;
  }>('enable-banking-auth', {
    aspsp_name: aspspName,
    aspsp_country: aspspCountry,
    redirect_url: redirectUrl,
    app_redirect_url: appRedirectUrl,
  });
};

/**
 * Handle callback from bank authorization
 * @param url - Full callback URL with query parameters
 */
export const handleBankCallback = async (
  url: string
): Promise<{
  success: boolean;
  session_id?: string;
  bank_name?: string;
  accounts_count?: number;
  error?: string;
}> => {
  try {
    const parsedUrl = new URL(url);
    const code = parsedUrl.searchParams.get('code');
    const state = parsedUrl.searchParams.get('state');
    const error = parsedUrl.searchParams.get('error');
    const errorDescription = parsedUrl.searchParams.get('error_description');

    if (error) {
      return {
        success: false,
        error: errorDescription || error,
      };
    }

    if (!code || !state) {
      return {
        success: false,
        error: 'Missing authorization code or state',
      };
    }

    const result = await completeAuthorization(code, state);

    return {
      success: true,
      session_id: result.session_id,
      bank_name: result.bank_name,
      accounts_count: result.accounts.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Sync all accounts for the user
 * Returns combined stats
 */
export const syncAllAccounts = async (): Promise<{
  total_accounts: number;
  total_stats: SyncStats;
  errors: string[];
}> => {
  const { accounts } = await getConnectedAccounts();

  const activeAccounts = accounts.filter(
    a => a.session_status === 'authorized'
  );

  const totalStats: SyncStats = {
    total: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const errors: string[] = [];

  for (const account of activeAccounts) {
    try {
      const { stats } = await syncTransactions(account.id);
      totalStats.total += stats.total;
      totalStats.imported += stats.imported;
      totalStats.updated += stats.updated;
      totalStats.skipped += stats.skipped;
      totalStats.errors += stats.errors;
    } catch (error) {
      errors.push(
        `${account.bank_name} (${account.iban}): ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  return {
    total_accounts: activeAccounts.length,
    total_stats: totalStats,
    errors,
  };
};
