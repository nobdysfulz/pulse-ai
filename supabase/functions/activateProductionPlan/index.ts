import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateSupabaseAuth } from '../_shared/supabaseAuth.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ensureNumber = (value: unknown, field: string): number => {
  const num = typeof value === 'string' ? Number(value) : value as number;
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid numeric value for ${field}`);
  }
  return num;
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

    const userId = await validateSupabaseAuth(authHeader);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { planData, calculatedTargets } = body ?? {};

    if (!planData || !calculatedTargets) {
      throw new Error('Missing plan payload.');
    }

    const requiredNumbers = [
      { field: 'gciRequired', value: calculatedTargets.gciRequired },
      { field: 'totalDealsNeeded', value: calculatedTargets.totalDealsNeeded },
      { field: 'buyerDeals', value: calculatedTargets.buyerDeals },
      { field: 'listingDeals', value: calculatedTargets.listingDeals },
      { field: 'totalSalesVolume', value: calculatedTargets.totalSalesVolume },
      { field: 'totalConversations', value: calculatedTargets.totalConversations },
      { field: 'totalAppointments', value: calculatedTargets.totalAppointments },
      { field: 'totalAgreements', value: calculatedTargets.totalAgreements },
      { field: 'totalContracts', value: calculatedTargets.totalContracts },
    ];

    requiredNumbers.forEach(({ field, value }) => {
      if (!Number.isFinite(value) || Number(value) < 0) {
        throw new Error(`Invalid calculation for ${field}`);
      }
    });

    const planYear = Number(planData.planYear) || new Date().getFullYear();

    const businessPlanPayload = {
      user_id: userId,
      plan_year: planYear,
      net_income_goal: ensureNumber(planData.netIncomeGoal ?? 0, 'netIncomeGoal'),
      tax_rate: (Number(planData.taxRate) ?? 0) / 100,
      commission_rate: (Number(planData.commissionRate) ?? 0) / 100,
      avg_sale_price: ensureNumber(planData.avgSalePrice ?? 0, 'avgSalePrice'),
      buyer_seller_split: (Number(planData.buyerSellerSplit) ?? 0) / 100,
      income_split: (Number(planData.incomeSplit) ?? 0) / 100,
      brokerage_split_buyers: (Number(planData.brokerageSplitBuyers) ?? 0) / 100,
      brokerage_split_sellers: (Number(planData.brokerageSplitSellers) ?? 0) / 100,
      team_split_buyers: (Number(planData.teamSplitBuyers) ?? 0) / 100,
      team_split_sellers: (Number(planData.teamSplitSellers) ?? 0) / 100,
      brokerage_cap: ensureNumber(planData.brokerageCap ?? 0, 'brokerageCap'),
      gci_required: ensureNumber(calculatedTargets.gciRequired, 'gciRequired'),
      total_deals_needed: ensureNumber(calculatedTargets.totalDealsNeeded, 'totalDealsNeeded'),
      buyer_deals: ensureNumber(calculatedTargets.buyerDeals, 'buyerDeals'),
      listing_deals: ensureNumber(calculatedTargets.listingDeals, 'listingDeals'),
      total_volume: ensureNumber(calculatedTargets.totalSalesVolume, 'totalSalesVolume'),
      total_conversations: ensureNumber(calculatedTargets.totalConversations, 'totalConversations'),
      total_appointments: ensureNumber(calculatedTargets.totalAppointments, 'totalAppointments'),
      total_agreements: ensureNumber(calculatedTargets.totalAgreements, 'totalAgreements'),
      total_contracts: ensureNumber(calculatedTargets.totalContracts, 'totalContracts'),
      detailed_plan: JSON.stringify(planData),
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const existingPlan = await supabaseClient
      .from('business_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('plan_year', planYear)
      .maybeSingle();

    if (existingPlan.error) {
      throw existingPlan.error;
    }

    if (existingPlan.data) {
      const { error: updateError } = await supabaseClient
        .from('business_plans')
        .update(businessPlanPayload)
        .eq('id', existingPlan.data.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from('business_plans')
        .insert(businessPlanPayload);
      if (insertError) throw insertError;
    }

    const deadline = `${planYear}-12-31`;
    const goalBlueprints = [
      { title: 'Annual GCI', category: 'production', unit: 'USD', target: calculatedTargets.gciRequired },
      { title: 'Total Transactions', category: 'production', unit: 'closings', target: calculatedTargets.totalDealsNeeded },
      { title: 'Buyer Transactions', category: 'production', unit: 'closings', target: calculatedTargets.buyerDeals },
      { title: 'Listing Transactions', category: 'production', unit: 'closings', target: calculatedTargets.listingDeals },
      { title: 'Total Sales Volume', category: 'production', unit: 'USD', target: calculatedTargets.totalSalesVolume },
      { title: 'Total Conversations', category: 'activity', unit: 'conversations', target: calculatedTargets.totalConversations },
      { title: 'Total Appointments', category: 'activity', unit: 'appointments', target: calculatedTargets.totalAppointments },
      { title: 'Total Agreements', category: 'activity', unit: 'agreements', target: calculatedTargets.totalAgreements },
      { title: 'Total Contracts', category: 'activity', unit: 'contracts', target: calculatedTargets.totalContracts },
    ];

    let goalsCreated = 0;
    let goalsUpdated = 0;

    for (const goal of goalBlueprints) {
      const targetValue = Math.max(0, Number(goal.target) || 0);

      const existingGoal = await supabaseClient
        .from('goals')
        .select('id,current_value')
        .eq('user_id', userId)
        .eq('title', goal.title)
        .eq('goal_type', 'annual')
        .maybeSingle();

      if (existingGoal.error) {
        throw existingGoal.error;
      }

      const currentValue = existingGoal.data?.current_value ?? 0;
      const progressPercentage = targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0;
      const status = currentValue >= targetValue ? 'completed' : 'active';
      const trend = status === 'completed'
        ? 'completed'
        : progressPercentage >= 80
          ? 'on-track'
          : progressPercentage >= 50
            ? 'behind'
            : 'at-risk';

      const payload = {
        user_id: userId,
        title: goal.title,
        category: goal.category,
        goal_type: 'annual',
        target_value: targetValue,
        unit: goal.unit,
        deadline,
        status,
        trend,
        progress_percentage: progressPercentage,
        is_active: true,
      };

      if (existingGoal.data) {
        const { error: updateGoalError } = await supabaseClient
          .from('goals')
          .update(payload)
          .eq('id', existingGoal.data.id);
        if (updateGoalError) throw updateGoalError;
        goalsUpdated += 1;
      } else {
        const { error: insertGoalError } = await supabaseClient
          .from('goals')
          .insert({ ...payload, current_value: 0 });
        if (insertGoalError) throw insertGoalError;
        goalsCreated += 1;
      }
    }

    const onboardingUpdate = await supabaseClient
      .from('user_onboarding')
      .update({
        goals_setup_completed: true,
        goals_completion_date: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (onboardingUpdate.error && onboardingUpdate.error.code === 'P0002') {
      await supabaseClient.from('user_onboarding').insert({
        user_id: userId,
        goals_setup_completed: true,
        goals_completion_date: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ success: true, goalsCreated, goalsUpdated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in activateProductionPlan:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
