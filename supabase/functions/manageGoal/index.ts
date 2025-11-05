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

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub;

    const body = await req.json();
    const { operation, goalId, goalData } = body;

    if (!operation) {
      return new Response(
        JSON.stringify({ error: 'Missing operation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[manageGoal] ${operation} for user:`, userId);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let result;

    switch (operation) {
      case 'create': {
        if (!goalData) {
          return new Response(
            JSON.stringify({ error: 'Missing goalData for create operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('goals')
          .insert({
            ...goalData,
            user_id: userId,
            confidence_score: 50, // Default confidence
          })
          .select()
          .single();

        if (error) throw error;
        result = { data };
        break;
      }

      case 'update': {
        if (!goalId || !goalData) {
          return new Response(
            JSON.stringify({ error: 'Missing goalId or goalData for update operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Calculate confidence score if current_value is being updated
        let updateData = { ...goalData };
        
        if (goalData.current_value !== undefined && goalData.target_value !== undefined) {
          const progress = (goalData.current_value / goalData.target_value) * 100;
          updateData.confidence_score = Math.min(100, Math.max(0, Math.round(progress)));
        }

        const { data, error } = await supabase
          .from('goals')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', goalId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        result = { data };
        break;
      }

      case 'delete': {
        if (!goalId) {
          return new Response(
            JSON.stringify({ error: 'Missing goalId for delete operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from('goals')
          .delete()
          .eq('id', goalId)
          .eq('user_id', userId);

        if (error) throw error;
        result = { success: true };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[manageGoal] ✓ ${operation} completed successfully`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[manageGoal] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
