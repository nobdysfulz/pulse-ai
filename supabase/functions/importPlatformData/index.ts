import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { parse } from "https://deno.land/std@0.211.0/csv/parse.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user is admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      throw new Error('Admin access required');
    }

    console.log('Starting platform data import...');

    const results: {
      [key: string]: { success: boolean; imported: number; errors: string[] }
    } = {
      task_templates: { success: false, imported: 0, errors: [] },
      client_personas: { success: false, imported: 0, errors: [] },
      agent_voices: { success: false, imported: 0, errors: [] },
      call_logs: { success: false, imported: 0, errors: [] },
      featured_content_packs: { success: false, imported: 0, errors: [] },
    };

    // Step 1: Ensure system user exists for agent_voices
    console.log('Creating system user for agent voices...');
    const systemEmail = 'system@pulse.ai';
    let systemUserId = null;

    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', systemEmail)
      .single();

    if (existingProfile) {
      systemUserId = existingProfile.id;
    } else {
      // Create system user in auth
      const { data: authUser, error: createAuthError } = await supabaseClient.auth.admin.createUser({
        email: systemEmail,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { full_name: 'System' }
      });

      if (createAuthError) {
        console.error('Error creating system user:', createAuthError);
        throw createAuthError;
      }

      systemUserId = authUser.user.id;
    }

    console.log(`System user ID: ${systemUserId}`);

    // Step 2: Clear existing data
    console.log('Clearing existing data...');
    await supabaseClient.from('task_templates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('client_personas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('agent_voices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('call_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('featured_content_packs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Step 3: Import Task Templates
    console.log('Importing task templates...');
    try {
      const taskTemplatesCsv = await Deno.readTextFile('../_shared/imports/task_templates.csv');
      const taskTemplatesData = parse(taskTemplatesCsv, { skipFirstRow: true });
      
      const taskTemplates = taskTemplatesData.map((row: any) => ({
        title: row.title,
        description: row.description,
        category: row.category,
        action_type: row.actionType,
        priority: row.priority || 'medium',
        trigger_type: row.triggerType,
        trigger_value: row.triggerValue ? parseInt(row.triggerValue) : null,
        display_category: row.subCategory || null,
        is_active: row.isActive === 'true' || row.isActive === true,
        priority_weight: row.priority === 'high' ? 5 : row.priority === 'medium' ? 3 : 1,
        impact_area: row.pulseImpact || null
      }));

      const { data: inserted, error: insertError } = await supabaseClient
        .from('task_templates')
        .insert(taskTemplates)
        .select();

      if (insertError) throw insertError;

      results.task_templates = { success: true, imported: inserted?.length || 0, errors: [] };
      console.log(`✓ Imported ${inserted?.length} task templates`);
    } catch (error: any) {
      results.task_templates.errors.push(error.message);
      console.error('Task templates import error:', error);
    }

    // Step 4: Import Client Personas
    console.log('Importing client personas...');
    try {
      const clientPersonasCsv = await Deno.readTextFile('../_shared/imports/client_personas.csv');
      const clientPersonasData = parse(clientPersonasCsv, { skipFirstRow: true });
      
      const clientPersonas = clientPersonasData.map((row: any) => {
        let objectionPatterns: string[] = [];
        try {
          objectionPatterns = row.typicalObjections ? JSON.parse(row.typicalObjections) : [];
        } catch {
          objectionPatterns = [];
        }

        const personalityTraits = row.personality 
          ? row.personality.split(',').map((s: string) => s.trim())
          : [];

        return {
          persona_key: row.personaKey,
          persona_name: row.personaName,
          description: row.description,
          communication_style: row.speakingStyle,
          personality_traits: personalityTraits,
          objection_patterns: objectionPatterns,
          is_active: row.isActive === 'true' || row.isActive === true,
          decision_making_style: null
        };
      });

      const { data: inserted, error: insertError } = await supabaseClient
        .from('client_personas')
        .insert(clientPersonas)
        .select();

      if (insertError) throw insertError;

      results.client_personas = { success: true, imported: inserted?.length || 0, errors: [] };
      console.log(`✓ Imported ${inserted?.length} client personas`);
    } catch (error: any) {
      results.client_personas.errors.push(error.message);
      console.error('Client personas import error:', error);
    }

    // Step 5: Import Agent Voices
    console.log('Importing agent voices...');
    try {
      const agentVoicesCsv = await Deno.readTextFile('../_shared/imports/agent_voices.csv');
      const agentVoicesData = parse(agentVoicesCsv, { skipFirstRow: true });
      
      const agentVoices = agentVoicesData.map((row: any) => ({
        user_id: systemUserId,
        agent_type: 'executive_assistant',
        voice_name: row.name,
        voice_id: row.voice_id,
        voice_settings: {
          preview_url: row.previewAudioUrl
        },
        is_default: false
      }));

      const { data: inserted, error: insertError } = await supabaseClient
        .from('agent_voices')
        .insert(agentVoices)
        .select();

      if (insertError) throw insertError;

      results.agent_voices = { success: true, imported: inserted?.length || 0, errors: [] };
      console.log(`✓ Imported ${inserted?.length} agent voices`);
    } catch (error: any) {
      results.agent_voices.errors.push(error.message);
      console.error('Agent voices import error:', error);
    }

    // Step 6: Import Call Logs
    console.log('Importing call logs...');
    try {
      const callLogsCsv = await Deno.readTextFile('../_shared/imports/call_logs.csv');
      const callLogsData = parse(callLogsCsv, { skipFirstRow: true });
      
      const callLogs = [];
      for (const row of callLogsData) {
        // Try to find user by email
        let userId = systemUserId; // Default to system user
        if (row.userEmail) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('email', row.userEmail)
            .single();
          
          if (profile) userId = profile.id;
        }

        let metadata: any = {};
        try {
          if (row.transcript) metadata.transcript = JSON.parse(row.transcript);
        } catch { }
        try {
          if (row.analysis) metadata.analysis = JSON.parse(row.analysis);
        } catch { }
        try {
          if (row.formData) metadata.formData = JSON.parse(row.formData);
        } catch { }
        try {
          if (row.metadata) metadata = { ...metadata, ...JSON.parse(row.metadata) };
        } catch { }

        metadata.conversationId = row.conversationId;
        metadata.callSid = row.callSid;
        metadata.prospectFirstName = row.prospectFirstName;
        metadata.prospectLastName = row.prospectLastName;
        metadata.campaignName = row.campaignName;
        metadata.endedAt = row.endedAt;

        callLogs.push({
          user_id: userId,
          contact_name: row.contactName,
          phone_number: row.contactPhone,
          call_type: 'outbound',
          status: row.status,
          duration_seconds: row.duration ? parseInt(row.duration) : null,
          recording_url: row.recordingUrl,
          metadata: metadata,
          notes: null
        });
      }

      const { data: inserted, error: insertError } = await supabaseClient
        .from('call_logs')
        .insert(callLogs)
        .select();

      if (insertError) throw insertError;

      results.call_logs = { success: true, imported: inserted?.length || 0, errors: [] };
      console.log(`✓ Imported ${inserted?.length} call logs`);
    } catch (error: any) {
      results.call_logs.errors.push(error.message);
      console.error('Call logs import error:', error);
    }

    // Step 7: Import Featured Content Packs
    console.log('Importing featured content packs...');
    try {
      const contentPacksCsv = await Deno.readTextFile('../_shared/imports/featured_content_packs.csv');
      const contentPacksData = parse(contentPacksCsv, { skipFirstRow: true });
      
      const contentPacks = contentPacksData.map((row: any) => {
        let socialNetworks: string[] = [];
        try {
          socialNetworks = row.socialNetworks ? JSON.parse(row.socialNetworks) : [];
        } catch { }

        const contentItems = [{
          type: row.type || 'link',
          url: row.url,
          thumbnail: row.thumbnailUrl,
          socialNetworks: socialNetworks
        }];

        return {
          title: row.title,
          description: row.description,
          category: 'marketing',
          icon: row.thumbnailUrl,
          content_items: contentItems,
          is_active: row.isActive === 'true' || row.isActive === true,
          sort_order: row.sortOrder ? parseInt(row.sortOrder) : 0
        };
      });

      const { data: inserted, error: insertError } = await supabaseClient
        .from('featured_content_packs')
        .insert(contentPacks)
        .select();

      if (insertError) throw insertError;

      results.featured_content_packs = { success: true, imported: inserted?.length || 0, errors: [] };
      console.log(`✓ Imported ${inserted?.length} featured content packs`);
    } catch (error: any) {
      results.featured_content_packs.errors.push(error.message);
      console.error('Featured content packs import error:', error);
    }

    const totalImported = Object.values(results).reduce((sum, r) => sum + r.imported, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`\n=== Import Complete ===`);
    console.log(`Total records imported: ${totalImported}`);
    console.log(`Total errors: ${totalErrors}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${totalImported} records`,
        results,
        totalImported,
        totalErrors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
