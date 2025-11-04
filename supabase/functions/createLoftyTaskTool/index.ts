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
    const { title, description, dueDate, contactId, userId } = await req.json();

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get Lofty credentials
    const { data: connection } = await supabaseClient
      .from('external_service_connections')
      .select('credentials')
      .eq('user_id', userId)
      .eq('service_name', 'lofty')
      .single();

    if (!connection) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Lofty CRM not connected',
          suggestion: 'Please connect your Lofty CRM in Settings > Integrations'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = connection.credentials?.api_key;
    const apiUrl = connection.credentials?.api_url || 'https://api.lofty.com/v1';

    // Create task in Lofty
    const taskData: any = {
      title,
      description: description || '',
      due_date: dueDate
    };

    if (contactId) {
      taskData.contact_id = contactId;
    }

    const response = await fetch(`${apiUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[createLoftyTaskTool] Lofty API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create task: ${error}`,
          suggestion: 'Please check your Lofty CRM connection'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    console.log('[createLoftyTaskTool] Task created:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          taskId: data.id,
          title: data.title,
          message: 'Lofty task created successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[createLoftyTaskTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please ensure your Lofty CRM is connected'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
