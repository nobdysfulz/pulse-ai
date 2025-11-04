import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { syncType = 'contacts' } = await req.json();

    // Get Lofty connection
    const { data: connection, error: connError } = await supabaseClient
      .from('crm_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'lofty')
      .eq('connection_status', 'connected')
      .single();

    if (connError || !connection) {
      throw new Error('Lofty is not connected. Please connect Lofty first.');
    }

    const apiKey = connection.credentials?.api_key;
    if (!apiKey) {
      throw new Error('Lofty API key not found');
    }

    let syncedCount = 0;
    let errors: string[] = [];

    if (syncType === 'contacts' || syncType === 'all') {
      try {
        // Fetch contacts from Lofty
        const contactsResponse = await fetch('https://api.lofty.com/v1/contacts?limit=100', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!contactsResponse.ok) {
          throw new Error(`Lofty API error: ${contactsResponse.status}`);
        }

        const contactsData = await contactsResponse.json();
        const contacts = contactsData.data || [];

        // Sync contacts to database
        for (const contact of contacts) {
          try {
            await supabaseClient
              .from('contacts')
              .upsert({
                user_id: user.id,
                name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
                email: contact.email,
                phone: contact.phone,
                status: contact.status || 'lead',
                source: 'lofty',
                metadata: {
                  lofty_id: contact.id,
                  tags: contact.tags,
                  custom_fields: contact.custom_fields
                }
              }, {
                onConflict: 'user_id,email'
              });
            
            syncedCount++;
          } catch (error) {
            errors.push(`Failed to sync contact ${contact.email}: ${error}`);
          }
        }
      } catch (error) {
        errors.push(`Contact sync failed: ${error}`);
      }
    }

    if (syncType === 'transactions' || syncType === 'all') {
      try {
        // Fetch transactions from Lofty
        const transactionsResponse = await fetch('https://api.lofty.com/v1/transactions?limit=100', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!transactionsResponse.ok) {
          throw new Error(`Lofty API error: ${transactionsResponse.status}`);
        }

        const transactionsData = await transactionsResponse.json();
        const transactions = transactionsData.data || [];

        // Sync transactions to database
        for (const transaction of transactions) {
          try {
            await supabaseClient
              .from('transactions')
              .upsert({
                user_id: user.id,
                client_name: transaction.client_name,
                property_address: transaction.address,
                transaction_type: transaction.type || 'sale',
                status: transaction.status || 'pending',
                expected_close_date: transaction.close_date,
                commission_amount: transaction.commission,
                metadata: {
                  lofty_id: transaction.id,
                  mls_number: transaction.mls_number
                }
              }, {
                onConflict: 'user_id,property_address'
              });
            
            syncedCount++;
          } catch (error) {
            errors.push(`Failed to sync transaction ${transaction.id}: ${error}`);
          }
        }
      } catch (error) {
        errors.push(`Transaction sync failed: ${error}`);
      }
    }

    // Update last sync time
    await supabaseClient
      .from('crm_connections')
      .update({ 
        last_sync_at: new Date().toISOString(),
        sync_settings: { last_sync_count: syncedCount, last_sync_errors: errors }
      })
      .eq('id', connection.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        syncedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `Synced ${syncedCount} records from Lofty`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in loftySync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
