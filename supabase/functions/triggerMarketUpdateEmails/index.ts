import "https://deno.land/x/xhr@0.1.0/mod.ts";
import {
  corsHeaders,
  createSupabaseAdmin,
  fetchEmailTemplate,
  renderTemplateBody,
  sendEmail,
  logEmailDelivery,
} from '../_shared/emailUtils.ts';
import { fetchRapidApiMarketData } from '../_shared/marketUtils.ts';

const summarizeMarketMetrics = (rawData: Record<string, unknown>) => {
  const metrics = rawData?.metrics ?? rawData ?? {};
  const medianPrice = metrics?.median_sale_price ?? metrics?.medianPrice ?? 'N/A';
  const inventory = metrics?.inventory ?? metrics?.inventory_level ?? 'N/A';
  const dom = metrics?.days_on_market ?? metrics?.dom ?? 'N/A';
  const trend = metrics?.price_trend ?? metrics?.priceTrend ?? 'flat';
  return { medianPrice, inventory, dom, trend };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseAdmin();
    const template = await fetchEmailTemplate('market_update_email');

    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('email_notifications', true)
      .eq('market_updates', true);

    if (!preferences || preferences.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userIds = preferences.map((pref) => pref.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    let sent = 0;

    for (const profile of profiles ?? []) {
      if (!profile?.email) continue;

      const { data: marketConfig } = await supabase
        .from('market_config')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (!marketConfig) {
        console.warn('Skipping market update: no market config for user', profile.id);
        continue;
      }

      const { data: cachedData } = await supabase
        .from('market_data')
        .select('*')
        .eq('user_id', profile.id)
        .eq('geography_id', `${marketConfig.state ?? 'unknown'}-${marketConfig.city ?? 'unknown'}-${marketConfig.geography_type ?? 'city'}`)
        .maybeSingle();

      let rawData = cachedData?.raw_data ?? {};
      let fetchError = null;

      const apiResult = await fetchRapidApiMarketData({
        state: marketConfig.state ?? undefined,
        city: marketConfig.city ?? undefined,
        geographyType: marketConfig.geography_type ?? 'city',
      });

      if (apiResult.raw) {
        rawData = apiResult.raw;
        await supabase
          .from('market_data')
          .upsert({
            user_id: profile.id,
            geography_type: marketConfig.geography_type ?? 'city',
            geography_name: marketConfig.market_name ?? '',
            geography_id: `${marketConfig.state ?? 'unknown'}-${marketConfig.city ?? 'unknown'}-${marketConfig.geography_type ?? 'city'}`,
            raw_data: rawData,
            data_date: new Date().toISOString(),
          }, { onConflict: 'user_id,geography_id' });
      } else if (apiResult.error) {
        fetchError = apiResult.error;
      }

      const summary = summarizeMarketMetrics(rawData as Record<string, unknown>);
      const variables = {
        firstName: profile.full_name?.split(' ')[0] ?? 'there',
        marketName: marketConfig.market_name ?? `${marketConfig.city ?? ''}, ${marketConfig.state ?? ''}`.trim(),
        medianPrice: summary.medianPrice,
        inventory: summary.inventory,
        daysOnMarket: summary.dom,
        priceTrend: summary.trend,
        fetchError,
      };

      const rendered = renderTemplateBody(template, variables);
      const fallbackHtml = `
        <h2>${variables.marketName} Market Update</h2>
        <p>Hello ${variables.firstName}, here are the latest numbers for your territory.</p>
        <ul>
          <li>Median price: ${variables.medianPrice}</li>
          <li>Inventory: ${variables.inventory}</li>
          <li>Days on market: ${variables.daysOnMarket}</li>
          <li>Trend: ${variables.priceTrend}</li>
        </ul>
        ${fetchError ? `<p style="color:red">Live refresh failed: ${fetchError}</p>` : ''}
      `;

      try {
        await sendEmail({
          to: profile.email,
          subject: `${variables.marketName} market update`,
          html: rendered.html ?? fallbackHtml,
          text: rendered.text ?? `${variables.marketName} market update`,
        });

        await logEmailDelivery({
          userId: profile.id,
          emailType: 'market',
          templateKey: template?.template_key ?? 'market_update_email',
          metadata: {
            marketName: variables.marketName,
            fetchError,
          },
        });

        sent += 1;
      } catch (error) {
        console.error('Failed to send market update email:', error);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in triggerMarketUpdateEmails:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
