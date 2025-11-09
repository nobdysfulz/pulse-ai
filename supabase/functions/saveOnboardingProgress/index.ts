import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { validateSupabaseAuth } from '../_shared/supabaseAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Error codes for easy filtering
const ERROR_CODES = {
  DB_SCHEMA_MISMATCH: 'DB001',
  AUTH_VALIDATION_FAILED: 'AUTH001',
  ENV_MISSING: 'CONFIG001',
  MISSING_BODY_DATA: 'REQ001',
} as const;

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
      functionName: 'saveOnboardingProgress',
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
      authHeaderType: authHeader?.substring(0, 10),
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

    let userId: string;
    try {
      userId = await validateSupabaseAuth(authHeader);
      console.log(`✅ AUTH_VALIDATION_SUCCESS:`, {
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
    const { progressData } = requestBody;

    console.log('📦 REQUEST_BODY_PARSED:', {
      hasProgressData: !!progressData,
      progressDataKeys: progressData ? Object.keys(progressData) : [],
      userId,
      timestamp: new Date().toISOString()
    });

    if (!progressData) {
      console.error(`🚨 [${ERROR_CODES.MISSING_BODY_DATA}] Missing progressData in request body`);
      return new Response(
        JSON.stringify({ error: 'Missing progressData in request body', code: ERROR_CODES.MISSING_BODY_DATA }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🏗️ Schema validation - only use columns that exist
    const validColumns = [
      'onboarding_completed',
      'onboarding_completion_date', 
      'agent_onboarding_completed',
      'agent_onboarding_completion_date',
      'call_center_onboarding_completed',
      'call_center_onboarding_completion_date',
      'completed_steps'
    ];
    const providedColumns = Object.keys(progressData);
    const invalidColumns = providedColumns.filter(col => !validColumns.includes(col));
    
    console.log('🏗️ SCHEMA_VALIDATION:', {
      table: 'user_onboarding',
      validColumns,
      providedColumns,
      invalidColumns,
      userId,
      timestamp: new Date().toISOString()
    });

    if (invalidColumns.length > 0) {
      console.warn('⚠️ INVALID_COLUMNS_IGNORED:', {
        invalidColumns,
        message: 'These columns will be ignored',
        timestamp: new Date().toISOString()
      });
    }

    // Filter progressData to only include valid columns
    const filteredProgressData = Object.keys(progressData)
      .filter(key => validColumns.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = progressData[key];
        return obj;
      }, {});

    // If no valid columns were provided, skip DB write but return success
    if (Object.keys(filteredProgressData).length === 0) {
      console.warn('ℹ️ NO_VALID_COLUMNS_PROVIDED: Skipping DB operation', {
        providedColumns,
        userId,
        timestamp: new Date().toISOString()
      });
      return new Response(
        JSON.stringify({ success: true, data: null, ignored: providedColumns }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updateData = {
      user_id: userId,
      ...filteredProgressData,
      updated_at: new Date().toISOString(),
    };

    console.log('📊 DB_OPERATION_START:', {
      table: 'user_onboarding',
      operation: 'upsert',
      userId,
      dataKeys: Object.keys(updateData),
      timestamp: new Date().toISOString()
    });

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Upsert onboarding progress
    const { data, error } = await supabase
      .from('user_onboarding')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error(`❌ [${ERROR_CODES.DB_SCHEMA_MISMATCH}] DB_OPERATION_FAILED:`, {
        table: 'user_onboarding',
        operation: 'upsert',
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        userId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    console.log('✅ DB_OPERATION_SUCCESS:', {
      table: 'user_onboarding',
      operation: 'upsert',
      userId,
      recordId: data?.id,
      timestamp: new Date().toISOString()
    });

    console.log('📤 OUTGOING_RESPONSE:', {
      status: 200,
      success: true,
      userId,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        data,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('🚨 FUNCTION_ERROR:', {
      function: 'saveOnboardingProgress',
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
