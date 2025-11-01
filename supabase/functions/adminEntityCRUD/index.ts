import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // Authn
    const { data: userResp, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userResp?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const callerId = userResp.user.id;

    // Authz: admin only
    const { data: roles, error: rolesErr } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId);
    if (rolesErr) {
      console.error('adminEntityCRUD rolesErr', rolesErr);
      return new Response(JSON.stringify({ success: false, error: 'Unable to verify role' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const isAdmin = Array.isArray(roles) && roles.some((r) => r.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { entityName, operation, id, payload } = body || {};

    if (entityName !== 'User') {
      return new Response(JSON.stringify({ success: false, error: 'Unsupported entity' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (operation === 'update') {
      // Update profile name
      if (payload?.firstName || payload?.lastName) {
        const full_name = [payload.firstName || '', payload.lastName || ''].join(' ').trim();
        const { error: updErr } = await admin
          .from('profiles')
          .update({ full_name })
          .eq('id', id);
        if (updErr) {
          console.error('adminEntityCRUD update profile error', updErr);
          return new Response(JSON.stringify({ success: false, error: 'Failed to update profile' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // Update role via SECURITY DEFINER function
      if (payload?.role) {
        const { error: roleErr } = await admin.rpc('admin_set_user_role', {
          _target_user_id: id,
          _role: payload.role,
        });
        if (roleErr) {
          console.error('adminEntityCRUD set role error', roleErr);
          return new Response(JSON.stringify({ success: false, error: 'Failed to update role' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (operation === 'delete') {
      // Delete auth user (cascades to profile via FK if configured)
      const { error: delErr } = await admin.auth.admin.deleteUser(id);
      if (delErr) {
        console.error('adminEntityCRUD delete user error', delErr);
        return new Response(JSON.stringify({ success: false, error: 'Failed to delete user' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unsupported operation' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('adminEntityCRUD error', e);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});