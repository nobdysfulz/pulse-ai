import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, focus, userId } = await req.json();

    if (!userId || !query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: query' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build research prompt
    const researchPrompt = focus 
      ? `Research the following topic with a focus on ${focus}: ${query}\n\nProvide a concise summary with key findings and actionable insights.`
      : `Research the following topic: ${query}\n\nProvide a concise summary with key findings and actionable insights.`;

    console.log('[researchAndSummarizeTool] Researching:', query);

    // Use Lovable AI with web search capability
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant. Provide concise, accurate summaries with actionable insights. Focus on the most important and relevant information.'
          },
          {
            role: 'user',
            content: researchPrompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[researchAndSummarizeTool] Lovable AI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Research failed: ${response.status}`,
          suggestion: 'Please try again or rephrase your query'
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    console.log('[researchAndSummarizeTool] Research completed');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          query: query,
          summary: summary,
          focus: focus || 'general',
          message: 'Research completed successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[researchAndSummarizeTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'An error occurred during research'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
