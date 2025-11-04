import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders, createSupabaseAdmin, createSupabaseAuthedClient } from '../_shared/emailUtils.ts';
import { fetchRapidApiMarketData } from '../_shared/marketUtils.ts';

type MarketConfig = {
  geography_type?: string | null;
  state?: string | null;
  city?: string | null;
  market_name?: string | null;
};

type MarketDataPayload = {
  userId: string;
  geographyType: string;
  geographyName: string;
  geographyId: string;
  rawData: Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuthed = createSupabaseAuthedClient(authHeader);
    const supabaseAdmin = createSupabaseAdmin();

    const { data: authData, error: authError } = await supabaseAuthed.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId = body?.userId ?? authData.user.id;

    let geography: MarketConfig | null = null;
    if (body?.geography) {
      geography = body.geography;
    } else {
      const { data: configRow } = await supabaseAdmin
        .from('market_config')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();
      geography = configRow;
    }

    if (!geography) {
      return new Response(JSON.stringify({ error: 'Market configuration missing' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geographyType = geography.geography_type ?? 'city';
    const geographyName = geography.market_name ?? `${geography.city ?? ''}, ${geography.state ?? ''}`.trim();
    const geographyId = `${geography.state ?? 'unknown'}-${geography.city ?? 'unknown'}-${geographyType}`;

    const apiResult = await fetchRapidApiMarketData({
      state: geography.state ?? undefined,
      city: geography.city ?? undefined,
      geographyType,
    });

    if (apiResult.error) {
      console.warn('RapidAPI market data fetch failed:', apiResult.error);
    }

    const rawData = apiResult.raw ?? {};

    const { data: cached } = await supabaseAdmin
      .from('market_data')
      .upsert({
        user_id: targetUserId,
        geography_type: geographyType,
        geography_name: geographyName,
        geography_id: geographyId,
        raw_data: rawData,
        data_date: new Date().toISOString(),
      }, { onConflict: 'user_id,geography_id' })
      .select()
      .single();

    const responsePayload: MarketDataPayload = {
      userId: targetUserId,
      geographyType,
      geographyName,
      geographyId,
      rawData: cached?.raw_data ?? rawData,
    };

    return new Response(
      JSON.stringify({ success: true, marketData: responsePayload, error: apiResult.error ?? null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in marketDataFetcher:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
