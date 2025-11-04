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
    const { folderName, parentFolderId, userId } = await req.json();

    if (!userId || !folderName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: folderName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Get OAuth token
    const accessToken = await getOAuthToken(userId, 'google_workspace', supabaseUrl, supabaseKey);

    // Build folder metadata
    const metadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    // Create folder via Google Drive API
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[createGoogleDriveFolderTool] Drive API error:', response.status, error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create folder: ${response.status}`,
          suggestion: 'Please check your Google Workspace connection in Settings > Integrations'
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('[createGoogleDriveFolderTool] Folder created:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          folderId: data.id,
          folderName: data.name,
          folderUrl: `https://drive.google.com/drive/folders/${data.id}`,
          message: 'Folder created successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[createGoogleDriveFolderTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: error instanceof Error && error.message.includes('not connected') 
          ? 'Please connect Google Workspace in Settings > Integrations'
          : 'An error occurred creating the folder'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
