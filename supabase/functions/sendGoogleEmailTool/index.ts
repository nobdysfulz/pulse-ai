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
    const { to, subject, body, cc, bcc, userId } = await req.json();

    if (!userId || !to || !subject || !body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, subject, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Get OAuth token
    const accessToken = await getOAuthToken(userId, 'google_workspace', supabaseUrl, supabaseKey);

    // Create email message in RFC 2822 format
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
    ];

    if (cc) emailLines.push(`Cc: ${cc}`);
    if (bcc) emailLines.push(`Bcc: ${bcc}`);

    emailLines.push('');
    emailLines.push(body);

    const email = emailLines.join('\r\n');

    // Encode in base64url format
    const encodedEmail = btoa(email)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[sendGoogleEmailTool] Gmail API error:', response.status, error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to send email: ${response.status}`,
          suggestion: 'Please check your Google Workspace connection in Settings > Integrations'
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('[sendGoogleEmailTool] Email sent successfully:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          messageId: data.id,
          threadId: data.threadId,
          to: to,
          subject: subject,
          message: 'Email sent successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[sendGoogleEmailTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: error instanceof Error && error.message.includes('not connected') 
          ? 'Please connect Google Workspace in Settings > Integrations'
          : 'An error occurred sending the email'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
