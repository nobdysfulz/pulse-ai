import "https://deno.land/x/xhr@0.1.0/mod.ts";
import {
  corsHeaders,
  createSupabaseAdmin,
  fetchEmailTemplate,
  renderTemplateBody,
  sendEmail,
  logEmailDelivery,
} from '../_shared/emailUtils.ts';

const daysAgoIso = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const formatPulseTrend = (scores: Array<{ date: string; overall_score: number }>) => {
  if (scores.length === 0) return 'No data yet';
  const latest = scores[0]?.overall_score ?? 0;
  const earliest = scores[scores.length - 1]?.overall_score ?? latest;
  if (latest > earliest) return 'up';
  if (latest < earliest) return 'down';
  return 'flat';
};

const formatCompletedActions = (count: number) => `${count} action${count === 1 ? '' : 's'} completed`;

const formatGoalProgress = (goals: Array<{ title: string; target_value?: number | null; current_value?: number | null }>) => {
  if (!goals || goals.length === 0) return 'No active goals recorded.';
  return goals
    .map((goal) => {
      if (goal.target_value && goal.current_value !== null && goal.current_value !== undefined) {
        const progress = Math.min(100, Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100));
        return `${goal.title}: ${progress}% complete`;
      }
      return goal.title;
    })
    .join('\n');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseAdmin();
    const last7Days = daysAgoIso(7);
    const template = await fetchEmailTemplate('weekly_email');

    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('email_notifications', true)
      .eq('weekly_reports', true);

    if (!preferences || preferences.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userIds = preferences.map((pref) => pref.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    let sent = 0;

    for (const profile of profiles ?? []) {
      if (!profile?.email) continue;

      const { data: pulseHistory } = await supabase
        .from('pulse_scores')
        .select('overall_score, date')
        .eq('user_id', profile.id)
        .gte('date', last7Days)
        .order('date', { ascending: false });

      const { count: completedActionsCount } = await supabase
        .from('daily_actions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .gte('completed_at', last7Days);

      const { data: goals } = await supabase
        .from('goals')
        .select('title, target_value, current_value')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .limit(5);

      const latestPulse = pulseHistory?.[0]?.overall_score ?? 'N/A';
      const trend = pulseHistory ? formatPulseTrend(pulseHistory) : 'flat';

      const variables = {
        firstName: profile.full_name?.split(' ')[0] ?? 'there',
        weeklyPulseTrend: trend,
        pulseScore: latestPulse,
        completedActions: formatCompletedActions(completedActionsCount ?? 0),
        goalProgress: formatGoalProgress(goals ?? []),
      };

      const rendered = renderTemplateBody(template, variables);
      const fallbackHtml = `
        <h2>Weekly PULSE Summary</h2>
        <p>Hi ${variables.firstName}, here's how you performed last week.</p>
        <p>PULSE score: <strong>${variables.pulseScore}</strong> (${variables.weeklyPulseTrend}).</p>
        <p>${variables.completedActions}</p>
        <h3>Goals</h3>
        <pre>${variables.goalProgress}</pre>
      `;

      try {
        await sendEmail({
          to: profile.email,
          subject: 'Your weekly PULSE performance report',
          html: rendered.html ?? fallbackHtml,
          text: rendered.text ?? `${variables.completedActions}\n${variables.goalProgress}`,
        });

        await logEmailDelivery({
          userId: profile.id,
          emailType: 'weekly',
          templateKey: template?.template_key ?? 'weekly_email',
          metadata: {
            pulseScore: variables.pulseScore,
            weeklyTrend: variables.weeklyPulseTrend,
            completedActions: completedActionsCount ?? 0,
          },
        });

        sent += 1;
      } catch (error) {
        console.error('Failed to send weekly email:', error);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in triggerWeeklyEmails:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
