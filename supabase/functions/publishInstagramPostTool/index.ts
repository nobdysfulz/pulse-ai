import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getOAuthToken } from '../_shared/oauthUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caption, imageUrl, userId } = await req.json();

    if (!userId || !caption || !imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: caption, imageUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get OAuth token and Instagram account ID
    const accessToken = await getOAuthToken(userId, 'instagram', supabaseUrl, supabaseKey);

    // Get Instagram Business Account ID from connection settings
    const { data: connection } = await supabaseClient
      .from('external_service_connections')
      .select('settings')
      .eq('user_id', userId)
      .eq('service_name', 'instagram')
      .single();

    const igAccountId = connection?.settings?.instagram_account_id;
    if (!igAccountId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No Instagram Business Account connected',
          suggestion: 'Please connect an Instagram Business Account in Settings > Integrations'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken
        })
      }
    );

    if (!containerResponse.ok) {
      const error = await containerResponse.text();
      console.error('[publishInstagramPostTool] Container creation error:', containerResponse.status, error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create Instagram media: ${containerResponse.status}`,
          suggestion: 'Please check your Instagram connection and ensure the image URL is publicly accessible'
        }),
        { status: containerResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const containerData = await containerResponse.json();
    const containerId = containerData.id;

    // Step 2: Publish the media container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken
        })
      }
    );

    if (!publishResponse.ok) {
      const error = await publishResponse.text();
      console.error('[publishInstagramPostTool] Publish error:', publishResponse.status, error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to publish Instagram post: ${publishResponse.status}`,
          suggestion: 'Please check your Instagram connection in Settings > Integrations'
        }),
        { status: publishResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const publishData = await publishResponse.json();
    console.log('[publishInstagramPostTool] Post published:', publishData.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          mediaId: publishData.id,
          message: 'Post published successfully to Instagram'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[publishInstagramPostTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: error instanceof Error && error.message.includes('not connected') 
          ? 'Please connect Instagram in Settings > Integrations'
          : 'An error occurred publishing the post'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
