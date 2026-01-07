// Shared Enable Banking utilities for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

// Enable Banking API base URL
export const ENABLE_BANKING_API_URL = 'https://api.enablebanking.com';

// Environment variables
export const getEnvVars = () => {
  const applicationId = Deno.env.get('ENABLE_BANKING_APP_ID');
  const privateKeyPem = Deno.env.get('ENABLE_BANKING_PRIVATE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!applicationId || !privateKeyPem) {
    throw new Error('Missing Enable Banking credentials');
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  return { applicationId, privateKeyPem, supabaseUrl, supabaseServiceKey };
};

// Create Supabase admin client (bypasses RLS)
export const createSupabaseAdmin = () => {
  const { supabaseUrl, supabaseServiceKey } = getEnvVars();
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Generate JWT for Enable Banking API
export const generateJWT = async (): Promise<string> => {
  const { applicationId, privateKeyPem } = getEnvVars();

  // Parse the PEM private key - handle escaped newlines
  const formattedKey = privateKeyPem.replace(/\\n/g, '\n');
  const privateKey = await jose.importPKCS8(formattedKey, 'RS256');

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiration

  // Enable Banking JWT format:
  // - iss: application ID
  // - aud: api.enablebanking.com
  // - kid in header: application ID
  const jwt = await new jose.SignJWT({
    iss: applicationId,
    aud: 'api.enablebanking.com',
    iat: now,
    exp: exp,
  })
    .setProtectedHeader({
      alg: 'RS256',
      typ: 'JWT',
      kid: applicationId,
    })
    .sign(privateKey);

  console.log('Generated JWT for Enable Banking (first 50 chars):', jwt.substring(0, 50));
  return jwt;
};

// Enable Banking API request helper
export const enableBankingRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T> => {
  const jwt = await generateJWT();
  const url = `${ENABLE_BANKING_API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwt}`,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  console.log(`Enable Banking request: ${method} ${url}`);

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error('Enable Banking API error:', data);
    throw new Error(data.message || data.error || `Enable Banking API error: ${response.status}`);
  }

  return data as T;
};

// CORS headers for responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to create JSON response
export const jsonResponse = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Helper to create error response
export const errorResponse = (message: string, status = 400) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Verify user authentication from request
export const verifyAuth = async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const supabase = createSupabaseAdmin();
  const token = authHeader.replace('Bearer ', '');

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user;
};

// Enable Banking transaction interface
export interface EnableBankingTransaction {
  entry_reference: string;
  transaction_id?: string;
  transaction_amount: {
    amount: string;
    currency: string;
  };
  credit_debit_indicator: 'CRDT' | 'DBIT';
  status: 'BOOK' | 'PDNG' | 'RJCT' | 'CNCL';
  booking_date?: string;
  value_date?: string;
  transaction_date?: string;
  debtor?: {
    name?: string;
    postal_address?: {
      country?: string;
      address_lines?: string[];
    };
  };
  creditor?: {
    name?: string;
    postal_address?: {
      country?: string;
      address_lines?: string[];
    };
  };
  remittance_information?: string[];
  bank_transaction_code?: string;
  reference_number?: string;
  balance_after_transaction?: {
    amount: string;
    currency: string;
  };
}

// Enable Banking account interface
export interface EnableBankingAccount {
  account_id: Record<string, unknown> | string; // Object like {iban: "..."} or string
  uid?: string; // UUID - THIS is what we use for API calls like /accounts/{uid}/transactions
  iban?: string;
  bban?: string;
  name?: string;
  product?: string;
  cash_account_type?: string; // CACC, SVGS, etc.
  currency?: string;
  identification_hash?: string;
  balances?: Array<{
    balance_amount: {
      amount: string;
      currency: string;
    };
    balance_type: string;
    reference_date?: string;
  }>;
}

// ASPSP (bank) interface
export interface ASPSP {
  name: string;
  country: string;
  bic?: string;
  logo?: string;
  maximum_consent_validity?: string;
  pis?: {
    supported_payment_types?: string[];
  };
}

// Map Enable Banking category to Finanzami category
export const CATEGORY_MAPPING: Record<string, { name: string; isIncome: boolean }> = {
  // Standard bank transaction codes
  'PMNT': { name: 'Altro', isIncome: false }, // Payments
  'RCDT': { name: 'Stipendio', isIncome: true }, // Received Credit Transfers
  'RDDT': { name: 'Altro', isIncome: false }, // Direct Debit
  'ICDT': { name: 'Altro', isIncome: false }, // Issued Credit Transfers
  'CCRD': { name: 'Altro', isIncome: false }, // Credit Card
  'DCRD': { name: 'Altro', isIncome: false }, // Debit Card
  'XTND': { name: 'Altro', isIncome: false }, // Extended domain
  'OTHR': { name: 'Altro', isIncome: false }, // Other
  'SALA': { name: 'Stipendio', isIncome: true }, // Salary
  'PENS': { name: 'Stipendio', isIncome: true }, // Pension
  'BONU': { name: 'Bonus', isIncome: true }, // Bonus
  'INTC': { name: 'Investimenti', isIncome: true }, // Interest
  'DIVD': { name: 'Investimenti', isIncome: true }, // Dividends
};

// Get transaction type and initial category from bank transaction code
export const mapBankTransactionCode = (
  code: string | undefined,
  creditDebitIndicator: 'CRDT' | 'DBIT'
): { categoryName: string; isIncome: boolean } => {
  if (code && CATEGORY_MAPPING[code]) {
    return {
      categoryName: CATEGORY_MAPPING[code].name,
      isIncome: CATEGORY_MAPPING[code].isIncome,
    };
  }

  // Default based on credit/debit indicator
  return {
    categoryName: creditDebitIndicator === 'CRDT' ? 'Altro' : 'Altro',
    isIncome: creditDebitIndicator === 'CRDT',
  };
};
