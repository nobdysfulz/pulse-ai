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

    const { onboardingData } = await req.json();

    // Update agent config with onboarding data
    const { error: configError } = await supabaseClient
      .from('agent_config')
      .upsert({
        user_id: user.id,
        agent_type: onboardingData.agentType || 'executive_assistant',
        enabled: true,
        response_style: onboardingData.responseStyle || 'professional',
        personality_traits: onboardingData.personalityTraits || []
      });

    if (configError) throw configError;

    // Save guidelines if provided
    if (onboardingData.guidelines && onboardingData.guidelines.length > 0) {
      const guidelines = onboardingData.guidelines.map((g: any) => ({
        user_id: user.id,
        agent_type: onboardingData.agentType || 'executive_assistant',
        guideline_type: g.type,
        guideline_category: g.category,
        guideline_text: g.text
      }));

      const { error: guidelinesError } = await supabaseClient
        .from('user_guidelines')
        .insert(guidelines);

      if (guidelinesError) throw guidelinesError;
    }

    // Save knowledge items if provided
    if (onboardingData.knowledge && onboardingData.knowledge.length > 0) {
      const knowledgeItems = onboardingData.knowledge.map((k: any) => ({
        user_id: user.id,
        agent_type: onboardingData.agentType || 'executive_assistant',
        knowledge_type: k.type,
        title: k.title,
        content: k.content,
        metadata: k.metadata || {}
      }));

      const { error: knowledgeError } = await supabaseClient
        .from('user_knowledge')
        .insert(knowledgeItems);

      if (knowledgeError) throw knowledgeError;
    }

    // Mark agent onboarding as completed
    const { error: onboardingError } = await supabaseClient
      .from('user_onboarding')
      .update({ agent_onboarding_completed: true })
      .eq('user_id', user.id);

    if (onboardingError) throw onboardingError;

    return new Response(
      JSON.stringify({ success: true, message: 'Agent onboarding completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in finalizeAgentOnboarding:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
