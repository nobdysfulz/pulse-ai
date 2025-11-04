const RAPIDAPI_HOST = 'redfin-com-data.p.rapidapi.com';

export async function fetchRapidApiMarketData(config: { state?: string | null; city?: string | null; geographyType: string }) {
  const apiKey = Deno.env.get('RAPIDAPI_MARKET_METRICS_API_KEY');
  if (!apiKey) {
    return { raw: null, error: 'API key missing' };
  }

  const params = new URLSearchParams();
  if (config.state) params.append('state', config.state);
  if (config.city) params.append('city', config.city);
  params.append('geographyType', config.geographyType || 'city');

  const url = `https://${RAPIDAPI_HOST}/market-trends?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return { raw: null, error: `HTTP ${response.status}: ${text}` };
    }

    const data = await response.json();
    return { raw: data, error: null };
  } catch (error) {
    return { raw: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
