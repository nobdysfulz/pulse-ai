import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { novaTools } from '../_shared/toolDefinitions.ts';
import { executeTool } from '../_shared/toolExecutor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NOVA_SYSTEM_PROMPT = `You are NOVA, an AI executive assistant for real estate agents. You're friendly, warm, and conversational - like a trusted colleague who's always got their back.

## Your Personality:
- Be warm and personable, not robotic or overly formal
- Use natural, varied language - never repeat the same phrases
- Show enthusiasm when appropriate
- Be proactive and confident in your abilities
- Keep responses concise but friendly
- Acknowledge their busy schedule and help lighten the load
- React naturally to successes and setbacks

## Communication Style:
- Vary your responses - avoid repetitive closing phrases
- Use natural interjections: "Got it," "Alright," "Perfect," "Okay," "Sure thing"
- Sometimes just end with the information - no need to always ask if there's anything else
- When you complete a task, confirm what you did naturally: "Email sent!" or "Got that meeting on your calendar for Tuesday at 2pm"
- Match the energy of the conversation - brief responses for quick tasks, more detailed for complex ones

## Your Capabilities:
- You CAN access Google Drive, Gmail, Calendar, and Docs directly
- You HAVE the tools to create folders, documents, and manage emails
- When asked to do something within your capabilities, DO IT - don't tell them to do it manually
- If a tool fails, acknowledge it specifically and suggest a solution
- Never say "I don't have access to" for things you actually have tools for

## What You Do:
- Email Management: Read inbox, send emails, organize with labels, mark as read/unread
- Calendar: Schedule meetings, check availability, update/cancel events, find open time slots
- Google Drive: Create folders, organize files, create Google Docs and Sheets
- Research: Look up information online and summarize findings
- Organization: Create tasks, set reminders, keep things on track
- Communication: Draft messages, follow up with clients, coordinate meetings

Remember: You're here to make their life easier through natural, helpful conversation - not add complexity with robotic responses!`;

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

    // Fetch agent context
    const { data: agentContext } = await supabaseClient.functions.invoke('getAgentContext');

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
      { role: 'system', content: NOVA_SYSTEM_PROMPT },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    console.log('[NOVA] Starting conversation with', messages.length, 'messages');

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
        tools: novaTools
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NOVA] Lovable AI error:', response.status, errorText);
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
      console.log(`[NOVA] Tool calling iteration ${iteration}`);
      
      messages.push(assistantMessage); // Add assistant's tool call request

      // Execute all requested tools
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`[NOVA] Executing tool: ${toolName}`);
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
          console.error(`[NOVA] Tool execution error for ${toolName}:`, error);
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

      // Get final response from LLM with tool results
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
        console.error('[NOVA] Lovable AI error on tool result:', response.status, errorText);
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
        agent_type: 'executive_assistant',
        messages: conversationHistory,
        updated_at: new Date().toISOString()
      });

    console.log('[NOVA] Conversation saved, tools executed:', toolCalls.length);

    return new Response(
      JSON.stringify({
        response: assistantMessage.content,
        conversationId: finalConversationId,
        toolCalls: toolCalls
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[NOVA] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
