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
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { userPrompt, conversationId, agentContext, conversationHistory, currentTab } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const historyMessages = Array.isArray(conversationHistory)
      ? conversationHistory
          .filter((msg) => msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string')
          .slice(-8)
      : [];

    const formattedGoals = Array.isArray(agentContext?.goals)
      ? agentContext.goals.slice(0, 5).map((goal: any) => `${goal.title || 'Goal'} (${goal.status || 'unknown'})`).join(', ')
      : '';

    const formattedRecentActions = Array.isArray(agentContext?.recentActions)
      ? agentContext.recentActions.slice(0, 5).map((action: any) => `${action.title || 'Action'} - ${action.status || 'pending'}`).join('; ')
      : '';

    const focusArea = currentTab === 'advisor'
      ? 'Provide tactical advice, next steps, and encouragement tailored to the agent’s immediate needs.'
      : 'Offer strategic guidance aligned with the agent’s goals and productivity.';

    // Build system prompt based on context
    const systemPrompt = `You are PULSE AI, a professional real estate business advisor.
You help real estate agents with strategy, market insights, goal planning, and daily productivity.

Agent Context:
${agentContext?.profile?.full_name ? `- Agent: ${agentContext.profile.full_name}` : '- Agent: Unknown'}
${agentContext?.market?.market_name ? `- Market: ${agentContext.market.market_name}` : ''}
${agentContext?.intelligence?.scores ? `- Performance Scores: PULSE ${agentContext.intelligence.scores.pulse || 0}, GANE ${agentContext.intelligence.scores.gane || 0}, MORO ${agentContext.intelligence.scores.moro || 0}` : ''}
${formattedGoals ? `- Active Goals: ${formattedGoals}` : ''}
${formattedRecentActions ? `- Recent Actions: ${formattedRecentActions}` : ''}

Conversation Focus:
- ${focusArea}
- When appropriate, suggest measurable next steps tied to their goals and market conditions.
- Keep responses structured with short paragraphs or bullet points for readability.`;

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userPrompt }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue using AI features.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;

    // Save conversation if conversationId is provided
    let finalConversationId = conversationId;
    if (!finalConversationId) {
      finalConversationId = crypto.randomUUID();
    }

    return new Response(
      JSON.stringify({ 
        response: responseText,
        conversationId: finalConversationId,
        toolCalls: [] // No tool calls for now
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in copilotChat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
