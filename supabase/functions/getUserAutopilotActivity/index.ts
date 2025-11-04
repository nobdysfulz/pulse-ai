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

    const { timeRange = '7d', limit = 100 } = await req.json();

    // Calculate date range
    const now = new Date();
    const daysAgo = timeRange === '24h' ? 1 : parseInt(timeRange) || 7;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Fetch AI action logs
    const { data: actionLogs, error: logsError } = await supabaseClient
      .from('ai_actions_log')
      .select('*')
      .eq('user_id', user.id)
      .gte('executed_at', startDate.toISOString())
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (logsError) throw logsError;

    // Fetch recent AI conversations
    const { data: conversations, error: convError } = await supabaseClient
      .from('ai_agent_conversations')
      .select('id, agent_type, created_at, updated_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (convError) throw convError;

    // Fetch recent call logs
    const { data: callLogs, error: callError } = await supabaseClient
      .from('call_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (callError) throw callError;

    // Calculate activity summary
    const summary = {
      totalActions: actionLogs?.length || 0,
      totalConversations: conversations?.length || 0,
      totalCalls: callLogs?.length || 0,
      actionsByType: (actionLogs || []).reduce((acc: any, log: any) => {
        acc[log.action_type] = (acc[log.action_type] || 0) + 1;
        return acc;
      }, {}),
      conversationsByAgent: (conversations || []).reduce((acc: any, conv: any) => {
        acc[conv.agent_type] = (acc[conv.agent_type] || 0) + 1;
        return acc;
      }, {}),
      callsByType: (callLogs || []).reduce((acc: any, call: any) => {
        acc[call.call_type] = (acc[call.call_type] || 0) + 1;
        return acc;
      }, {})
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        timeRange,
        summary,
        activities: {
          actions: actionLogs || [],
          conversations: conversations || [],
          calls: callLogs || []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in getUserAutopilotActivity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
