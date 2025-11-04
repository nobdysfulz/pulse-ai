import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { title, content, userId } = await req.json();

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const accessToken = await getOAuthToken(userId, 'google_workspace', supabaseUrl, supabaseKey);

    // Create a new Google Doc
    const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('[createGoogleDocTool] Google Docs API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create document: ${error}`,
          suggestion: 'Please check your Google Workspace connection in Settings > Integrations'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const doc = await createResponse.json();
    const documentId = doc.documentId;

    // If content is provided, insert it
    if (content) {
      const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            insertText: {
              location: { index: 1 },
              text: content
            }
          }]
        })
      });

      if (!updateResponse.ok) {
        console.error('[createGoogleDocTool] Failed to add content to document');
      }
    }

    console.log('[createGoogleDocTool] Document created:', documentId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          documentId,
          title,
          url: `https://docs.google.com/document/d/${documentId}/edit`,
          message: 'Google Doc created successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[createGoogleDocTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please ensure your Google Workspace account is connected'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
