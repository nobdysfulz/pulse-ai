import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { parse } from 'https://deno.land/std@0.198.0/csv/parse.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: Normalize column headers from CSV
function normalizeColumnName(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

// Column synonyms for common variations
const columnSynonyms: Record<string, string[]> = {
  'action_type': ['action_type', 'action type', 'actiontype', 'type'],
  'trigger_type': ['trigger_type', 'trigger type', 'triggertype', 'trigger'],
  'priority_weight': ['priority_weight', 'priority weight', 'priorityweight', 'weight'],
  'display_category': ['display_category', 'display category', 'displaycategory', 'display'],
  'impact_area': ['impact_area', 'impact area', 'impactarea', 'impact'],
};

// Build reverse lookup for header matching
function buildHeaderMap(headers: string[]): Map<string, string> {
  const map = new Map<string, string>();
  const normalizedHeaders = headers.map(h => normalizeColumnName(h));
  
  headers.forEach((originalHeader, idx) => {
    const normalized = normalizedHeaders[idx];
    
    // Direct match
    map.set(normalized, originalHeader);
    
    // Check synonyms
    for (const [canonicalName, synonyms] of Object.entries(columnSynonyms)) {
      if (synonyms.some(syn => normalizeColumnName(syn) === normalized)) {
        map.set(canonicalName, originalHeader);
      }
    }
  });
  
  return map;
}

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

    // Parse CSV with header normalization
    const records = parse(csvData, { skipFirstRow: false });
    const rawHeaders = records[0] as string[];
    const dataRows = records.slice(1);
    
    const headerMap = buildHeaderMap(rawHeaders);
    
    console.log('CSV Raw Headers:', rawHeaders);
    console.log('Normalized Header Map:', Array.from(headerMap.entries()));
    
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
      'brand_color_palettes',
      'agent_voices',
    ];
    
    const isAdminTable = adminTables.includes(entityType);

    // Helper to convert hex to database format (remove # if present)
    const normalizeHex = (hex: string) => {
      if (!hex) return null;
      return hex.startsWith('#') ? hex.substring(1) : hex;
    };

    // Map columns to database fields and auto-inject system fields
    const mappedRecords = dataRows.map((row: any, index: number) => {
      const mapped: any = {};
      
      // Map each CSV column to DB column using normalized headers and synonyms
      rawHeaders.forEach((header, idx) => {
        const normalizedHeader = normalizeColumnName(header);
        const value = row[idx];
        
        // Find DB column name from mapping or synonyms
        let dbCol = columnMapping[header] || header;
        
        // Check if this header matches a synonym
        for (const [canonicalName, synonyms] of Object.entries(columnSynonyms)) {
          if (synonyms.some(syn => normalizeColumnName(syn) === normalizedHeader)) {
            dbCol = canonicalName;
            break;
          }
        }
        
        // Skip unsupported columns
        const columnsToSkip = ['created_by', 'accentcolorhex2', 'action_type'];
        if (columnsToSkip.includes(normalizeColumnName(dbCol))) {
          return;
        }
        
        // Validate integer fields for task_templates BEFORE type conversion
        if (entityType === 'task_templates' && ['trigger_value', 'priority_weight'].includes(dbCol)) {
          if (value === 'any' || value === 'Any' || value === 'ANY') {
            throw new Error(`Row ${index + 2}: "${value}" is not a valid integer for ${dbCol}. Please use numeric values only.`);
          }
          if (typeof value === 'string' && value.includes('-')) {
            throw new Error(`Row ${index + 2}: "${value}" is not a valid integer for ${dbCol}. Please use a single numeric value, not a range.`);
          }
        }
        
        // Handle JSON objects (for storing complex data in jsonb fields)
        if (value && typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
          try {
            mapped[dbCol] = JSON.parse(value);
          } catch (e) {
            mapped[dbCol] = value;
          }
        }
        // Handle array fields (pipe-separated values or JSON arrays)
        else if (typeof value === 'string' && value.includes('|')) {
          mapped[dbCol] = value.split('|').map((v: string) => v.trim()).filter(v => v);
        } 
        // Handle boolean conversion
        else if (value === 'true' || value === 'false') {
          mapped[dbCol] = value === 'true';
        } 
        // Handle numeric conversions
        else if (value && !isNaN(Number(value)) && (
          dbCol.includes('score') || 
          dbCol.includes('weight') || 
          dbCol.includes('order') ||
          dbCol.includes('duration') ||
          dbCol.includes('threshold') ||
          dbCol.includes('value')
        )) {
          mapped[dbCol] = Number(value);
        }
        // Handle hex color codes
        else if (dbCol.includes('color') && typeof value === 'string' && value.match(/^#?[0-9A-Fa-f]{6}$/)) {
          mapped[dbCol] = normalizeHex(value);
        }
        // Default: store as-is or null
        else {
          mapped[dbCol] = value || null;
        }
      });

      // Special handling for agent_voices: store extra fields in voice_settings
      if (entityType === 'agent_voices') {
        const previewUrlIdx = rawHeaders.findIndex(h => normalizeColumnName(h) === 'previewaudiourl');
        const isActiveIdx = rawHeaders.findIndex(h => normalizeColumnName(h) === 'isactive');
        
        if (previewUrlIdx >= 0 || isActiveIdx >= 0) {
          mapped.voice_settings = {
            ...(mapped.voice_settings || {}),
            previewAudioUrl: previewUrlIdx >= 0 ? row[previewUrlIdx] : null,
            isActive: isActiveIdx >= 0 ? (row[isActiveIdx] === 'true' || row[isActiveIdx] === true) : true
          };
        }
      }

      // Special handling for call_logs: store full data in metadata
      if (entityType === 'call_logs') {
        const conversationIdIdx = rawHeaders.findIndex(h => normalizeColumnName(h) === 'conversationid');
        const callSidIdx = rawHeaders.findIndex(h => normalizeColumnName(h) === 'callsid');
        const campaignNameIdx = rawHeaders.findIndex(h => normalizeColumnName(h) === 'campaignname');
        const transcriptIdx = rawHeaders.findIndex(h => normalizeColumnName(h) === 'transcript');
        const analysisIdx = rawHeaders.findIndex(h => normalizeColumnName(h) === 'analysis');
        const formDataIdx = rawHeaders.findIndex(h => normalizeColumnName(h) === 'formdata');
        
        mapped.metadata = {
          ...mapped.metadata,
          conversationId: conversationIdIdx >= 0 ? row[conversationIdIdx] : null,
          callSid: callSidIdx >= 0 ? row[callSidIdx] : null,
          campaignName: campaignNameIdx >= 0 ? row[campaignNameIdx] : null,
          transcript: transcriptIdx >= 0 && row[transcriptIdx] ? (typeof row[transcriptIdx] === 'string' ? JSON.parse(row[transcriptIdx]) : row[transcriptIdx]) : null,
          analysis: analysisIdx >= 0 && row[analysisIdx] ? (typeof row[analysisIdx] === 'string' ? JSON.parse(row[analysisIdx]) : row[analysisIdx]) : null,
          formData: formDataIdx >= 0 && row[formDataIdx] ? (typeof row[formDataIdx] === 'string' ? JSON.parse(row[formDataIdx]) : row[formDataIdx]) : null
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
      const createdDateIdx = rawHeaders.findIndex(h => normalizeColumnName(h) === 'created_date');
      const updatedDateIdx = rawHeaders.findIndex(h => normalizeColumnName(h) === 'updated_date');
      
      if (createdDateIdx >= 0 && row[createdDateIdx] && !mapped.created_at) {
        mapped.created_at = row[createdDateIdx];
      } else if (!mapped.created_at) {
        mapped.created_at = now;
      }
      
      if (updatedDateIdx >= 0 && row[updatedDateIdx] && !mapped.updated_at) {
        mapped.updated_at = row[updatedDateIdx];
      } else if (!mapped.updated_at) {
        mapped.updated_at = now;
      }

      return mapped;
    });

    console.log(`Parsed ${mappedRecords.length} records`);
    console.log('First 2 parsed records:', mappedRecords.slice(0, 2));

    // Batch insert (50 at a time) with validation
    const batchSize = 50;
    let imported = 0;
    const errors: any[] = [];

    for (let i = 0; i < mappedRecords.length; i += batchSize) {
      const batch = mappedRecords.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      
      // Validate required fields for task_templates
      if (entityType === 'task_templates') {
        const requiredFields = ['title', 'category', 'action_type', 'trigger_type'];
        const missingFieldsErrors: string[] = [];
        
        batch.forEach((record, idx) => {
          const actualRowNum = i + idx + 2; // +2 for header and 1-indexing
          const missing = requiredFields.filter(field => !record[field] || (typeof record[field] === 'string' && record[field].trim() === ''));
          if (missing.length > 0) {
            missingFieldsErrors.push(`Row ${actualRowNum} missing: ${missing.join(', ')}`);
          }
        });
        
        if (missingFieldsErrors.length > 0) {
          errors.push({
            batch: currentBatch,
            rows: `${i + 2} to ${i + batch.length + 1}`,
            error: missingFieldsErrors.join('; ')
          });
          console.error(`Validation failed for batch ${currentBatch}:`, missingFieldsErrors);
          continue; // Skip this batch
        }
      }
      
      const { data, error } = await supabase
        .from(entityType)
        .insert(batch)
        .select();

      if (error) {
        console.error(`Batch ${currentBatch} error:`, error);
        errors.push({ 
          batch: currentBatch, 
          error: error.message,
          rows: `${i + 2} to ${i + batch.length + 1}`
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
