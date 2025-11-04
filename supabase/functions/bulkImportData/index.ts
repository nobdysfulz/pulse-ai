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
    
    // Define admin tables that don't have user_id
    const adminTables = [
      'task_templates',
      'objection_scripts', 
      'role_play_scenarios',
      'email_templates',
      'content_topics',
      'client_personas',
      'ai_prompt_configs',
      'featured_content_packs',
      'content_packs',
      'campaign_templates',
      'legal_documents',
      'feature_flags',
    ];
    
    const isAdminTable = adminTables.includes(entityType);

    // Helper to convert hex to database format (remove # if present)
    const normalizeHex = (hex: string) => {
      if (!hex) return null;
      return hex.startsWith('#') ? hex.substring(1) : hex;
    };

    // Map columns to database fields and auto-inject system fields
    const mappedRecords = records.map((row: any, index: number) => {
      const mapped: any = {};
      
      Object.entries(columnMapping).forEach(([csvCol, dbCol]) => {
        const value = row[csvCol];
        const dbColStr = dbCol as string;
        
        // Handle JSON objects (for storing complex data in jsonb fields)
        if (value && typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
          try {
            mapped[dbColStr] = JSON.parse(value);
          } catch (e) {
            mapped[dbColStr] = value;
          }
        }
        // Handle array fields (pipe-separated values or JSON arrays)
        else if (typeof value === 'string' && value.includes('|')) {
          mapped[dbColStr] = value.split('|').map((v: string) => v.trim()).filter(v => v);
        } 
        // Handle boolean conversion
        else if (value === 'true' || value === 'false') {
          mapped[dbColStr] = value === 'true';
        } 
        // Handle numeric conversions
        else if (value && !isNaN(Number(value)) && (
          dbColStr.includes('score') || 
          dbColStr.includes('weight') || 
          dbColStr.includes('order') ||
          dbColStr.includes('duration') ||
          dbColStr.includes('threshold') ||
          dbColStr.includes('value')
        )) {
          mapped[dbColStr] = Number(value);
        }
        // Handle hex color codes
        else if (dbColStr.includes('color') && typeof value === 'string' && value.match(/^#?[0-9A-Fa-f]{6}$/)) {
          mapped[dbColStr] = normalizeHex(value);
        }
        // Default: store as-is or null
        else {
          mapped[dbColStr] = value || null;
        }
      });

      // Special handling for agent_voices: store extra fields in voice_settings
      if (entityType === 'agent_voices') {
        const previewUrl = row['previewAudioUrl'];
        const isActive = row['isActive'];
        if (previewUrl || isActive !== undefined) {
          mapped.voice_settings = {
            ...(mapped.voice_settings || {}),
            previewAudioUrl: previewUrl || null,
            isActive: isActive === 'true' || isActive === true
          };
        }
      }

      // Special handling for call_logs: store full data in metadata
      if (entityType === 'call_logs') {
        // Store all CSV data in metadata for reference
        mapped.metadata = {
          ...mapped.metadata,
          conversationId: row['conversationId'],
          callSid: row['callSid'],
          campaignName: row['campaignName'],
          transcript: row['transcript'] ? (typeof row['transcript'] === 'string' ? JSON.parse(row['transcript']) : row['transcript']) : null,
          analysis: row['analysis'] ? (typeof row['analysis'] === 'string' ? JSON.parse(row['analysis']) : row['analysis']) : null,
          formData: row['formData'] ? (typeof row['formData'] === 'string' ? JSON.parse(row['formData']) : row['formData']) : null
        };
      }

      // Auto-inject user_id only for user-specific tables
      if (!isAdminTable && !mapped.user_id && entityType !== 'profiles') {
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

      // Handle timestamps: map created_date/updated_date to created_at/updated_at
      const now = new Date().toISOString();
      if (row['created_date'] && !mapped.created_at) {
        mapped.created_at = row['created_date'];
      } else if (!mapped.created_at) {
        mapped.created_at = now;
      }
      
      if (row['updated_date'] && !mapped.updated_at) {
        mapped.updated_at = row['updated_date'];
      } else if (!mapped.updated_at) {
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
