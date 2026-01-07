// Edge Function: Start Enable Banking Authorization
// Initiates the bank connection flow and returns redirect URL

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  enableBankingRequest,
  createSupabaseAdmin,
  verifyAuth,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/enableBanking.ts';

interface AuthRequest {
  aspsp_name: string;
  aspsp_country: string;
  redirect_url: string;
  app_redirect_url?: string; // The app's deep link URL for final redirect
  psu_type?: 'personal' | 'business';
  state?: string;
}

interface AuthResponse {
  url: string;
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
    const body: AuthRequest = await req.json();

    if (!body.aspsp_name || !body.aspsp_country || !body.redirect_url) {
      return errorResponse('aspsp_name, aspsp_country, and redirect_url are required', 400);
    }

    // Generate a unique state for this authorization
    const state = body.state || crypto.randomUUID();

    // Build authorization request
    const authPayload = {
      access: {
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      },
      aspsp: {
        name: body.aspsp_name,
        country: body.aspsp_country,
      },
      state: state,
      redirect_url: body.redirect_url,
      psu_type: body.psu_type || 'personal',
    };

    console.log('Starting Enable Banking authorization:', authPayload);

    // Call Enable Banking API
    const response = await enableBankingRequest<AuthResponse>(
      '/auth',
      'POST',
      authPayload
    );

    // Create a pending session record with app_redirect_url stored in accounts_data
    await supabase
      .from('enable_banking_sessions')
      .insert({
        user_id: user.id,
        session_id: state, // We'll update this with actual session_id after callback
        status: 'pending',
        accounts_data: body.app_redirect_url ? { app_redirect_url: body.app_redirect_url } : null,
        created_at: new Date().toISOString(),
      });

    console.log('Session created with state:', state, 'app_redirect_url:', body.app_redirect_url);

    return jsonResponse({
      success: true,
      authorization_url: response.url,
      state: state,
    });
  } catch (error) {
    console.error('Error starting authorization:', error);
    return errorResponse(error.message, 500);
  }
});
