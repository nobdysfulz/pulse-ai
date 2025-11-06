import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { validateClerkTokenWithJose } from '../_shared/clerkAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Error codes for easy filtering
const ERROR_CODES = {
  DB_SCHEMA_MISMATCH: 'DB001',
  AUTH_VALIDATION_FAILED: 'AUTH001',
  ENV_MISSING: 'CONFIG001',
  INVALID_TABLE: 'DB002',
  INVALID_OPERATION: 'REQ002',
  MISSING_PARAMS: 'REQ003',
} as const;

// Whitelist of allowed tables for security
const ALLOWED_TABLES = [
  'profiles', 'user_onboarding', 'market_config', 'user_preferences', 'daily_actions',
  'agent_config', 'user_agent_subscription', 'goals', 'business_plans', 'pulse_scores',
  'pulse_config', 'agent_intelligence_profiles', 'brand_color_palettes', 'content_packs',
  'content_topics', 'credit_transactions', 'crm_connections', 'email_campaigns',
  'email_templates', 'external_service_connections', 'generated_content', 'market_intelligence',
  'referrals', 'role_play_session_logs', 'role_play_user_progress', 'role_play_analysis_reports', 
  'call_logs', 'ai_agent_conversations', 'ai_actions_log', 'ai_tool_usage', 'transactions',
  'role_play_scenarios', 'objection_scripts', 'client_personas', 'agent_voices',
  'task_templates', 'featured_content_packs', 'campaign_templates', 'legal_documents',
  'feature_flags', 'ai_prompt_configs', 'graph_context_cache', 'user_credits'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody: any;
  try {
    // 🔧 Environment validation
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('🔧 ENVIRONMENT_CHECK:', {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceRoleKey: !!SERVICE_ROLE_KEY,
      functionName: 'entityOperations',
      timestamp: new Date().toISOString()
    });

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error(`🚨 [${ERROR_CODES.ENV_MISSING}] Missing required environment variables`);
      throw new Error('Missing required environment variables');
    }

    // 📨 Log incoming request
    const authHeader = req.headers.get('Authorization');
    console.log('📨 INCOMING_REQUEST:', {
      method: req.method,
      hasAuthHeader: !!authHeader,
      url: req.url,
      timestamp: new Date().toISOString()
    });

    if (!authHeader?.startsWith('Bearer ')) {
      console.error(`🚨 [${ERROR_CODES.AUTH_VALIDATION_FAILED}] Missing or invalid Authorization header`);
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header', code: ERROR_CODES.AUTH_VALIDATION_FAILED }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    
    // ✅ Validate Clerk JWT
    let userId: string;
    try {
      userId = await validateClerkTokenWithJose(token);
      console.log('✅ AUTH_VALIDATION_SUCCESS:', {
        userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`🚨 [${ERROR_CODES.AUTH_VALIDATION_FAILED}] JWT validation failed:`, {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      return new Response(
        JSON.stringify({ error: 'Invalid or expired JWT token', code: ERROR_CODES.AUTH_VALIDATION_FAILED }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    requestBody = await req.json();
    const { table, operation, filters = {}, data, id } = requestBody;

    console.log('📦 REQUEST_BODY_PARSED:', {
      table,
      operation,
      hasFilters: !!filters,
      hasData: !!data,
      hasId: !!id,
      userId,
      timestamp: new Date().toISOString()
    });

    if (!table || !operation) {
      console.error(`🚨 [${ERROR_CODES.MISSING_PARAMS}] Missing table or operation`);
      return new Response(
        JSON.stringify({ error: 'Missing table or operation in request body', code: ERROR_CODES.MISSING_PARAMS }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate table is in whitelist
    if (!ALLOWED_TABLES.includes(table)) {
      console.error(`🚨 [${ERROR_CODES.INVALID_TABLE}] Table not in whitelist:`, {
        table,
        allowedTables: ALLOWED_TABLES,
        timestamp: new Date().toISOString()
      });
      return new Response(
        JSON.stringify({ error: `Table '${table}' is not allowed`, code: ERROR_CODES.INVALID_TABLE }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🏗️ OPERATION_VALIDATION:', {
      table,
      operation,
      userId,
      isAllowedTable: ALLOWED_TABLES.includes(table),
      timestamp: new Date().toISOString()
    });

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    console.log('📊 DB_OPERATION_START:', {
      table,
      operation,
      userId,
      timestamp: new Date().toISOString()
    });

    let result;

    switch (operation) {
      case 'list': {
        const { limit = 100, order, ascending = true } = filters;
        let query = supabase.from(table).select('*').limit(limit);
        
        if (order) {
          query = query.order(order, { ascending });
        }
        
        const { data: rows, error } = await query;
        
        if (error) {
          console.error(`❌ [${ERROR_CODES.DB_SCHEMA_MISMATCH}] DB_OPERATION_FAILED (list):`, {
            table,
            error: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            timestamp: new Date().toISOString()
          });
          throw error;
        }
        console.log('✅ DB_OPERATION_SUCCESS (list):', { table, count: rows?.length, timestamp: new Date().toISOString() });
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
        
        if (error) {
          console.error(`❌ [${ERROR_CODES.DB_SCHEMA_MISMATCH}] DB_OPERATION_FAILED (filter):`, {
            table,
            filters,
            error: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            timestamp: new Date().toISOString()
          });
          throw error;
        }

        console.log('✅ DB_OPERATION_SUCCESS (filter):', { 
          table, 
          count: rows?.length,
          filters,
          timestamp: new Date().toISOString() 
        });
        result = { data: rows };
        break;
      }

      case 'get': {
        if (!id) {
          console.error(`🚨 [${ERROR_CODES.MISSING_PARAMS}] Missing id for get operation`);
          return new Response(
            JSON.stringify({ error: 'Missing id for get operation', code: ERROR_CODES.MISSING_PARAMS }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: row, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error(`❌ [${ERROR_CODES.DB_SCHEMA_MISMATCH}] DB_OPERATION_FAILED (get):`, {
            table,
            id,
            error: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            timestamp: new Date().toISOString()
          });
          throw error;
        }
        console.log('✅ DB_OPERATION_SUCCESS (get):', { table, id, timestamp: new Date().toISOString() });
        result = { data: row };
        break;
      }

      case 'create': {
        if (!data) {
          console.error(`🚨 [${ERROR_CODES.MISSING_PARAMS}] Missing data for create operation`);
          return new Response(
            JSON.stringify({ error: 'Missing data for create operation', code: ERROR_CODES.MISSING_PARAMS }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // For user-scoped tables, automatically set user_id
        const createData = table === 'profiles' 
          ? { ...data, id: userId }
          : { ...data, user_id: userId };

        console.log('📊 DB_CREATE_DATA:', {
          table,
          dataKeys: Object.keys(createData),
          timestamp: new Date().toISOString()
        });

        const { data: row, error } = await supabase
          .from(table)
          .insert(createData)
          .select()
          .single();

        if (error) {
          console.error(`❌ [${ERROR_CODES.DB_SCHEMA_MISMATCH}] DB_OPERATION_FAILED (create):`, {
            table,
            error: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            createData,
            timestamp: new Date().toISOString()
          });
          throw error;
        }
        console.log('✅ DB_OPERATION_SUCCESS (create):', { table, id: row?.id, timestamp: new Date().toISOString() });
        result = { data: row };
        break;
      }

      case 'update': {
        if (!id || !data) {
          console.error(`🚨 [${ERROR_CODES.MISSING_PARAMS}] Missing id or data for update operation`);
          return new Response(
            JSON.stringify({ error: 'Missing id or data for update operation', code: ERROR_CODES.MISSING_PARAMS }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: row, error } = await supabase
          .from(table)
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error(`❌ [${ERROR_CODES.DB_SCHEMA_MISMATCH}] DB_OPERATION_FAILED (update):`, {
            table,
            id,
            error: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            timestamp: new Date().toISOString()
          });
          throw error;
        }
        console.log('✅ DB_OPERATION_SUCCESS (update):', { table, id, timestamp: new Date().toISOString() });
        result = { data: row };
        break;
      }

      case 'delete': {
        if (!id) {
          console.error(`🚨 [${ERROR_CODES.MISSING_PARAMS}] Missing id for delete operation`);
          return new Response(
            JSON.stringify({ error: 'Missing id for delete operation', code: ERROR_CODES.MISSING_PARAMS }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);

        if (error) {
          console.error(`❌ [${ERROR_CODES.DB_SCHEMA_MISMATCH}] DB_OPERATION_FAILED (delete):`, {
            table,
            id,
            error: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            timestamp: new Date().toISOString()
          });
          throw error;
        }
        console.log('✅ DB_OPERATION_SUCCESS (delete):', { table, id, timestamp: new Date().toISOString() });
        result = { success: true };
        break;
      }

      default:
        console.error(`🚨 [${ERROR_CODES.INVALID_OPERATION}] Invalid operation: ${operation}`);
        return new Response(
          JSON.stringify({ error: `Invalid operation: ${operation}`, code: ERROR_CODES.INVALID_OPERATION }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('📤 OUTGOING_RESPONSE:', {
      status: 200,
      table,
      operation,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('🚨 FUNCTION_ERROR:', {
      function: 'entityOperations',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: requestBody || 'Unable to parse',
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
