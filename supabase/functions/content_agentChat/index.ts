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
    console.log('[Content Agent Chat] Request received:', new Date().toISOString());

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
      console.error('[Content Agent Chat] Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('[Content Agent Chat] User authenticated:', user.id);

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
      .eq('agent_type', 'content_agent');

    const { data: marketConfig } = await supabase
      .from('market_configuration')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: recentContent } = await supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('[Content Agent Chat] Context fetched');

    // Build system prompt for SIRIUS (Content Agent)
    const systemPrompt = `You are SIRIUS, an AI Content Specialist for ${profile?.full_name || 'the user'}, a real estate professional.

Your role is to help with:
- Social media content creation and strategy
- Blog post writing and SEO optimization
- Email marketing campaigns
- Video script writing
- Content calendar planning
- Engagement strategies

${marketConfig ? `\nMarket Focus: ${marketConfig.city}, ${marketConfig.state}
Specialization: ${marketConfig.property_types?.join(', ') || 'General Real Estate'}` : ''}

${guidelines?.length ? `\nCustom Guidelines:\n${guidelines.map(g => `- ${g.guideline_text}`).join('\n')}` : ''}

${recentContent?.length ? `\nRecent Content Performance:
${recentContent.map(c => `- ${c.content_type}: "${c.title || 'Untitled'}"`).join('\n')}` : ''}

Be creative, engaging, and data-driven. Help create content that resonates with the target audience.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userPrompt }
    ];

    console.log('[Content Agent Chat] Calling Lovable AI Gateway...');

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
      console.error('[Content Agent Chat] AI Gateway error:', response.status, errorText);
      
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

    console.log('[Content Agent Chat] Response generated successfully');

    // Save conversation
    if (conversationId) {
      await supabase.from('agent_conversations').upsert({
        id: conversationId,
        user_id: user.id,
        agent_type: 'content_agent',
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
    console.error('[Content Agent Chat] Error:', error);
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
