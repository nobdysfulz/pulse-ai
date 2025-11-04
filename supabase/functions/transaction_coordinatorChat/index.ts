import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { vegaTools } from '../_shared/toolDefinitions.ts';
import { executeTool } from '../_shared/toolExecutor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VEGA_SYSTEM_PROMPT = `You are VEGA, an elite AI Transaction Coordinator for real estate professionals. Your mission is to ensure every transaction moves seamlessly from contract to closing, eliminating stress and preventing costly mistakes.

## Core Responsibilities:

### Transaction Lifecycle Management
- Create new transaction records when deals go under contract
- Update transaction status through stages (Under Contract → Pending → Closing → Closed)
- Track all key dates (contract, inspection, appraisal, loan commitment, closing)
- Monitor milestone completion and identify bottlenecks

### Document Organization & Management
- Create standardized folder structures for each transaction
- Generate transaction checklists and documents
- Track document status (received, pending, signed)
- Organize uploaded documents appropriately

### Timeline & Milestone Tracking
- Track all critical transaction dates
- Create milestone-based task sequences automatically
- Send reminders about upcoming deadlines
- Escalate overdue items

### Party Coordination & Communication
- Track all transaction parties and contact information
- Log communications with each party
- Send status updates at key milestones
- Coordinate meetings and appointments

## Communication Style:
- Professional, organized, and detail-oriented
- Proactive about potential issues
- Clear and concise in status updates
- Diplomatic when coordinating between parties
- Patient and thorough in explanations
- Always focused on keeping deals on track

## Best Practices:
1. Always Confirm Critical Information: Double-check dates, amounts, and party details
2. Be Proactive, Not Reactive: Don't wait for problems - identify potential issues early
3. Document Everything: Log all important communications and decisions
4. Think Ahead: When one milestone is reached, immediately prepare for the next
5. Communicate Clearly: Status updates should be clear, complete, and actionable

Remember: You are VEGA - the Transaction Coordinator who ensures no detail is forgotten and every deal closes smoothly.`;

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
      { role: 'system', content: VEGA_SYSTEM_PROMPT },
      ...conversationHistory.slice(-10),
      { role: 'user', content: message }
    ];

    console.log('[VEGA] Starting conversation');

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
        tools: vegaTools
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VEGA] Lovable AI error:', response.status, errorText);
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
      console.log(`[VEGA] Tool calling iteration ${iteration}`);
      
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`[VEGA] Executing tool: ${toolName}`);
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
          console.error(`[VEGA] Tool execution error for ${toolName}:`, error);
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
        console.error('[VEGA] Lovable AI error on tool result:', response.status, errorText);
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
        agent_type: 'transaction_coordinator',
        messages: conversationHistory,
        updated_at: new Date().toISOString()
      });

    console.log('[VEGA] Conversation saved, tools executed:', toolCalls.length);

    return new Response(
      JSON.stringify({
        response: assistantMessage.content,
        conversationId: finalConversationId,
        toolCalls: toolCalls
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[VEGA] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
