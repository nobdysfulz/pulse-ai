import "https://deno.land/x/xhr@0.1.0/mod.ts";
import {
  corsHeaders,
  createSupabaseAdmin,
  fetchEmailTemplate,
  renderTemplateBody,
  sendEmail,
  logEmailDelivery,
} from '../_shared/emailUtils.ts';

const formatActions = (actions: Array<{ title: string; category?: string | null; priority?: string | null }>) => {
  if (!actions || actions.length === 0) return 'No scheduled actions today.';
  return actions
    .map((action) => `• ${action.title}${action.category ? ` (${action.category})` : ''}`)
    .join('\n');
};

const formatGoals = (goals: Array<{ title: string; target_value?: number | null; current_value?: number | null }>) => {
  if (!goals || goals.length === 0) return 'Stay focused on your objectives — no active goals found.';
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
    const today = new Date().toISOString().split('T')[0];
    const template = await fetchEmailTemplate('daily_email');

    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('email_notifications', true)
      .eq('daily_reminders', true);

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

      const { data: actions } = await supabase
        .from('daily_actions')
        .select('title, category, priority')
        .eq('user_id', profile.id)
        .eq('due_date', today)
        .order('priority', { ascending: true });

      const { data: pulseScores } = await supabase
        .from('pulse_scores')
        .select('overall_score, date')
        .eq('user_id', profile.id)
        .order('date', { ascending: false })
        .limit(2);

      const { data: goals } = await supabase
        .from('goals')
        .select('title, target_value, current_value')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .limit(5);

      const latestPulse = pulseScores?.[0]?.overall_score ?? null;
      const previousPulse = pulseScores?.[1]?.overall_score ?? null;
      const pulseTrend = latestPulse !== null && previousPulse !== null
        ? latestPulse > previousPulse
          ? 'up'
          : latestPulse < previousPulse
            ? 'down'
            : 'flat'
        : 'flat';

      const variables = {
        firstName: profile.full_name?.split(' ')[0] ?? 'there',
        pulseScore: latestPulse ?? 'N/A',
        pulseTrend,
        actionList: formatActions(actions ?? []),
        goalsSummary: formatGoals(goals ?? []),
        actionCount: actions?.length ?? 0,
      };

      const rendered = renderTemplateBody(template, variables);
      const fallbackHtml = `
        <h2>Good morning ${variables.firstName}</h2>
        <p>Your current PULSE score is <strong>${variables.pulseScore}</strong> (${variables.pulseTrend}).</p>
        <h3>Today's Focus</h3>
        <pre>${variables.actionList}</pre>
        <h3>Active Goals</h3>
        <pre>${variables.goalsSummary}</pre>
      `;

      try {
        await sendEmail({
          to: profile.email,
          subject: 'Your daily PULSE plan is ready',
          html: rendered.html ?? fallbackHtml,
          text: rendered.text ?? `${variables.actionList}\n\nGoals:\n${variables.goalsSummary}`,
        });

        await logEmailDelivery({
          userId: profile.id,
          emailType: 'daily',
          templateKey: template?.template_key ?? 'daily_email',
          metadata: {
            actionCount: variables.actionCount,
            pulseScore: variables.pulseScore,
          },
        });

        sent += 1;
      } catch (error) {
        console.error('Failed to send daily email:', error);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in triggerDailyEmails:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
