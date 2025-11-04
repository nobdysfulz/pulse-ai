import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOAuthToken } from '../_shared/oauthUtils.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, imageUrl, userId } = await req.json();

    if (!userId || !content) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    const accessToken = await getOAuthToken(userId, 'linkedin', supabaseUrl, supabaseKey);

    // Get LinkedIn person URN
    const { data: connection } = await supabaseClient
      .from('external_service_connections')
      .select('connection_metadata')
      .eq('user_id', userId)
      .eq('service_name', 'linkedin')
      .single();

    const personUrn = connection?.connection_metadata?.person_urn;

    if (!personUrn) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'LinkedIn account not properly connected',
          suggestion: 'Please reconnect your LinkedIn account in Settings > Integrations'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct post data
    const postData: any = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // If image is provided, add media
    if (imageUrl) {
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        media: imageUrl
      }];
    }

    // Publish to LinkedIn
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[publishLinkedInPostTool] LinkedIn API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to publish post: ${error}`,
          suggestion: 'Please check your LinkedIn connection in Settings > Integrations'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const postId = data.id;

    console.log('[publishLinkedInPostTool] Post published:', postId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          postId,
          message: 'LinkedIn post published successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[publishLinkedInPostTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please ensure your LinkedIn account is connected'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
