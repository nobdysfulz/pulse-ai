import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the auth token from the header
    const authHeader = req.headers.get('Authorization')!
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create client with user token for auth check
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
    
    const isAdmin = roles?.some(r => r.role === 'admin')
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { operation, params } = await req.json()
    
    let result
    switch (operation) {
      case 'getAllUsers':
        const { data: users, error: usersError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (usersError) throw usersError
        result = { data: users }
        break
      
      case 'getUserCredits':
        if (!params?.userId) {
          return new Response(JSON.stringify({ error: 'userId required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        
        const { data: credits, error: creditsError } = await supabaseAdmin
          .from('user_credits')
          .select('*')
          .eq('user_id', params.userId)
          .maybeSingle()
        
        if (creditsError) throw creditsError
        result = { data: credits }
        break
      
      case 'adjustCredits':
        if (!params?.userId || params?.adjustment === undefined) {
          return new Response(JSON.stringify({ error: 'userId and adjustment required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        
        // Get current credits
        const { data: currentCredits } = await supabaseAdmin
          .from('user_credits')
          .select('*')
          .eq('user_id', params.userId)
          .maybeSingle()
        
        if (!currentCredits) {
          // Create new credit record
          const { data: newCredits, error: createError } = await supabaseAdmin
            .from('user_credits')
            .insert({
              user_id: params.userId,
              credits_available: Math.max(0, params.adjustment),
              credits_used: 0
            })
            .select()
            .single()
          
          if (createError) throw createError
          result = { data: newCredits }
        } else {
          // Update existing credits
          const newAmount = Math.max(0, currentCredits.credits_available + params.adjustment)
          const { data: updated, error: updateError } = await supabaseAdmin
            .from('user_credits')
            .update({ credits_available: newAmount })
            .eq('user_id', params.userId)
            .select()
            .single()
          
          if (updateError) throw updateError
          
          // Log the transaction
          await supabaseAdmin
            .from('credit_transactions')
            .insert({
              user_id: params.userId,
              transaction_type: params.adjustment > 0 ? 'credit' : 'debit',
              amount: Math.abs(params.adjustment),
              balance_after: newAmount,
              description: params.description || 'Manual adjustment by admin'
            })
          
          result = { data: updated }
        }
        break
      
      case 'getUserSubscriptions':
        const { data: subscriptions, error: subsError } = await supabaseAdmin
          .from('user_agent_subscriptions')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (subsError) throw subsError
        result = { data: subscriptions }
        break
      
      case 'updateUserSubscription':
        if (!params?.userId || !params?.subscriptionData) {
          return new Response(JSON.stringify({ error: 'userId and subscriptionData required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        
        const { data: updatedSub, error: updateSubError } = await supabaseAdmin
          .from('user_agent_subscriptions')
          .upsert({
            user_id: params.userId,
            ...params.subscriptionData
          })
          .select()
          .single()
        
        if (updateSubError) throw updateSubError
        result = { data: updatedSub }
        break
      
      default:
        return new Response(JSON.stringify({ error: 'Unknown operation' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Admin operation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})