// Shared SaltEdge utilities for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// SaltEdge API base URL
export const SALTEDGE_API_URL = 'https://www.saltedge.com/api/v6';

// Environment variables
export const getEnvVars = () => {
  const appId = Deno.env.get('SALTEDGE_APP_ID');
  const secret = Deno.env.get('SALTEDGE_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!appId || !secret) {
    throw new Error('Missing SaltEdge credentials');
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  return { appId, secret, supabaseUrl, supabaseServiceKey };
};

// Create Supabase admin client (bypasses RLS)
export const createSupabaseAdmin = () => {
  const { supabaseUrl, supabaseServiceKey } = getEnvVars();
  return createClient(supabaseUrl, supabaseServiceKey);
};

// SaltEdge API request helper
export const saltedgeRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<unknown> => {
  const { appId, secret } = getEnvVars();

  const url = `${SALTEDGE_API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'App-id': appId,
    'Secret': secret,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`SaltEdge request: ${method} ${url}`);

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error('SaltEdge API error:', data);
    throw new Error(data.error?.message || `SaltEdge API error: ${response.status}`);
  }

  return data;
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

// SaltEdge category to Finanzami category mapping
export const CATEGORY_MAPPING: Record<string, string> = {
  // Housing
  'housing': 'Casa',
  'rent': 'Casa',
  'mortgage': 'Casa',
  'utilities': 'Casa',
  'home_improvement': 'Casa',
  'home_services': 'Casa',

  // Food & Groceries
  'food_and_groceries': 'Spesa alimentare',
  'groceries': 'Spesa alimentare',
  'supermarkets': 'Spesa alimentare',

  // Restaurants
  'restaurants_and_hotels': 'Ristoranti e bar',
  'restaurants': 'Ristoranti e bar',
  'cafes_and_restaurants': 'Ristoranti e bar',
  'bars_and_cafes': 'Ristoranti e bar',
  'fast_food': 'Ristoranti e bar',

  // Transport
  'transport': 'Trasporti',
  'public_transport': 'Trasporti',
  'taxi': 'Trasporti',
  'fuel': 'Trasporti',
  'parking': 'Trasporti',
  'car_rental': 'Trasporti',
  'vehicle_maintenance': 'Trasporti',

  // Entertainment & Leisure
  'leisure': 'Svago',
  'entertainment': 'Svago',
  'hobbies': 'Svago',
  'sports': 'Svago',
  'games': 'Svago',
  'movies': 'Svago',
  'music': 'Svago',
  'books': 'Svago',

  // Clothing
  'clothes_and_shoes': 'Abbigliamento',
  'clothing': 'Abbigliamento',
  'shoes': 'Abbigliamento',
  'accessories': 'Abbigliamento',

  // Health
  'health_and_beauty': 'Salute',
  'health': 'Salute',
  'pharmacy': 'Salute',
  'doctors': 'Salute',
  'medical': 'Salute',
  'dental': 'Salute',
  'optical': 'Salute',

  // Personal Care
  'beauty': 'Cura personale',
  'personal_care': 'Cura personale',
  'hair': 'Cura personale',
  'spa': 'Cura personale',

  // Education
  'education': 'Istruzione',
  'school': 'Istruzione',
  'university': 'Istruzione',
  'courses': 'Istruzione',

  // Gifts
  'gifts': 'Regali',
  'charity': 'Regali',
  'donations': 'Regali',

  // Work
  'work_expenses': 'Lavoro',
  'office_supplies': 'Lavoro',
  'business_services': 'Lavoro',

  // Technology
  'electronics': 'Tecnologia',
  'software': 'Tecnologia',
  'telecommunications': 'Tecnologia',
  'phone': 'Tecnologia',
  'internet': 'Tecnologia',

  // Travel
  'travel': 'Viaggi',
  'hotels': 'Viaggi',
  'flights': 'Viaggi',
  'vacation': 'Viaggi',

  // Pets
  'pets': 'Animali',
  'pet_food': 'Animali',
  'veterinary': 'Animali',

  // Income categories
  'income': 'income', // Special marker for income type
  'salary': 'income',
  'wages': 'income',
  'bonus': 'income',
  'interest': 'income',
  'dividends': 'income',
  'refund': 'income',

  // Skip categories (transfers, etc.)
  'transfers': 'skip',
  'internal_transfer': 'skip',
  'savings': 'skip',
  'investments': 'skip',
  'atm': 'skip',

  // Default
  'uncategorized': 'Altro',
  'other': 'Altro',
  'fees': 'Altro',
  'bank_fees': 'Altro',
  'taxes': 'Altro',
  'insurance': 'Altro',
};

// Get Finanzami category name from SaltEdge category
export const mapCategory = (saltedgeCategory: string | null): { categoryName: string; isIncome: boolean; skip: boolean } => {
  if (!saltedgeCategory) {
    return { categoryName: 'Altro', isIncome: false, skip: false };
  }

  const normalized = saltedgeCategory.toLowerCase().replace(/-/g, '_');
  const mapped = CATEGORY_MAPPING[normalized] || 'Altro';

  if (mapped === 'income') {
    return { categoryName: 'Lavoro', isIncome: true, skip: false }; // Income transactions use "Lavoro" category
  }

  if (mapped === 'skip') {
    return { categoryName: '', isIncome: false, skip: true };
  }

  return { categoryName: mapped, isIncome: false, skip: false };
};
