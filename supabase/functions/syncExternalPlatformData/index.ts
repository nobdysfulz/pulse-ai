import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize local Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const localAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await localAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Check admin role
    const { data: roles, error: roleError } = await localAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roles) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize external Supabase client
    const externalUrl = Deno.env.get('EXTERNAL_BACKEND_URL');
    const externalKey = Deno.env.get('EXTERNAL_BACKEND_SERVICE_ROLE_KEY');

    if (!externalUrl || !externalKey) {
      throw new Error('External backend credentials not configured');
    }

    const externalClient = createClient(externalUrl, externalKey);

    // Parse request body
    const body = await req.json();
    const dryRun = body.dryRun || false;

    console.log(`Starting sync (dryRun: ${dryRun})`);

    // Ensure system user exists
    let systemUserId: string;
    const { data: systemProfile } = await localAdmin
      .from('profiles')
      .select('id')
      .eq('email', 'system@pulse.ai')
      .single();

    if (systemProfile) {
      systemUserId = systemProfile.id;
    } else {
      const newSystemId = crypto.randomUUID();
      await localAdmin.from('profiles').insert({
        id: newSystemId,
        email: 'system@pulse.ai',
        full_name: 'System User'
      });
      systemUserId = newSystemId;
      console.log('Created system user:', systemUserId);
    }

    const results: any = {};

    // TASK TEMPLATES
    try {
      const { data: externalTasks, error: fetchError } = await externalClient
        .from('task_templates')
        .select('*');

      if (fetchError) throw fetchError;

      if (dryRun) {
        results.task_templates = { count: externalTasks?.length || 0, errors: [] };
      } else {
        const localTasks = externalTasks.map((row: any) => ({
          title: row.title,
          description: row.description,
          category: row.category,
          action_type: row.actionType || row.action_type,
          priority: row.priority || 'medium',
          trigger_type: row.triggerType || row.trigger_type,
          trigger_value: row.triggerValue || row.trigger_value,
          display_category: row.subCategory || row.display_category,
          is_active: row.isActive ?? row.is_active ?? true,
          priority_weight: row.priority === 'high' ? 5 : row.priority === 'low' ? 1 : 3,
          impact_area: row.pulseImpact || row.impact_area || null
        }));

        await localAdmin.from('task_templates').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        for (let i = 0; i < localTasks.length; i += 50) {
          const batch = localTasks.slice(i, i + 50);
          await localAdmin.from('task_templates').insert(batch);
        }

        results.task_templates = { imported: localTasks.length, errors: [] };
        console.log(`Imported ${localTasks.length} task templates`);
      }
    } catch (error: any) {
      results.task_templates = { imported: 0, errors: [error.message] };
      console.error('Task templates error:', error);
    }

    // CLIENT PERSONAS
    try {
      const { data: externalPersonas, error: fetchError } = await externalClient
        .from('client_personas')
        .select('*');

      if (fetchError) throw fetchError;

      if (dryRun) {
        results.client_personas = { count: externalPersonas?.length || 0, errors: [] };
      } else {
        const localPersonas = externalPersonas.map((row: any) => ({
          persona_key: row.personaKey || row.persona_key,
          persona_name: row.personaName || row.persona_name,
          description: row.description,
          personality_traits: typeof row.personality === 'string' 
            ? row.personality.split(',').map((s: string) => s.trim())
            : row.personality_traits || [],
          communication_style: row.speakingStyle || row.communication_style,
          objection_patterns: typeof row.typicalObjections === 'string'
            ? JSON.parse(row.typicalObjections)
            : row.objection_patterns || [],
          decision_making_style: row.decision_making_style || null,
          is_active: row.isActive ?? row.is_active ?? true
        }));

        await localAdmin.from('client_personas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await localAdmin.from('client_personas').insert(localPersonas);

        results.client_personas = { imported: localPersonas.length, errors: [] };
        console.log(`Imported ${localPersonas.length} client personas`);
      }
    } catch (error: any) {
      results.client_personas = { imported: 0, errors: [error.message] };
      console.error('Client personas error:', error);
    }

    // AGENT VOICES
    try {
      const { data: externalVoices, error: fetchError } = await externalClient
        .from('agent_voices')
        .select('*');

      if (fetchError) throw fetchError;

      if (dryRun) {
        results.agent_voices = { count: externalVoices?.length || 0, errors: [] };
      } else {
        const localVoices = externalVoices.map((row: any) => ({
          voice_name: row.name || row.voice_name,
          voice_id: row.voice_id,
          voice_settings: row.previewAudioUrl 
            ? { preview_url: row.previewAudioUrl }
            : row.voice_settings || {},
          agent_type: row.agent_type || 'executive_assistant',
          user_id: systemUserId,
          is_default: row.is_default ?? false
        }));

        await localAdmin.from('agent_voices').delete().eq('user_id', systemUserId);
        await localAdmin.from('agent_voices').insert(localVoices);

        results.agent_voices = { imported: localVoices.length, errors: [] };
        console.log(`Imported ${localVoices.length} agent voices`);
      }
    } catch (error: any) {
      results.agent_voices = { imported: 0, errors: [error.message] };
      console.error('Agent voices error:', error);
    }

    // CALL LOGS
    try {
      const { data: externalCalls, error: fetchError } = await externalClient
        .from('call_logs')
        .select('*');

      if (fetchError) throw fetchError;

      if (dryRun) {
        results.call_logs = { count: externalCalls?.length || 0, errors: [] };
      } else {
        const { data: localProfiles } = await localAdmin
          .from('profiles')
          .select('id, email');

        const emailToUserId: Record<string, string> = {};
        localProfiles?.forEach((p: any) => {
          if (p.email) emailToUserId[p.email] = p.id;
        });

        const localCalls = externalCalls.map((row: any) => {
          const userId = row.userEmail && emailToUserId[row.userEmail]
            ? emailToUserId[row.userEmail]
            : systemUserId;

          const metadata: any = {
            ...(typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {})
          };

          if (row.transcript) metadata.transcript = typeof row.transcript === 'string' ? JSON.parse(row.transcript) : row.transcript;
          if (row.analysis) metadata.analysis = typeof row.analysis === 'string' ? JSON.parse(row.analysis) : row.analysis;
          if (row.formData) metadata.formData = typeof row.formData === 'string' ? JSON.parse(row.formData) : row.formData;
          if (row.conversationId) metadata.conversationId = row.conversationId;
          if (row.callSid) metadata.callSid = row.callSid;
          if (row.campaignName) metadata.campaignName = row.campaignName;
          if (row.endedAt) metadata.endedAt = row.endedAt;
          if (row.prospectFirstName) metadata.prospectFirstName = row.prospectFirstName;
          if (row.prospectLastName) metadata.prospectLastName = row.prospectLastName;

          return {
            user_id: userId,
            contact_name: row.contactName || row.contact_name,
            phone_number: row.contactPhone || row.phone_number,
            call_type: row.call_type || 'outbound',
            status: row.status || 'completed',
            duration_seconds: parseInt(row.duration) || row.duration_seconds || 0,
            recording_url: row.recordingUrl || row.recording_url,
            notes: row.notes || null,
            metadata
          };
        });

        await localAdmin.from('call_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        for (let i = 0; i < localCalls.length; i += 50) {
          const batch = localCalls.slice(i, i + 50);
          await localAdmin.from('call_logs').insert(batch);
        }

        results.call_logs = { imported: localCalls.length, errors: [] };
        console.log(`Imported ${localCalls.length} call logs`);
      }
    } catch (error: any) {
      results.call_logs = { imported: 0, errors: [error.message] };
      console.error('Call logs error:', error);
    }

    // FEATURED CONTENT PACKS
    try {
      const { data: externalPacks, error: fetchError } = await externalClient
        .from('featured_content_packs')
        .select('*');

      if (fetchError) throw fetchError;

      if (dryRun) {
        results.featured_content_packs = { count: externalPacks?.length || 0, errors: [] };
      } else {
        const localPacks = externalPacks.map((row: any) => ({
          title: row.title,
          description: row.description,
          category: row.category || 'marketing',
          icon: row.thumbnailUrl || row.icon,
          sort_order: row.sortOrder ?? row.sort_order ?? 0,
          is_active: row.isActive ?? row.is_active ?? true,
          content_items: [{
            type: row.type || 'link',
            url: row.url,
            thumbnail: row.thumbnailUrl || row.icon,
            socialNetworks: typeof row.socialNetworks === 'string' 
              ? JSON.parse(row.socialNetworks)
              : row.socialNetworks || []
          }]
        }));

        await localAdmin.from('featured_content_packs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await localAdmin.from('featured_content_packs').insert(localPacks);

        results.featured_content_packs = { imported: localPacks.length, errors: [] };
        console.log(`Imported ${localPacks.length} featured content packs`);
      }
    } catch (error: any) {
      results.featured_content_packs = { imported: 0, errors: [error.message] };
      console.error('Featured content packs error:', error);
    }

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      results,
      systemUserId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
