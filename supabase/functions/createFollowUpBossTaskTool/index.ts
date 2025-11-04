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
    const { title, description, dueDate, personId, userId } = await req.json();

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get Follow Up Boss credentials
    const { data: connection } = await supabaseClient
      .from('external_service_connections')
      .select('credentials')
      .eq('user_id', userId)
      .eq('service_name', 'followupboss')
      .single();

    if (!connection) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Follow Up Boss not connected',
          suggestion: 'Please connect your Follow Up Boss account in Settings > Integrations'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = connection.credentials?.api_key;

    // Create task in Follow Up Boss
    const taskData: any = {
      name: title,
      note: description || '',
      dueDate: dueDate
    };

    if (personId) {
      taskData.personId = personId;
    }

    const response = await fetch('https://api.followupboss.com/v1/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[createFollowUpBossTaskTool] Follow Up Boss API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create task: ${error}`,
          suggestion: 'Please check your Follow Up Boss connection'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    console.log('[createFollowUpBossTaskTool] Task created:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          taskId: data.id,
          title: data.name,
          message: 'Follow Up Boss task created successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[createFollowUpBossTaskTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please ensure your Follow Up Boss account is connected'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
