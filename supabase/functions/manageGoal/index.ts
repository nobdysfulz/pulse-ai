import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateSupabaseAuth } from '../_shared/supabaseAuth.ts';

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
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = await validateSupabaseAuth(authHeader);

    const { operation, goalId, goalData } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    switch (operation) {
      case 'create': {
        const { data, error } = await supabase
          .from('goals')
          .insert({
            ...goalData,
            user_id: userId,
            confidence_score: 50,
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, goal: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        const updateData: any = { ...goalData };
        
        if (goalData.current_value !== undefined && goalData.target_value !== undefined) {
          const progress = (goalData.current_value / goalData.target_value) * 100;
          updateData.confidence_score = Math.min(100, Math.max(0, Math.round(progress)));
        }

        const { data, error } = await supabase
          .from('goals')
          .update(updateData)
          .eq('id', goalId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, goal: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { error } = await supabase
          .from('goals')
          .delete()
          .eq('id', goalId)
          .eq('user_id', userId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid operation' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in manageGoal:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
