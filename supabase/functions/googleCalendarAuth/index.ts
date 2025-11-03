import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();

    console.log('googleCalendarAuth called with action:', action);

    // Stub implementation - returns false for token check
    if (action === 'check_token') {
      return new Response(
        JSON.stringify({ hasToken: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action not implemented' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 501 
      }
    );
  } catch (error) {
    console.error('Error in googleCalendarAuth:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
