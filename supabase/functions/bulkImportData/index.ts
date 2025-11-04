import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { parse } from 'https://deno.land/std@0.198.0/csv/parse.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { entityType, csvData, columnMapping } = await req.json();

    if (!entityType || !csvData || !columnMapping) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse CSV
    const records = parse(csvData, { skipFirstRow: true });
    
    // Map columns to database fields and auto-inject system fields
    const mappedRecords = records.map((row: any, index: number) => {
      const mapped: any = {};
      
      Object.entries(columnMapping).forEach(([csvCol, dbCol]) => {
        const value = row[csvCol];
        const dbColStr = dbCol as string;
        
        // Handle array fields (pipe-separated values)
        if (typeof value === 'string' && value.includes('|')) {
          mapped[dbColStr] = value.split('|').map((v: string) => v.trim());
        } else if (value === 'true' || value === 'false') {
          // Handle boolean conversion
          mapped[dbColStr] = value === 'true';
        } else if (value && !isNaN(Number(value)) && dbColStr.includes('score')) {
          // Handle numeric conversions for scores
          mapped[dbColStr] = Number(value);
        } else {
          mapped[dbColStr] = value || null;
        }
      });

      // Auto-inject user_id if table has this field
      if (!mapped.user_id && entityType !== 'profiles') {
        mapped.user_id = user.id;
      }

      // Auto-inject id if table has this field and it's not provided
      if (!mapped.id && entityType !== 'profiles') {
        mapped.id = crypto.randomUUID();
      }

      // For profiles table, use user_id as id
      if (entityType === 'profiles' && !mapped.id) {
        mapped.id = user.id;
      }

      // Auto-set timestamps
      const now = new Date().toISOString();
      if (!mapped.created_at) {
        mapped.created_at = now;
      }
      if (!mapped.updated_at) {
        mapped.updated_at = now;
      }

      return mapped;
    });

    // Batch insert (50 at a time)
    const batchSize = 50;
    let imported = 0;
    const errors: any[] = [];

    for (let i = 0; i < mappedRecords.length; i += batchSize) {
      const batch = mappedRecords.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from(entityType)
        .insert(batch)
        .select();

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        errors.push({ 
          batch: i / batchSize + 1, 
          error: error.message,
          rows: `${i + 1} to ${Math.min(i + batchSize, mappedRecords.length)}`
        });
      } else {
        imported += data?.length || 0;
      }
    }

    return new Response(
      JSON.stringify({ success: true, imported, errors, total: mappedRecords.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
