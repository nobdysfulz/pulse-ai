import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Whitelist of allowed tables for security
const ALLOWED_TABLES = [
  'profiles', 'user_onboarding', 'market_config', 'user_preferences', 'daily_actions',
  'agent_config', 'user_agent_subscription', 'goals', 'business_plans', 'pulse_scores',
  'pulse_config', 'agent_intelligence_profiles', 'brand_color_palettes', 'content_packs',
  'content_topics', 'credit_transactions', 'crm_connections', 'email_campaigns',
  'email_templates', 'external_service_connections', 'generated_content', 'market_intelligence',
  'referrals', 'role_play_session_logs', 'role_play_user_progress', 'call_logs',
  'ai_agent_conversations', 'ai_actions_log', 'ai_tool_usage', 'transactions',
  'role_play_scenarios', 'objection_scripts', 'client_personas', 'agent_voices',
  'task_templates', 'featured_content_packs', 'campaign_templates', 'legal_documents',
  'feature_flags', 'ai_prompt_configs', 'graph_context_cache', 'user_credits'
];

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

    const token = authHeader.substring(7);

    // Decode JWT to get user ID
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub;

    // Parse request body
    const body = await req.json();
    const { table, operation, filters = {}, data, id } = body;

    if (!table || !operation) {
      return new Response(
        JSON.stringify({ error: 'Missing table or operation in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_TABLES.includes(table)) {
      return new Response(
        JSON.stringify({ error: `Operations on table '${table}' are not allowed` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[entityOperations] ${operation} on ${table} for user:`, userId);

    // Create Supabase admin client (service role bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let result;

    switch (operation) {
      case 'list': {
        const { limit = 100, order, ascending = true } = filters;
        let query = supabase.from(table).select('*').limit(limit);
        
        if (order) {
          query = query.order(order, { ascending });
        }
        
        const { data: rows, error } = await query;
        if (error) throw error;
        result = { data: rows };
        break;
      }

      case 'filter': {
        const { limit = 100, order, ascending = true, ...filterParams } = filters;
        let query = supabase.from(table).select('*').limit(limit);
        
        // Apply filters
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
        
        if (order) {
          query = query.order(order, { ascending });
        }
        
        const { data: rows, error } = await query;
        if (error) throw error;
        result = { data: rows };
        break;
      }

      case 'get': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Missing id for get operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: row, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        result = { data: row };
        break;
      }

      case 'create': {
        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Missing data for create operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Auto-inject user_id if table has it
        const createData = { ...data };
        if (table !== 'profiles') {
          createData.user_id = userId;
        } else {
          createData.id = userId;
        }

        const { data: row, error } = await supabase
          .from(table)
          .insert(createData)
          .select()
          .single();
        
        if (error) throw error;
        result = { data: row };
        break;
      }

      case 'update': {
        if (!id || !data) {
          return new Response(
            JSON.stringify({ error: 'Missing id or data for update operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: row, error } = await supabase
          .from(table)
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        result = { data: row };
        break;
      }

      case 'delete': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Missing id for delete operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        result = { success: true };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[entityOperations] ✓ ${operation} completed successfully`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[entityOperations] Error:', error);
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
