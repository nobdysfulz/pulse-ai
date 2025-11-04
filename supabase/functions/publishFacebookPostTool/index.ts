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
    const { content, link, imageUrl, userId } = await req.json();

    if (!userId || !content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get OAuth token and page ID
    const accessToken = await getOAuthToken(userId, 'facebook', supabaseUrl, supabaseKey);

    // Get Facebook page ID from connection settings
    const { data: connection } = await supabaseClient
      .from('external_service_connections')
      .select('settings')
      .eq('user_id', userId)
      .eq('service_name', 'facebook')
      .single();

    const pageId = connection?.settings?.page_id;
    if (!pageId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No Facebook Page connected',
          suggestion: 'Please connect a Facebook Page in Settings > Integrations'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build post data
    const postData: any = {
      message: content,
      access_token: accessToken
    };

    if (link) postData.link = link;
    if (imageUrl) postData.url = imageUrl;

    // Publish to Facebook Page
    const endpoint = imageUrl 
      ? `https://graph.facebook.com/v18.0/${pageId}/photos`
      : `https://graph.facebook.com/v18.0/${pageId}/feed`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[publishFacebookPostTool] Facebook API error:', response.status, error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to publish post: ${response.status}`,
          suggestion: 'Please check your Facebook connection in Settings > Integrations'
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('[publishFacebookPostTool] Post published:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          postId: data.id,
          postUrl: `https://www.facebook.com/${data.id}`,
          message: 'Post published successfully to Facebook'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[publishFacebookPostTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: error instanceof Error && error.message.includes('not connected') 
          ? 'Please connect Facebook in Settings > Integrations'
          : 'An error occurred publishing the post'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
