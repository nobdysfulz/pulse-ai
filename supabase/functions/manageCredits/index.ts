import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { validateSupabaseAuth } from '../_shared/supabaseAuth.ts';

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
    if (!authHeader) {
      console.error('[manageCredits] Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the JWT token and get user ID
    let userId: string;
    try {
      userId = await validateSupabaseAuth(authHeader);
      console.log('[manageCredits] Authenticated user:', userId);
    } catch (error) {
      console.error('[manageCredits] Auth validation failed:', error);
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Authentication failed',
          code: 'AUTH001' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { operation, amount, description, metadata = {} } = body;

    if (!operation || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing operation or amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[manageCredits] ${operation} ${amount} credits for user:`, userId);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get current credit balance
    const { data: creditData, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits_available')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const currentBalance = creditData?.credits_available || 0;
    let newBalance = currentBalance;
    let transactionType = '';
    let transactionAmount = 0;

    switch (operation) {
      case 'deduct':
        if (currentBalance < amount) {
          return new Response(
            JSON.stringify({ 
              error: 'Insufficient credits',
              currentBalance,
              required: amount 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        newBalance = currentBalance - amount;
        transactionType = 'deduction';
        transactionAmount = -amount;
        break;

      case 'add':
        newBalance = currentBalance + amount;
        transactionType = 'addition';
        transactionAmount = amount;
        break;

      case 'set':
        newBalance = amount;
        transactionType = amount > currentBalance ? 'addition' : 'deduction';
        transactionAmount = amount - currentBalance;
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Update credits atomically
    const { error: updateError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        credits_available: newBalance,
        updated_at: new Date().toISOString(),
      });

    if (updateError) throw updateError;

    // Log transaction
    const { error: logError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: transactionType,
        amount: transactionAmount,
        balance_after: newBalance,
        description: description || `${operation} operation`,
        metadata,
      });

    if (logError) {
      console.warn('[manageCredits] Failed to log transaction:', logError);
    }

    console.log(`[manageCredits] ✓ Credits updated: ${currentBalance} → ${newBalance}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        previousBalance: currentBalance,
        newBalance,
        amountChanged: transactionAmount,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[manageCredits] Error:', error);
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
