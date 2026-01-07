// Edge Function: Get available banks (ASPSPs) from Enable Banking
// Returns list of banks that support account information services

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  enableBankingRequest,
  createSupabaseAdmin,
  verifyAuth,
  jsonResponse,
  errorResponse,
  corsHeaders,
  ASPSP,
} from '../_shared/enableBanking.ts';

interface ASPSPResponse {
  aspsps: ASPSP[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    await verifyAuth(req);
    const supabase = createSupabaseAdmin();

    // Parse query params
    const url = new URL(req.url);
    const country = url.searchParams.get('country') || 'IT';

    // Check cache first (cached for 24 hours)
    const { data: cachedAspsps } = await supabase
      .from('enable_banking_aspsps')
      .select('*')
      .eq('country', country)
      .gte('cached_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (cachedAspsps && cachedAspsps.length > 0) {
      console.log(`Returning ${cachedAspsps.length} cached ASPSPs for ${country}`);
      return jsonResponse({
        success: true,
        aspsps: cachedAspsps.map(a => ({
          name: a.name,
          bic: a.bic,
          country: a.country,
          logo_url: a.logo_url,
          supported_features: a.supported_features,
          maximum_consent_validity: a.maximum_consent_validity,
        })),
      });
    }

    // Fetch from Enable Banking API
    const response = await enableBankingRequest<ASPSPResponse>(
      `/aspsps?country=${country}`
    );

    console.log(`Fetched ${response.aspsps.length} ASPSPs from Enable Banking`);

    // Cache the results
    const aspspsToCache = response.aspsps.map(aspsp => ({
      name: aspsp.name,
      bic: aspsp.bic,
      country: aspsp.country,
      logo_url: aspsp.logo,
      supported_features: {
        pis: aspsp.pis,
      },
      maximum_consent_validity: aspsp.maximum_consent_validity,
      cached_at: new Date().toISOString(),
    }));

    // Upsert ASPSPs
    if (aspspsToCache.length > 0) {
      await supabase
        .from('enable_banking_aspsps')
        .upsert(aspspsToCache, {
          onConflict: 'name,country',
          ignoreDuplicates: false,
        });
    }

    return jsonResponse({
      success: true,
      aspsps: response.aspsps.map(a => ({
        name: a.name,
        bic: a.bic,
        country: a.country,
        logo_url: a.logo,
        maximum_consent_validity: a.maximum_consent_validity,
      })),
    });
  } catch (error) {
    console.error('Error fetching ASPSPs:', error);
    return errorResponse(error.message, 500);
  }
});
