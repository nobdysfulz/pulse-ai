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

    const { entityType, csvData, columnMapping } = await req.json();

    if (!entityType || !csvData || !columnMapping) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse CSV
    const records = parse(csvData, { skipFirstRow: true });
    
    // Map columns to database fields
    const mappedRecords = records.map((row: any) => {
      const mapped: any = {};
      Object.entries(columnMapping).forEach(([csvCol, dbCol]) => {
        const value = row[csvCol];
        // Handle array fields (pipe-separated values)
        if (typeof value === 'string' && value.includes('|')) {
          mapped[dbCol as string] = value.split('|').map((v: string) => v.trim());
        } else {
          mapped[dbCol as string] = value;
        }
      });
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
