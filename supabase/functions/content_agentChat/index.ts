import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { siriusTools } from '../_shared/toolDefinitions.ts';
import { executeTool } from '../_shared/toolExecutor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SIRIUS_SYSTEM_PROMPT = `You are SIRIUS, an expert AI Content Agent for real estate professionals. Your primary mission is to help users manage their social media presence effectively across Facebook and Instagram.

## Core Responsibilities:

1. Content Publishing & Scheduling:
   - Help users create and publish posts to Facebook Pages and Instagram Business accounts
   - Schedule posts for optimal timing based on audience activity
   - Support text, images, videos, and links
   - Always confirm post details before publishing
   - Provide post URLs and confirmation after successful publishing

2. Performance Analytics & Insights:
   - Provide comprehensive analytics for Facebook Pages and Instagram accounts
   - Calculate and explain engagement rates, reach, and impressions
   - Compare performance across different time periods
   - Identify top-performing content types and topics
   - Offer strategic recommendations based on data

3. Strategic Guidance:
   - Suggest optimal posting times based on audience activity
   - Recommend content types that perform best
   - Provide actionable insights from analytics
   - Help users improve their social media strategy

## Communication Style:
- Be professional yet conversational and friendly
- Provide clear, actionable insights from data
- Always confirm before publishing content
- Explain metrics in simple, understandable terms
- Offer strategic suggestions proactively
- Be concise but thorough in analysis

## Best Practices:
1. Before Publishing: Always show the user what will be posted and ask for confirmation
2. After Publishing: Provide the post URL and confirm successful publication
3. Analytics: Present data with context and actionable insights, not just raw numbers
4. Strategy: Use insights to make specific recommendations for improvement

Remember: You are SIRIUS - the content expert. Your goal is to make social media management effortless and effective for busy real estate professionals.`;

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

    const { message, conversationId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Load conversation history
    let conversationHistory: any[] = [];
    if (conversationId) {
      const { data: conversation } = await supabaseClient
        .from('ai_agent_conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (conversation?.messages) {
        conversationHistory = Array.isArray(conversation.messages) ? conversation.messages : [];
      }
    }

    // Build messages array
    const messages = [
      { role: 'system', content: SIRIUS_SYSTEM_PROMPT },
      ...conversationHistory.slice(-10),
      { role: 'user', content: message }
    ];

    console.log('[SIRIUS] Starting conversation');

    // Initial LLM call with tools
    let response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools: siriusTools
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SIRIUS] Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    let data = await response.json();
    let assistantMessage = data.choices[0].message;
    const toolCalls: any[] = [];

    // Tool calling loop
    let maxIterations = 5;
    let iteration = 0;
    
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && iteration < maxIterations) {
      iteration++;
      console.log(`[SIRIUS] Tool calling iteration ${iteration}`);
      
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`[SIRIUS] Executing tool: ${toolName}`);
        toolCalls.push({ name: toolName, args: toolArgs });

        try {
          const toolResult = await executeTool(
            toolName,
            toolArgs,
            user.id,
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
          );

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify(toolResult)
          });
        } catch (error) {
          console.error(`[SIRIUS] Tool execution error for ${toolName}:`, error);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          });
        }
      }

      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SIRIUS] Lovable AI error on tool result:', response.status, errorText);
        break;
      }

      data = await response.json();
      assistantMessage = data.choices[0].message;
    }

    // Save conversation
    const finalConversationId = conversationId || crypto.randomUUID();
    conversationHistory.push({ role: 'user', content: message });
    conversationHistory.push({ role: 'assistant', content: assistantMessage.content });

    await supabaseClient
      .from('ai_agent_conversations')
      .upsert({
        id: finalConversationId,
        user_id: user.id,
        agent_type: 'content_agent',
        messages: conversationHistory,
        updated_at: new Date().toISOString()
      });

    console.log('[SIRIUS] Conversation saved, tools executed:', toolCalls.length);

    return new Response(
      JSON.stringify({
        response: assistantMessage.content,
        conversationId: finalConversationId,
        toolCalls: toolCalls
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SIRIUS] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
