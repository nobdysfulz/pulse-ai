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
    const { to, subject, body, cc, bcc, userId } = await req.json();

    if (!userId || !to || !subject || !body) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId, to, subject, and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const accessToken = await getOAuthToken(userId, 'microsoft', supabaseUrl, supabaseKey);

    // Construct email message
    const message: any = {
      subject,
      body: {
        contentType: 'HTML',
        content: body
      },
      toRecipients: to.split(',').map((email: string) => ({
        emailAddress: { address: email.trim() }
      }))
    };

    if (cc) {
      message.ccRecipients = cc.split(',').map((email: string) => ({
        emailAddress: { address: email.trim() }
      }));
    }

    if (bcc) {
      message.bccRecipients = bcc.split(',').map((email: string) => ({
        emailAddress: { address: email.trim() }
      }));
    }

    // Send email using Microsoft Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[sendOutlookEmailTool] Microsoft Graph API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to send email: ${error}`,
          suggestion: 'Please check your Microsoft 365 connection in Settings > Integrations'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[sendOutlookEmailTool] Email sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: { message: 'Email sent successfully via Outlook' }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[sendOutlookEmailTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please ensure your Microsoft 365 account is connected'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
