
import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from "react";
import { UserContext } from '../components/context/UserContext';
import { supabase } from "@/integrations/supabase/client";
import { TaskOperations } from "@/api/entities";
import { RefreshBatcher } from '@/utils/batchOperations';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Send, ArrowRight, Sparkles, Target, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { generateDailyTasks } from "../components/actions/taskGeneration";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingIndicator from "../components/ui/LoadingIndicator";
import { startOfWeek, subWeeks, endOfWeek } from 'date-fns';
import { calculatePulseScore } from "../components/pulse/pulseScoring";
import AddActionModal from "../components/actions/AddActionModal";
import OnboardingReminder from "../components/onboarding/OnboardingReminder";
import { getOnboardingJourneyState, buildReminderStatus } from "@/components/onboarding/onboardingLogic";

export default function DashboardPage() {
  const {
    user,
    preferences,
    loading: contextLoading,
    goals: contextGoals,
    actions: allActions,
    agentProfile,
    businessPlan,
    onboarding,
    refreshUserData
  } = useContext(UserContext);

  const [generating, setGenerating] = useState(false);
  const [advisorQuery, setAdvisorQuery] = useState("");
  const [dashboardInsight, setDashboardInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [lastIntelligenceUpdate, setLastIntelligenceUpdate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  
  // Create a batched refresh handler to reduce redundant calls
  const refreshBatcher = useMemo(() => new RefreshBatcher(refreshUserData, 1000), [refreshUserData]);

  const onboardingJourney = useMemo(() => {
    if (!user) return null;
    return getOnboardingJourneyState({ user, onboarding });
  }, [user, onboarding]);

  const onboardingReminderStatus = useMemo(() => {
    if (!onboardingJourney) {
      return { onboardingRequired: false, completedSteps: [] };
    }

    return buildReminderStatus(onboardingJourney);
  }, [onboardingJourney]);

  const handleResumeOnboarding = useCallback(() => {
    navigate(createPageUrl('Onboarding'));
  }, [navigate]);

  const agentAvatars = [
    {
      name: 'NOVA',
      role: 'Executive Assistant',
      image: '/images/agents/executive-assistant.png',
      link: createPageUrl('Agents') + '?tab=executive_assistant'
    },
    {
      name: 'SIRIUS',
      role: 'Content Agent',
      image: '/images/agents/content-agent.png',
      link: createPageUrl('Agents') + '?tab=content_agent'
    },
    {
      name: 'VEGA',
      role: 'Transaction Coordinator',
      image: '/images/agents/transaction-coordinator.png',
      link: createPageUrl('Agents') + '?tab=transaction_coordinator'
    },
    {
      name: 'PHOENIX',
      role: 'Leads Agent',
      image: '/images/agents/leads-agent.png',
      link: createPageUrl('Agents') + '?tab=leads_agent'
    }
  ];

  const isSubscriberOrAdmin = ['Subscriber', 'Admin', 'Owner', 'Investor'].includes(user?.subscriptionTier);

  const userInitials = useMemo(() => {
    const firstName = user?.firstName || user?.full_name?.split(' ')[0];
    if (firstName) return firstName.charAt(0).toUpperCase();
    return 'U';
  }, [user]);

  const todayFormatted = useMemo(() => {
    const timezone = preferences?.timezone || 'America/New_York';
    return new Date().toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone
    });
  }, [preferences]);

  // Calculate pulseData using the SINGLE SOURCE OF TRUTH
  const pulseData = useMemo(() => {
    if (!allActions || !contextGoals || contextLoading) return null;
    
    // Get contact count from agent profile if available
    const contactCount = agentProfile?.databaseSize ? parseInt(agentProfile.databaseSize) : 0;
    
    return calculatePulseScore(contextGoals, allActions, agentProfile, contactCount);
  }, [allActions, contextGoals, agentProfile, contextLoading]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!allActions || allActions.length === 0) {
      return { completionRateDelta: 0 };
    }

    const now = new Date();
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    const startOfLastWeek = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const endOfLastWeek = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const actionsThisWeek = allActions.filter((a) => {
      if (!a.created_at) return false;
      return new Date(a.created_at) >= startOfThisWeek;
    });
    
    const actionsLastWeek = allActions.filter((a) => {
      if (!a.created_at) return false;
      const created = new Date(a.created_at);
      return created >= startOfLastWeek && created <= endOfLastWeek;
    });

    const completionThisWeek = actionsThisWeek.filter((a) => a.status === 'completed').length;
    const completionRateThisWeek = actionsThisWeek.length > 0 ? (completionThisWeek / actionsThisWeek.length) * 100 : 0;

    const completionLastWeek = actionsLastWeek.filter((a) => a.status === 'completed').length;
    const completionRateLastWeek = actionsLastWeek.length > 0 ? (completionLastWeek / actionsLastWeek.length) * 100 : 0;

    const completionRateDelta = completionRateThisWeek - completionRateLastWeek;

    return { completionRateDelta };
  }, [allActions]);

  // Fetch intelligence data ONLY after user context is fully loaded
  useEffect(() => {
    // Wait for user context to be fully loaded before fetching intelligence
    if (!user || contextLoading) {
      console.log('[Dashboard] Waiting for user context to load...');
      return;
    }

    console.log('[Dashboard] User context loaded, fetching intelligence...');

    const fetchIntelligence = async (retryAttempt = 0) => {
      setIntelligenceLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('buildGraphContext', {
          body: { userId: user.id, fresh: false }
        });
        
        if (error) throw error;
        
        if (data && isMountedRef.current) {
          console.log('[Dashboard] Intelligence data received:', {
            hasScores: !!data.scores,
            overallScore: data.scores?.overall,
            dataStructure: Object.keys(data)
          });
          setIntelligenceData(data);
          setLastIntelligenceUpdate(new Date());
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching intelligence:', error);
        
        // Retry logic for transient failures
        if (retryAttempt < 1) {
          console.log(`[Dashboard] Retrying intelligence fetch (attempt ${retryAttempt + 1})...`);
          setTimeout(() => {
            fetchIntelligence(retryAttempt + 1);
          }, 3000);
        } else if (!intelligenceData) {
          // Only show error if we don't have cached data
          toast.error('Intelligence scores temporarily unavailable');
        }
      } finally {
        setIntelligenceLoading(false);
      }
    };
    
    fetchIntelligence();

    // Set up debounced real-time subscription for intelligence updates
    let debounceTimer;
    const channel = supabase
      .channel('dashboard-intelligence-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'graph_context_cache'
        },
        () => {
          console.log('Intelligence data updated, debouncing refresh...');
          // Debounce to prevent rapid refreshes
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchIntelligence();
          }, 10000); // Wait 10 seconds before refreshing
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      isMountedRef.current = false;
    };
  }, [user, contextLoading]);

  // Generate dashboard insight
  useEffect(() => {
    if (!pulseData || !user) return;

    // Simple insight based on pulse score
    const score = pulseData?.overallPulseScore || 0;
    let insight = '';
    
    if (score >= 80) {
      insight = '🎉 Outstanding performance! You\'re crushing your goals. Keep up this amazing momentum!';
    } else if (score >= 60) {
      insight = '💪 Great work! You\'re on track. Focus on consistency to reach your targets.';
    } else if (score >= 40) {
      insight = '📈 Making progress! Increase your daily activities to boost your PULSE score.';
    } else {
      insight = '🎯 Let\'s build momentum! Complete today\'s tasks and update your progress to improve your score.';
    }
    
    setDashboardInsight(insight);
    setInsightLoading(false);
  }, [pulseData, user]);

  // All tasks for today
  const allTodaysTasks = useMemo(() => {
    return (allActions || []).filter((a) => a.due_date === todayFormatted && a.status !== 'completed');
  }, [allActions, todayFormatted]);

  // First 4 tasks to display
  const todaysTasksDisplay = useMemo(() => {
    return allTodaysTasks.slice(0, 4);
  }, [allTodaysTasks]);

  const completedToday = useMemo(() => {
    return (allActions || []).filter((a) =>
      a.status === 'completed' &&
      a.completed_at &&
      new Date(a.completed_at).toDateString() === new Date().toDateString()
    ).length;
  }, [allActions]);

  const overdueTasks = useMemo(() => {
    const today = new Date(todayFormatted);
    return (allActions || []).filter((a) =>
      a.status !== 'completed' &&
      a.due_date &&
      new Date(a.due_date) < today
    ).length;
  }, [allActions, todayFormatted]);

  const handleGenerateActions = async () => {
    if (!user || !preferences) {
      toast.error("Unable to generate actions. Please complete your profile setup.");
      return;
    }

    // Check if business plan exists
    if (!businessPlan) {
      toast.info("Complete your Production Planner to generate personalized actions.");
      navigate(createPageUrl('Goals') + '?tab=planner');
      return;
    }

    setGenerating(true);
    try {
      const result = await generateDailyTasks(user, preferences);

      if (Array.isArray(result) && result.length > 0) {
        toast.success(`${result.length} new daily action(s) generated!`);
      } else if (result === 'already_exists') {
        toast.info("Today's actions have already been generated.");
      } else if (result === 'no_templates') {
        toast.info("No task templates available. Please contact support.");
      } else {
        toast.info("No new actions to generate based on your current plan.");
      }
      // Use batched refresh for task generation
      refreshBatcher.requestRefresh();
    } catch (error) {
      console.error("Error generating actions from Dashboard:", error);
      toast.error("Could not generate actions. Please try again or contact support.");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = useCallback(async (actionId, isCompleted) => {
    const newStatus = isCompleted ? 'completed' : 'pending';
    try {
      const result = await TaskOperations.updateStatus(actionId, newStatus);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update task');
      }
      
      // Use batched refresh to avoid redundant calls when toggling multiple tasks
      refreshBatcher.requestRefresh();
      toast.success(isCompleted ? "Task completed!" : "Task marked incomplete");
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Could not update task.");
    }
  }, [refreshUserData]);

  const handleCreateAction = async (formData) => {
    try {
      const result = await TaskOperations.create({
        title: formData.title,
        description: formData.description || '',
        category: formData.category,
        priority: formData.priority,
        actionType: formData.actionType,
        dueDate: formData.dueDate,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create task');
      }

      toast.success('Task added successfully!');
      // Use batched refresh for task creation
      refreshBatcher.requestRefresh();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to add task');
    }
  };

  const handleAdvisorSubmit = (e) => {
    e.preventDefault();
    if (!advisorQuery.trim()) return;
    navigate(createPageUrl(`PersonalAdvisor?query=${encodeURIComponent(advisorQuery)}`));
  };

  const handleMyAITeamClick = () => {
    if (isSubscriberOrAdmin) {
      navigate(createPageUrl('Agents'));
    } else {
      navigate(createPageUrl('Plans'));
    }
  };

  const activityGoals = useMemo(() => {
    if (!contextGoals) return [];
    return [
      contextGoals.find((g) => g.title?.toLowerCase() === 'total conversations') || { currentValue: 0, targetValue: 100, title: 'Total Conversations' },
      contextGoals.find((g) => g.title?.toLowerCase() === 'total appointments set') || { currentValue: 0, targetValue: 50, title: 'Total Appointments Set' },
      contextGoals.find((g) => g.title?.toLowerCase() === 'total agreements signed') || { currentValue: 0, targetValue: 25, title: 'Total Agreements Signed' }
    ];
  }, [contextGoals]);

  const productionGoals = useMemo(() => {
    if (!contextGoals) return [];
    return [
      contextGoals.find((g) => g.title?.toLowerCase() === 'total sales volume') || { currentValue: 0, targetValue: 1000000, title: 'Total Sales Volume' },
      contextGoals.find((g) => g.title?.toLowerCase() === 'total gci') || { currentValue: 0, targetValue: 100000, title: 'Total GCI' },
      contextGoals.find((g) => g.title?.toLowerCase() === 'total buyers closed') || { currentValue: 0, targetValue: 10, title: 'Total Buyers Closed' },
      contextGoals.find((g) => g.title?.toLowerCase() === 'total listings closed') || { currentValue: 0, targetValue: 10, title: 'Total Listings Closed' }
    ];
  }, [contextGoals]);

  // Check if user needs to complete Production Planner
  const needsProductionPlan = useMemo(() => {
    return onboarding?.onboardingCompleted && !businessPlan;
  }, [onboarding, businessPlan]);

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <LoadingIndicator text="Loading Dashboard..." size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {onboardingReminderStatus.onboardingRequired && (
          <OnboardingReminder
            onboardingStatus={onboardingReminderStatus}
            onContinue={handleResumeOnboarding}
          />
        )}

        {/* Production Planner CTA Banner */}
        {needsProductionPlan && (
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] rounded-xl p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Complete Your Production Planner</h3>
                  <p className="text-white/90 text-sm">Set your business goals and let PULSE AI create your personalized action plan</p>
                </div>
              </div>
              <Button
                onClick={() => navigate(createPageUrl('Goals') + '?tab=planner')}
                className="bg-white text-[#7C3AED] hover:bg-gray-100 font-semibold"
              >
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Greeting Bar with AI Advisor Input */}
        <div className="flex justify-between items-center gap-8 mb-6">
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold text-[#1E293B]">
              Hi, {user?.firstName || user?.full_name?.split(' ')[0] || 'Agent'}
            </h1>
            <p className="text-base font-medium text-[#475569] mt-1">
              What are your plans for today?
            </p>
          </div>

          {/* AI Advisor Input */}
          <div className="flex-1 max-w-2xl">
            <div className="pl-3 rounded-lg">
              <form onSubmit={handleAdvisorSubmit} className="relative">
                <img
                  src="/images/icons/pulse-ai-icon.png"
                  alt="PULSE AI"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 object-contain pointer-events-none z-10"
                />
                <Input
                  value={advisorQuery}
                  onChange={(e) => setAdvisorQuery(e.target.value)}
                  placeholder="I'm your AI Advisor, ask me about your business"
                  className="w-full h-12 pl-12 pr-12 bg-white border border-[#E2E8F0] rounded-md text-sm placeholder:text-[#94A3B8]"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#6D28D9] hover:bg-[#5B21B6] rounded flex items-center justify-center transition-colors"
                  disabled={!advisorQuery.trim()}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Button
            onClick={() => navigate(createPageUrl('RolePlay'))}
            className="h-20 bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 border-2 border-[#E2E8F0] hover:border-[#6D28D9] text-[#1E293B] flex flex-col items-center justify-center gap-2 transition-all"
            variant="outline"
          >
            <Sparkles className="w-6 h-6 text-[#6D28D9]" />
            <span className="font-semibold">Role Play</span>
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('ContentStudio'))}
            className="h-20 bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 border-2 border-[#E2E8F0] hover:border-[#6D28D9] text-[#1E293B] flex flex-col items-center justify-center gap-2 transition-all"
            variant="outline"
          >
            <Sparkles className="w-6 h-6 text-[#15AABF]" />
            <span className="font-semibold">Content Studio</span>
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('Market'))}
            className="h-20 bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 border-2 border-[#E2E8F0] hover:border-[#6D28D9] text-[#1E293B] flex flex-col items-center justify-center gap-2 transition-all"
            variant="outline"
          >
            <Target className="w-6 h-6 text-[#10B981]" />
            <span className="font-semibold">My Market</span>
          </Button>
          <Button
            onClick={handleMyAITeamClick}
            className="h-20 bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 border-2 border-[#E2E8F0] hover:border-[#6D28D9] text-[#1E293B] flex flex-col items-center justify-center gap-2 transition-all"
            variant="outline"
          >
            <Sparkles className="w-6 h-6 text-[#7C3AED]" />
            <span className="font-semibold">My AI Team</span>
          </Button>
        </div>

        {/* Main Grid (Top row with Pulse, Today's Focus, Intelligence) */}
        <div className="grid grid-cols-3 gap-6">
          {/* Today's Pulse */}
          <div className="bg-violet-800 p-6 rounded-lg border border-[#E2E8F0] flex flex-col h-full">
            <h3 className="text-[#ffffff] mb-1 text-base font-semibold">Today's Pulse</h3>
            <p className="text-[#ffffff] mb-6 text-sm font-medium">Your daily performance score</p>

            <div className="flex items-center justify-center mb-6 flex-1">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#8e7cc3"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${((pulseData?.overallPulseScore || 0) / 100) * 314} 314`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-[#ffffff] text-5xl font-bold">{pulseData?.overallPulseScore || 0}</div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => navigate(createPageUrl('ToDo') + '?tab=scores')}
              className="bg-[#ffffff] text-violet-700 px-4 py-2 text-sm font-semibold rounded-md w-full h-10 hover:bg-[#eeeeee] mt-auto"
            >
              VIEW MORE
            </Button>
          </div>

          {/* Today's Focus */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#1E293B]">Today's Focus</h3>
              <button onClick={() => navigate(createPageUrl('ToDo'))}>
                <ArrowRight className="w-5 h-5 text-[#475569] hover:text-[#6D28D9]" />
              </button>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              {todaysTasksDisplay.length > 0 ? (
                todaysTasksDisplay.map((task) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.status === 'completed'}
                      onCheckedChange={(checked) => handleToggleTask(task.id, checked)}
                    />
                    <label
                      htmlFor={`task-${task.id}`}
                      className="text-[#1E293B] text-sm font-normal cursor-pointer"
                    >
                      {task.title}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-[#475569] mb-4">No tasks for today.</p>
                  <Button
                    onClick={handleGenerateActions}
                    disabled={generating}
                    size="sm"
                    className="bg-[#6D28D9] hover:bg-[#5B21B6]"
                  >
                    {generating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Tasks
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t border-[#E2E8F0] pt-4 mb-4">
              <h4 className="text-base font-semibold text-[#1E293B] mb-4">Stats</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-3xl font-bold text-[#EAB308]">{allTodaysTasks.length}</div>
                  <div className="text-xs font-semibold uppercase text-[#64748B] mt-1">DUE TODAY</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#22C55E]">{completedToday}</div>
                  <div className="text-xs font-semibold uppercase text-[#64748B] mt-1">COMPLETED</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#EF4444]">{overdueTasks}</div>
                  <div className="text-xs font-semibold uppercase text-[#64748B] mt-1">OVERDUE</div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => navigate(createPageUrl('ToDo') + '?tab=tasks')}
              className="w-full h-10 bg-[#6D28D9] hover:bg-[#5B21B6] text-white rounded-md text-sm font-semibold mt-auto"
            >
              VIEW ALL
            </Button>
          </div>

          {/* Intelligence Score */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-[#1E293B]">Intelligence Score</h3>
              <button onClick={() => navigate(createPageUrl('Intelligence'))}>
                <ArrowRight className="w-5 h-5 text-[#475569] hover:text-[#6D28D9]" />
              </button>
            </div>
            {lastIntelligenceUpdate && (
              <p className="text-xs text-[#64748B] mb-4">
                Updated: {lastIntelligenceUpdate.toLocaleTimeString()}
              </p>
            )}
            
            <div className="flex-1">
              {intelligenceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-[#15AABF] animate-spin" />
                </div>
              ) : (intelligenceData && intelligenceData.scores) ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#6D28D9] mb-1">
                        {intelligenceData?.scores?.overall || 0}
                      </div>
                      <div className="text-xs text-[#64748B] font-medium">Overall Score</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-semibold text-[#1E293B]">
                        {intelligenceData?.scores?.pulse || 0}
                      </div>
                      <div className="text-xs text-[#64748B]">Pulse</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-[#1E293B]">
                        {intelligenceData?.scores?.gane || 0}
                      </div>
                      <div className="text-xs text-[#64748B]">GANE</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-[#1E293B]">
                        {intelligenceData?.scores?.moro || 0}
                      </div>
                      <div className="text-xs text-[#64748B]">MORO</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-[#64748B]">No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Row (Ask Your Advisor, Activities Progress, Goals Progress) */}
        <div className="grid grid-cols-3 gap-6">
          {/* Ask Your Advisor */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/images/icons/pulse-ai-icon.png"
                  alt="PULSE AI"
                  className="w-6 h-6 object-contain"
                />
                <h4 className="text-lg font-semibold text-[#1E293B]">Ask Me About Your Market</h4>
              </div>
              <button onClick={() => navigate(createPageUrl('PersonalAdvisor'))}>
                <ArrowRight className="w-5 h-5 text-[#475569] hover:text-[#6D28D9]" />
              </button>
            </div>

            <p className="text-xs text-center text-gray-400 uppercase tracking-wider mb-3">Example Conversation</p>

            <div className="space-y-3 mb-4 min-h-[200px] flex-1">
              <div className="flex items-start gap-2 justify-end">
                <div className="bg-zinc-100 text-white p-3 text-right rounded-lg flex-1">
                  <p className="text-gray-500 text-sm font-normal">How can I compete in my current market?</p>
                </div>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={user?.avatar} alt={user?.firstName} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  <img
                    src="/images/icons/pulse-ai-icon.png"
                    alt="PULSE AI"
                    className="w-4 h-4 object-contain"
                  />
                </div>
                <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg p-3">
                  <p className="text-[#1E293B] text-sm font-normal">Based on recent trends, focusing on first-time homebuyer education could give you an edge. Many are entering the market but feel unprepared.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAdvisorSubmit} className="relative">
              <Input
                value={advisorQuery}
                onChange={(e) => setAdvisorQuery(e.target.value)}
                placeholder="Ask me anything about your business"
                className="w-full h-10 pr-12 bg-white border border-[#E2E8F0] rounded-md text-sm placeholder:text-[#94A3B8]"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 w-8 h-8 bg-[#6D28D9] hover:bg-[#5B21B6] rounded flex items-center justify-center"
                disabled={!advisorQuery.trim()}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
            <p className="text-xs text-[#6D28D9] mt-2 cursor-pointer hover:underline">
              Clear Conversation
            </p>
          </div>

          {/* Activities Progress */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#1E293B]">Activities Progress</h3>
              <button onClick={() => navigate(createPageUrl('Goals'))}>
                <ArrowRight className="w-5 h-5 text-[#475569] hover:text-[#6D28D9]" />
              </button>
            </div>
            <div className="space-y-4 flex-1">
              {activityGoals.map((goal, idx) => {
                const percentage = goal.targetValue > 0 ? Math.min(goal.currentValue / goal.targetValue * 100, 100) : 0;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#475569]">
                        {goal.title || `Activity ${idx + 1}`}
                      </span>
                      <span className="text-sm font-medium text-[#475569]">{Math.round(percentage)}%</span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] rounded h-2">
                      <div
                        className="bg-[#6D28D9] h-2 rounded transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Button
              onClick={() => navigate(createPageUrl('Goals'))}
              className="w-full h-10 bg-[#6D28D9] hover:bg-[#5B21B6] text-white rounded-md text-sm font-semibold mt-4"
            >
              VIEW ALL
            </Button>
          </div>

          {/* Goals Progress */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#1E293B]">Goals Progress</h3>
              <button onClick={() => navigate(createPageUrl('Goals'))}>
                <ArrowRight className="w-5 h-5 text-[#475569] hover:text-[#6D28D9]" />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              {productionGoals.slice(0, 3).map((goal, idx) => {
                const percentage = goal.targetValue > 0 ? Math.min(goal.currentValue / goal.targetValue * 100, 100) : 0;
                const formattedCurrent =
                  goal.title?.toLowerCase().includes('volume') || goal.title?.toLowerCase().includes('gci')
                    ? `$${(goal.currentValue / 1000).toFixed(0)}K`
                    : goal.currentValue;
                const formattedTarget =
                  goal.title?.toLowerCase().includes('volume') || goal.title?.toLowerCase().includes('gci')
                    ? `$${(goal.targetValue / 1000).toFixed(0)}K`
                    : goal.targetValue;

                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#475569]">
                        {goal.title || `Goal ${idx + 1}`}
                      </span>
                      <span className="text-sm font-medium text-[#475569]">{Math.round(percentage)}%</span>
                    </div>
                    <p className="text-xs text-[#64748B] mb-2">
                      {formattedCurrent} out of {formattedTarget}
                    </p>
                    <div className="w-full bg-[#E2E8F0] rounded h-2">
                      <div
                        className="bg-[#6D28D9] h-2 rounded transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={() => navigate(createPageUrl('Goals'))}
              className="w-full h-10 bg-[#6D28D9] hover:bg-[#5B21B6] text-white rounded-md text-sm font-semibold mt-4"
            >
              VIEW ALL
            </Button>
          </div>
        </div>

        {/* AI Agents Section */}
        <div>
          <h2 className="text-xl font-semibold text-[#1E293B] mb-4 mt-6">Your AI Team</h2>
          <div className="grid grid-cols-4 gap-4">
            {agentAvatars.map((agent, index) => (
              <a
                key={index}
                href={agent.link}
                className="p-4 bg-white rounded-lg border border-[#E2E8F0] hover:border-[#6D28D9] transition-all group"
              >
                <img
                  src={agent.image}
                  alt={agent.name}
                  loading="lazy"
                  width="64"
                  height="64"
                  className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                />
                <h3 className="text-sm font-medium text-[#1E293B] text-center">{agent.name}</h3>
                <p className="text-xs text-[#64748B] text-center mt-1">{agent.role}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
      <AddActionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreateAction={handleCreateAction}
      />
    </div>
  );
}
