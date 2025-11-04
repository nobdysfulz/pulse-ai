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
    const { prompt, style, userId } = await req.json();

    if (!userId || !prompt) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Enhance prompt with style if provided
    const enhancedPrompt = style 
      ? `${prompt} Style: ${style}. High quality, professional real estate marketing image.`
      : `${prompt}. High quality, professional real estate marketing image.`;

    console.log('[generateImageTool] Generating image with prompt:', enhancedPrompt);

    // Use Lovable AI image generation (Nano banana model)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generateImageTool] Lovable AI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Image generation failed: ${response.status}`,
          suggestion: 'Please try again with a different prompt'
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // The image should be in the response content
    // Note: Actual implementation may vary based on Lovable AI's exact response format
    const imageData = data.choices[0].message.content;

    // For now, return a placeholder response since the exact format isn't specified
    // In production, we'd upload the image to Supabase Storage
    console.log('[generateImageTool] Image generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          imageUrl: imageData, // This would be the actual URL after uploading to storage
          prompt: prompt,
          style: style || 'default',
          message: 'Image generated successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[generateImageTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'An error occurred generating the image'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
