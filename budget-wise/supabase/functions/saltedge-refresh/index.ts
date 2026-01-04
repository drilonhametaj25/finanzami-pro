// Edge Function: Refresh SaltEdge Connection
// Triggers a manual refresh of a connection to get latest data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  saltedgeRequest,
  createSupabaseAdmin,
  verifyAuth,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/saltedge.ts';

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
    const { connection_id } = body;

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

    // Check if refresh is possible (rate limit)
    if (connection.next_refresh_at) {
      const nextRefresh = new Date(connection.next_refresh_at);
      if (nextRefresh > new Date()) {
        return jsonResponse({
          success: false,
          message: 'Refresh not yet available',
          next_refresh_at: connection.next_refresh_at,
        }, 429);
      }
    }

    // Update status to syncing
    await supabase
      .from('saltedge_connections')
      .update({ sync_status: 'syncing' })
      .eq('saltedge_connection_id', connection_id);

    // Request refresh from SaltEdge
    const response = await saltedgeRequest(`/connections/${connection_id}/refresh`, 'PUT', {
      data: {
        attempt: {
          fetch_scopes: ['accounts', 'transactions'],
        },
      },
    }) as {
      data: {
        id: string;
        status: string;
        next_refresh_possible_at: string;
      };
    };

    // Update connection with new refresh time
    await supabase
      .from('saltedge_connections')
      .update({
        status: response.data.status,
        next_refresh_at: response.data.next_refresh_possible_at,
        updated_at: new Date().toISOString(),
      })
      .eq('saltedge_connection_id', connection_id);

    return jsonResponse({
      success: true,
      message: 'Refresh initiated',
      status: response.data.status,
      next_refresh_at: response.data.next_refresh_possible_at,
    });
  } catch (error) {
    console.error('Error refreshing connection:', error);

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
