import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { validateSupabaseAuth } from '../_shared/supabaseAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Get Clerk token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userId: string;
    try {
      userId = await validateSupabaseAuth(authHeader);
      console.log(`[updateUserData] ✓ Validated user: ${userId}`);
    } catch (error) {
      console.error('[updateUserData] JWT validation failed:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired JWT token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { table, data } = body;

    if (!table || !data) {
      return new Response(
        JSON.stringify({ error: 'Missing table or data in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Whitelist of allowed tables for user updates
    const allowedTables = [
      'profiles',
      'market_config',
      'user_preferences',
      'agent_config',
      'agent_intelligence_profiles',
      'business_plans',
      'pulse_config',
    ];

    if (!allowedTables.includes(table)) {
      return new Response(
        JSON.stringify({ error: `Updates to table '${table}' are not allowed` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[updateUserData] Updating', table, 'for user:', userId);

    // Create Supabase admin client (service role bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Prepare update data with user_id
    const updateData = {
      ...data,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    // For profiles table, use 'id' instead of 'user_id'
    const idColumn = table === 'profiles' ? 'id' : 'user_id';
    const idValue = userId;

    // Upsert data using service role
    const { data: result, error } = await supabase
      .from(table)
      .upsert(
        table === 'profiles' ? { id: userId, ...data, updated_at: new Date().toISOString() } : updateData,
        { onConflict: idColumn }
      )
      .select()
      .single();

    if (error) {
      console.error('[updateUserData] Update error:', error);
      throw error;
    }

    console.log('[updateUserData] ✓ Data updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        data: result,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[updateUserData] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
