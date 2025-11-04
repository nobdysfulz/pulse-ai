import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const determineStatus = (current: number, target: number) => {
  if (target <= 0) {
    return {
      status: current > 0 ? 'completed' : 'active',
      progress: 0,
      trend: 'on-track',
    } as const;
  }

  const progress = Math.min(100, Math.round((current / target) * 100));
  if (current >= target) {
    return {
      status: 'completed' as const,
      progress,
      trend: 'completed' as const,
    };
  }

  let trend: 'on-track' | 'behind' | 'at-risk' = 'at-risk';
  if (progress >= 80) {
    trend = 'on-track';
  } else if (progress >= 50) {
    trend = 'behind';
  }

  return {
    status: 'active' as const,
    progress,
    trend,
  };
};

const inferTransactionSide = (type: string | null | undefined) => {
  if (!type) return 'other';
  const normalized = type.toLowerCase();
  if (normalized.includes('buyer')) return 'buyer';
  if (normalized.includes('listing') || normalized.includes('seller')) return 'listing';
  return 'other';
};

const isClosedStatus = (status: string | null | undefined) => {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return ['closed', 'completed', 'won', 'finished', 'settled'].some((token) => normalized.includes(token));
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
      throw new Error('User not authenticated');
    }

    const body = await req.json();
    const provider = body?.provider ?? null;

    const { data: transactions, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('transaction_type, commission_amount, status, metadata')
      .eq('user_id', user.id);

    if (transactionsError) {
      throw transactionsError;
    }

    const closedTransactions = (transactions || []).filter((transaction) => isClosedStatus(transaction.status));
    const buyerTransactions = closedTransactions.filter((transaction) => inferTransactionSide(transaction.transaction_type) === 'buyer');
    const listingTransactions = closedTransactions.filter((transaction) => inferTransactionSide(transaction.transaction_type) === 'listing');

    const totalBuyerDeals = buyerTransactions.length;
    const totalListingDeals = listingTransactions.length;
    const totalDeals = closedTransactions.length;

    const totalGci = closedTransactions.reduce((sum, transaction) => sum + toNumber(transaction.commission_amount), 0);
    const totalVolume = closedTransactions.reduce((sum, transaction) => {
      const metadata = transaction.metadata as Record<string, unknown> | null;
      const possibleVolume = metadata?.sale_price ?? metadata?.sales_price ?? metadata?.close_price ?? metadata?.price ?? null;
      const numericVolume = toNumber(possibleVolume);
      return sum + numericVolume;
    }, 0);

    const { data: businessPlan } = await supabaseClient
      .from('business_plans')
      .select('avg_sale_price')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const inferredVolume = totalVolume > 0
      ? totalVolume
      : totalDeals > 0 && businessPlan?.avg_sale_price
        ? totalDeals * toNumber(businessPlan.avg_sale_price)
        : 0;

    const metrics = [
      { title: 'Annual GCI', value: totalGci },
      { title: 'Total Transactions', value: totalDeals },
      { title: 'Buyer Transactions', value: totalBuyerDeals },
      { title: 'Listing Transactions', value: totalListingDeals },
      { title: 'Total Sales Volume', value: inferredVolume },
    ];

    const goalTitles = metrics.map((metric) => metric.title);

    const { data: goals, error: goalsError } = await supabaseClient
      .from('goals')
      .select('id, title, target_value, current_value, goal_type')
      .eq('user_id', user.id)
      .in('title', goalTitles)
      .eq('goal_type', 'annual');

    if (goalsError) {
      throw goalsError;
    }

    let goalsUpdated = 0;
    const updates: Array<{ title: string; previous: number; current: number; target: number }> = [];

    for (const metric of metrics) {
      const goal = goals?.find((g) => g.title === metric.title);
      if (!goal) continue;

      const currentValue = toNumber(metric.value);
      const existingValue = toNumber(goal.current_value);
      const targetValue = toNumber(goal.target_value);

      if (Math.abs(currentValue - existingValue) < 0.01) {
        continue;
      }

      const statusInfo = determineStatus(currentValue, targetValue);

      const { error: updateError } = await supabaseClient
        .from('goals')
        .update({
          current_value: currentValue,
          progress_percentage: statusInfo.progress,
          status: statusInfo.status,
          trend: statusInfo.trend,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goal.id);

      if (updateError) {
        throw updateError;
      }

      goalsUpdated += 1;
      updates.push({ title: metric.title, previous: existingValue, current: currentValue, target: targetValue });
    }

    return new Response(
      JSON.stringify({
        success: true,
        provider,
        goalsUpdated,
        metrics: {
          totalGci,
          totalDeals,
          totalBuyerDeals,
          totalListingDeals,
          totalVolume: inferredVolume,
        },
        updates,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error syncing goal progress from CRM:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
