// Edge Function: Enable Banking OAuth Callback Handler
// Receives callback from Enable Banking and redirects to the mobile app
// Uses HTTP 302 redirect for expo-web-browser compatibility

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Default deep link scheme for production
const DEFAULT_DEEP_LINK = 'budgetwise://bank-callback';

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    // Get callback parameters from Enable Banking
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    console.log('Enable Banking callback received:', {
      hasCode: !!code,
      hasState: !!state,
      error,
    });

    // Try to get app_redirect_url from database using state
    let appRedirectUrl = DEFAULT_DEEP_LINK;

    if (state) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          // Look up the session by state (session_id) to get app_redirect_url
          const { data: session } = await supabase
            .from('enable_banking_sessions')
            .select('accounts_data')
            .eq('session_id', state)
            .single();

          if (session?.accounts_data?.app_redirect_url) {
            appRedirectUrl = session.accounts_data.app_redirect_url;
            console.log('Found app_redirect_url from database:', appRedirectUrl);
          }
        }
      } catch (dbError) {
        console.error('Error fetching app_redirect_url from database:', dbError);
        // Continue with default
      }
    }

    // Build deep link with all parameters
    const deepLinkParams = new URLSearchParams();

    if (code) deepLinkParams.append('code', code);
    if (state) deepLinkParams.append('state', state);
    if (error) deepLinkParams.append('error', error);
    if (errorDescription) deepLinkParams.append('error_description', errorDescription);

    const paramString = deepLinkParams.toString();

    // Ensure base URL doesn't end with parameters
    const separator = appRedirectUrl.includes('?') ? '&' : '?';
    const deepLink = paramString ? `${appRedirectUrl}${separator}${paramString}` : appRedirectUrl;

    console.log('Redirecting to:', deepLink);

    // Return 302 redirect - this is intercepted by expo-web-browser openAuthSessionAsync
    return new Response(null, {
      status: 302,
      headers: {
        'Location': deepLink,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Callback error:', error);

    // On error, redirect with error params
    const deepLink = `${DEFAULT_DEEP_LINK}?error=callback_error&error_description=${encodeURIComponent('Si è verificato un errore')}`;

    return new Response(null, {
      status: 302,
      headers: {
        'Location': deepLink,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
});
