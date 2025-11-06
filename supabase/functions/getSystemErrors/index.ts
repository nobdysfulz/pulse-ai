import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateClerkTokenWithJose } from '../_shared/clerkAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const userId: string = await validateClerkTokenWithJose(token);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const isAdmin = roles?.some((role) => role.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const { severity, resolved } = body ?? {};

    let query = supabase
      .from('system_errors')
      .select('*')
      .order('last_occurrence_at', { ascending: false });

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity);
    }

    if (typeof resolved === 'boolean') {
      query = query.eq('resolved', resolved);
    }

    const { data, error } = await query;
    if (error) throw error;

    const errors = (data ?? []).map((item) => ({
      id: item.id,
      severity: item.severity,
      functionName: item.function_name,
      message: item.message,
      stackTrace: item.stack_trace,
      userId: item.user_id,
      metadata: JSON.stringify(item.metadata ?? {}),
      created_date: item.created_at,
      last_occurrence_at: item.last_occurrence_at,
      occurrenceCount: item.occurrence_count ?? 1,
      resolved: item.resolved,
      resolved_at: item.resolved_at,
    }));

    return new Response(
      JSON.stringify({ errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in getSystemErrors:', error);
    return new Response(
      JSON.stringify({ errors: [], error: 'Failed to fetch errors' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
