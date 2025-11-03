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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();
    console.log('Computing MORO score for user:', userId);

    // Fetch user's market config
    const { data: marketConfig, error: marketError } = await supabaseClient
      .from('market_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (marketError && marketError.code !== 'PGRST116') throw marketError;

    // Calculate market score based on config
    let moroScore = 50; // Default baseline
    const metrics: any = {
      hasMarketConfig: !!marketConfig,
    };

    if (marketConfig) {
      // Market trend scoring (0-30 points)
      let trendScore = 15; // neutral
      if (marketConfig.market_trend === 'hot') trendScore = 30;
      else if (marketConfig.market_trend === 'warming') trendScore = 22;
      else if (marketConfig.market_trend === 'cooling') trendScore = 8;
      else if (marketConfig.market_trend === 'cold') trendScore = 0;
      
      // Inventory level scoring (0-30 points)
      let inventoryScore = 15; // balanced
      if (marketConfig.inventory_level === 'low') inventoryScore = 30;
      else if (marketConfig.inventory_level === 'moderate') inventoryScore = 20;
      else if (marketConfig.inventory_level === 'high') inventoryScore = 10;
      
      // Days on market efficiency (0-20 points)
      let domScore = 10;
      if (marketConfig.median_dom) {
        if (marketConfig.median_dom < 30) domScore = 20;
        else if (marketConfig.median_dom < 60) domScore = 15;
        else if (marketConfig.median_dom < 90) domScore = 10;
        else domScore = 5;
      }
      
      // Price point presence (0-20 points)
      const priceScore = marketConfig.average_price ? 20 : 0;
      
      moroScore = Math.round(trendScore + inventoryScore + domScore + priceScore);
      
      metrics.marketTrend = marketConfig.market_trend;
      metrics.inventoryLevel = marketConfig.inventory_level;
      metrics.medianDOM = marketConfig.median_dom;
      metrics.averagePrice = marketConfig.average_price;
      metrics.trendScore = trendScore;
      metrics.inventoryScore = inventoryScore;
      metrics.domScore = domScore;
      metrics.priceScore = priceScore;
    }

    // Store snapshot
    const { error: insertError } = await supabaseClient
      .from('moro_engine_snapshots')
      .insert({
        user_id: userId,
        score: moroScore,
        metrics,
        computed_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    console.log('MORO score computed:', moroScore);

    return new Response(
      JSON.stringify({ score: moroScore, metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error computing MORO:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
