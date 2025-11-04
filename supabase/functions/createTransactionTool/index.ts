import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyAddress, transactionType, clientName, expectedCloseDate, commissionAmount, userId } = await req.json();

    if (!userId || !propertyAddress || !transactionType || !clientName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create transaction
    const { data: transaction, error } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        property_address: propertyAddress,
        transaction_type: transactionType,
        client_name: clientName,
        expected_close_date: expectedCloseDate || null,
        commission_amount: commissionAmount || null,
        status: 'pending',
        metadata: {
          created_by: 'vega_agent',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('[createTransactionTool] Database error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[createTransactionTool] Transaction created:', transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          transactionId: transaction.id,
          propertyAddress: transaction.property_address,
          status: transaction.status,
          message: 'Transaction created successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[createTransactionTool] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
