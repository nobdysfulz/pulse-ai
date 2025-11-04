import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Transaction Coordinator Chat] Request received:', new Date().toISOString());

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[Transaction Coordinator Chat] Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('[Transaction Coordinator Chat] User authenticated:', user.id);

    const { userPrompt, conversationId, conversationHistory = [] } = await req.json();

    // Fetch agent context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: guidelines } = await supabase
      .from('user_guidelines')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_type', 'transaction_coordinator');

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: graphContext } = await supabase
      .from('graph_context')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('[Transaction Coordinator Chat] Context fetched');

    // Build system prompt for VEGA (Transaction Coordinator)
    const systemPrompt = `You are VEGA, an AI Transaction Coordinator for ${profile?.full_name || 'the user'}, a real estate professional.

Your role is to help with:
- Transaction management and milestone tracking
- Document coordination and compliance
- Client communication and updates
- Deadline management
- Stakeholder coordination (buyers, sellers, lenders, attorneys)

${transactions?.length ? `\nActive Transactions:
${transactions.map(t => `- ${t.property_address}: ${t.transaction_type} (${t.stage || 'In Progress'})`).join('\n')}` : ''}

${guidelines?.length ? `\nCustom Guidelines:\n${guidelines.map(g => `- ${g.guideline_text}`).join('\n')}` : ''}

${graphContext ? `\nPerformance Context:
- Current Pipeline: ${graphContext.active_transactions || 0} active deals
- YTD Volume: $${graphContext.ytd_volume?.toLocaleString() || '0'}` : ''}

Be organized, detail-oriented, and proactive. Help ensure smooth transaction processes and timely closings.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userPrompt }
    ];

    console.log('[Transaction Coordinator Chat] Calling Lovable AI Gateway...');

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
      const errorText = await response.text();
      console.error('[Transaction Coordinator Chat] AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      if (response.status === 402) {
        throw new Error('PAYMENT_REQUIRED');
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    console.log('[Transaction Coordinator Chat] Response generated successfully');

    // Save conversation
    if (conversationId) {
      await supabase.from('agent_conversations').upsert({
        id: conversationId,
        user_id: user.id,
        agent_type: 'transaction_coordinator',
        messages: [...conversationHistory, 
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: assistantMessage }
        ],
        updated_at: new Date().toISOString()
      });
    }

    return new Response(
      JSON.stringify({ 
        response: assistantMessage,
        conversationId: conversationId || crypto.randomUUID()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Transaction Coordinator Chat] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage === 'Unauthorized' ? 401 : 
                       errorMessage === 'RATE_LIMIT_EXCEEDED' ? 429 :
                       errorMessage === 'PAYMENT_REQUIRED' ? 402 : 500;
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
