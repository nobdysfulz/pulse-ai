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
    const { title, headers, data, userId } = await req.json();

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const accessToken = await getOAuthToken(userId, 'google_workspace', supabaseUrl, supabaseKey);

    // Create spreadsheet structure
    const spreadsheet: any = {
      properties: { title }
    };

    // Create a new Google Sheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(spreadsheet)
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('[createGoogleSheetTool] Google Sheets API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create spreadsheet: ${error}`,
          suggestion: 'Please check your Google Workspace connection in Settings > Integrations'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sheet = await createResponse.json();
    const spreadsheetId = sheet.spreadsheetId;

    // If headers or data are provided, populate the sheet
    if (headers || data) {
      const values = [];
      if (headers) values.push(headers);
      if (data) values.push(...data);

      const updateResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values })
        }
      );

      if (!updateResponse.ok) {
        console.error('[createGoogleSheetTool] Failed to populate spreadsheet');
      }
    }

    console.log('[createGoogleSheetTool] Spreadsheet created:', spreadsheetId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          spreadsheetId,
          title,
          url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
          message: 'Google Sheet created successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[createGoogleSheetTool] Error:', error);
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
