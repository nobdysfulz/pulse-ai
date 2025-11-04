import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Generate CSV template content
    const csvContent = 'Name,Phone,Email,Status,Notes\n' +
      'John Doe,+1234567890,john@example.com,Lead,Interested in 3BR home\n' +
      'Jane Smith,+1987654321,jane@example.com,Prospect,Looking to sell\n' +
      'Bob Johnson,+1555555555,bob@example.com,Client,Under contract\n';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const buffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Upload to storage
    const fileName = `campaign-template-${Date.now()}.csv`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('campaign-templates')
      .upload(`templates/${fileName}`, uint8Array, {
        contentType: 'text/csv',
        upsert: false
      });

    if (uploadError) {
      console.warn('Failed to upload template to storage:', uploadError);
      // Return fallback content if storage fails
      return new Response(
        JSON.stringify({ 
          success: true,
          fallbackContent: csvContent,
          message: 'Template generated successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get signed URL
    const { data: urlData } = await supabaseClient.storage
      .from('campaign-templates')
      .createSignedUrl(`templates/${fileName}`, 3600);

    return new Response(
      JSON.stringify({ 
        success: true,
        downloadUrl: urlData?.signedUrl,
        fileName,
        message: 'Template generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in downloadCampaignTemplate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Always provide fallback CSV content
    const csvContent = 'Name,Phone,Email,Status,Notes\n' +
      'John Doe,+1234567890,john@example.com,Lead,Interested in 3BR home\n' +
      'Jane Smith,+1987654321,jane@example.com,Prospect,Looking to sell\n' +
      'Bob Johnson,+1555555555,bob@example.com,Client,Under contract\n';
    
    return new Response(
      JSON.stringify({ 
        success: true,
        fallbackContent: csvContent,
        message: 'Template generated successfully (fallback)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
