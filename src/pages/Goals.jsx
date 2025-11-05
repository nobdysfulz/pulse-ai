
import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { UserContext } from '../components/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Goal, BrandColorPalette, ConnectionOperations } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, PlusCircle, Edit, Printer, Download, Target } from "lucide-react";
import { toast } from "sonner";
import ContextualTopNav from "../components/layout/ContextualTopNav";
import ContextualSidebar from "../components/layout/ContextualSidebar";
import UpdateProgressModal from "../components/goals/UpdateProgressModal";
import ProductionPlannerModal from "../components/goal-planner/ProductionPlannerModal";
import AddGoalModal from "../components/goals/AddGoalModal";
import { calculateConfidencePercentage } from "../components/goals/confidenceCalculator";
import { startOfQuarter, endOfQuarter, differenceInDays, startOfYear, endOfYear, getQuarter, format as formatDate, formatDistanceToNow } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateDailyTasks } from "../components/actions/taskGeneration";
import LoadingIndicator from "../components/ui/LoadingIndicator";
import { generateGoalsReportPdf } from "../components/goals/pdfGenerator";
import { PageLoader, InlineLoader } from '../components/ui/LoadingStates';
import { ErrorBanner, EmptyState } from '../components/ui/ErrorStates';

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(value || 0);

const normalizeGoalRecord = (goal) => {
  const targetValue = goal.target_value ?? goal.targetValue ?? 0;
  const currentValue = goal.current_value ?? goal.currentValue ?? 0;
  const targetUnit = goal.unit ?? goal.target_unit ?? goal.targetUnit ?? '';

  return {
    ...goal,
    targetValue,
    currentValue,
    targetUnit,
    createdAt: goal.created_at ?? goal.createdAt ?? null,
    goalType: goal.goal_type ?? goal.goalType ?? 'custom',
    userId: goal.user_id ?? goal.userId ?? null
  };
};

export default function GoalsPage() {
  const { user, goals: contextGoals, businessPlan, refreshUserData, preferences } = useContext(UserContext);
  
  // Check URL parameters for tab selection
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'tracking');
  const [goals, setGoals] = useState([]); // This will now hold ALL goals
  const [loading, setLoading] = useState(true);
  const [showUpdateProgress, setShowUpdateProgress] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [isSyncingCrm, setIsSyncingCrm] = useState(false);
  const [crmConnected, setCrmConnected] = useState(null);
  const [generatingActions, setGeneratingActions] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsMeta, setInsightsMeta] = useState(null);
  const [insightsExpanded, setInsightsExpanded] = useState(false);

  const insightsStorageKey = 'pulse-ai-goal-insights';
  const defaultInsightActions = [
    'Review your goal progress daily to stay accountable.',
    'Block time for proactive lead generation activities.',
    'Update your CRM at the end of each day to keep data current.'
  ];

  const tabs = [
    { id: 'tracking', label: 'Tracking' },
    { id: 'insights', label: 'Insights' }, // This will be updated with AI insights
    { id: 'planner', label: 'Planner' }
  ];


  const loadPageData = async () => {
    setLoading(true);
    try {
      // Set all goals with confidence levels
      const allGoalsWithConfidence = (contextGoals || []).map((goal) => {
        const normalized = normalizeGoalRecord(goal);

        const createdDate = normalized.createdAt ? new Date(normalized.createdAt) : null;
        const deadlineDate = normalized.deadline ? new Date(normalized.deadline) : null;

        return {
          ...normalized,
          confidenceLevel: (normalized.status === 'active' || normalized.status === 'at-risk') && deadlineDate && createdDate
            ? calculateConfidencePercentage(
                new Date(),
                deadlineDate,
                normalized.targetValue,
                normalized.currentValue || 0,
                createdDate
              )
            : null
        };
      });
      setGoals(allGoalsWithConfidence);

      if (user) {
        try {
          const connections = await ConnectionOperations.fetchUserConnections();
          const crmConnections = [...(connections.crmConnections || []), ...(connections.externalConnections || [])]
            .filter(c => ['lofty', 'follow_up_boss'].includes(c.serviceName) && c.connectionStatus === 'connected');
          
          setCrmConnected(crmConnections[0] || null);
        } catch (error) {
          console.warn('Failed to load CRM connections', error);
          setCrmConnected(null);
        }
      } else {
        setCrmConnected(null);
      }
    } catch (error) {
      console.error("Error loading goals:", error);
      toast.error("Failed to load your goals data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [user, contextGoals]); // Added contextGoals to dependency array

  const handleSyncFromCrm = async () => {
    if (!crmConnected) {
      toast.error("No CRM connection found.");
      return;
    }

    setIsSyncingCrm(true);
    try {
      const provider = crmConnected.service_name;
      const providerLabel = provider === 'follow_up_boss' ? 'Follow Up Boss' : 'Lofty';

      const { data, error } = await supabase.functions.invoke('syncGoalProgressFromCrm', {
        body: {
          provider,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to sync goals from CRM.');
      }

      if (data.goalsUpdated > 0) {
        toast.success(`Synced ${data.goalsUpdated} goal(s) from ${providerLabel}.`);
      } else {
        toast.info('No updates needed — goals are already current.');
      }

      await refreshUserData();
    } catch (error) {
      console.error("Failed to sync from CRM:", error);
      const message = error instanceof Error ? error.message : "Failed to sync goals from CRM";
      toast.error(message);
    } finally {
      setIsSyncingCrm(false);
    }
  };

  const handleUpdateProgress = async (goalId, progressData) => {
    try {
      const goalToUpdate = goals.find((g) => g.id === goalId);
      if (!goalToUpdate) {
        toast.error("Goal not found.");
        return;
      }
      const isCompleted = progressData.currentValue >= goalToUpdate.targetValue;
      const progressPercentage = goalToUpdate.targetValue > 0
        ? Math.min(100, Math.round((progressData.currentValue / goalToUpdate.targetValue) * 100))
        : 0;
      const trend = isCompleted
        ? 'completed'
        : progressPercentage >= 80
          ? 'on-track'
          : progressPercentage >= 50
            ? 'behind'
            : 'at-risk';
      const finalData = {
        current_value: progressData.currentValue,
        status: isCompleted ? 'completed' : 'active',
        progress_percentage: progressPercentage,
        trend
      };

      await Goal.update(goalId, finalData);
        
      await refreshUserData();
      setShowUpdateProgress(false);
      setSelectedGoal(null);
      toast.success("Goal progress updated!");
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress.");
    }
  };

  const handleAddGoal = async (goalData) => {
    try {
      const payload = {
        title: goalData.title,
        user_id: user.id,
        goal_type: 'custom',
        status: 'active',
        target_value: goalData.targetValue,
        current_value: goalData.currentValue || 0,
        unit: goalData.unit,
        timeframe: goalData.timeframe,
        deadline: goalData.deadline
      };
      
      await Goal.create(payload);
        
      await refreshUserData();
      setShowAddGoal(false);
      toast.success("New custom goal added!");
    } catch (error) {
      console.error("Error adding custom goal:", error);
      toast.error("Failed to add new goal.");
    }
  };

  const handlePlanSaved = async () => {
    await refreshUserData(); // Refresh user data to get updated goals from context
    setShowPlannerModal(false);
  };

  const handleDownloadGoals = async () => {
    if (goals.length === 0) {
      toast.info("No goals to download.");
      return;
    }

    try {
      let brandHex = '#7C3AED';
      if (user) {
        try {
          const palettes = await BrandColorPalette.filter({ userId: user.id });
          if (palettes && palettes.length > 0 && palettes[0].primaryHex) {
            brandHex = palettes[0].primaryHex;
          }
        } catch (error) {
          console.warn('Failed to load brand palette', error);
        }
      }

      generateGoalsReportPdf({
        summaryData,
        priorityGoals: priorityGoalsData,
        activityGoals: activityDriversData,
        allGoals: goals,
        planYear: businessPlan?.plan_year || businessPlan?.planYear || new Date().getFullYear(),
        brandColor: brandHex
      });

      toast.success("Goals report downloaded as PDF.");
    } catch (error) {
      console.error('Error generating goals report PDF:', error);
      toast.error("Failed to download goals report.");
    }
  };

  const handleGenerateActions = async () => {
    if (!user || !preferences) {
      toast.error("User data or preferences not available.");
      return;
    }

    setGeneratingActions(true);
    try {
      const result = await generateDailyTasks(user, preferences);

      if (Array.isArray(result) && result.length > 0) {
        toast.success(`${result.length} new daily action(s) generated!`);
      } else if (result === 'already_exists') {
        toast.info("Today's actions have already been generated.");
      } else {
        toast.info("No new actions were generated based on your current plan.");
      }
      await refreshUserData();
    } catch (error) {
      console.error("Error generating actions from Goals page:", error);
      toast.error("Could not generate actions.");
    } finally {
      setGeneratingActions(false);
    }
  };


  // Filter goals for specific sections AFTER all goals are loaded
  const activeProductionGoals = useMemo(() => goals.filter((g) => g.status === 'active' && g.category === 'production'), [goals]);
  const activeActivityGoals = useMemo(
    () => goals.filter((g) => g.status === 'active' && ['activity', 'lead-generation'].includes(g.category)),
    [goals]
  );


  // --- NEW DASHBOARD CALCULATIONS ---

  const summaryData = useMemo(() => {
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    const quarterStart = startOfQuarter(now);
    const quarterEnd = endOfQuarter(now);

    const activeGoals = goals.filter((goal) => ['active', 'completed'].includes(goal.status));
    const totalTarget = activeGoals.reduce((sum, goal) => sum + (goal.targetValue || 0), 0);
    const totalCurrent = activeGoals.reduce((sum, goal) => sum + (goal.currentValue || 0), 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

    const gciGoal = activeProductionGoals.find((g) => ['Annual GCI', 'Total GCI'].includes(g.title));
    const annualGciTarget = gciGoal?.targetValue || businessPlan?.gci_required || businessPlan?.gciRequired || 0;
    const currentGci = gciGoal?.currentValue || 0;
    const ytdGciProgress = annualGciTarget > 0 ? Math.round((currentGci / annualGciTarget) * 100) : 0;

    const quarterGoals = activeGoals.filter((goal) => {
      if (!goal.deadline) return false;
      const deadline = new Date(goal.deadline);
      return deadline >= quarterStart && deadline <= quarterEnd;
    });
    const quarterTarget = quarterGoals.reduce((sum, goal) => sum + (goal.targetValue || 0), 0);
    const quarterCurrent = quarterGoals.reduce((sum, goal) => sum + (goal.currentValue || 0), 0);
    const quarterlyProgress = quarterTarget > 0 ? Math.round((quarterCurrent / quarterTarget) * 100) : 0;

    const elapsedDays = Math.max(0, differenceInDays(now, yearStart));
    const totalDays = Math.max(1, differenceInDays(yearEnd, yearStart));
    const timeElapsedRatio = elapsedDays / totalDays;
    const totalProgressRatio = totalTarget > 0 ? totalCurrent / totalTarget : 0;
    const projectedPace = timeElapsedRatio > 0 ? Math.min(100, Math.round((totalProgressRatio / timeElapsedRatio) * 100)) : 0;

    return {
      overallProgress,
      currentGci: formatCurrency(currentGci),
      annualGciTarget: formatCurrency(annualGciTarget),
      ytdGciProgress,
      quarterlyProgress,
      currentQuarter: `Q${getQuarter(now)} ${formatDate(now, 'yyyy')}`,
      projectedPace,
    };
  }, [goals, activeProductionGoals, businessPlan]);

  const priorityGoalsData = useMemo(() => {
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    const elapsedRatio = differenceInDays(yearEnd, yearStart) > 0
      ? differenceInDays(now, yearStart) / differenceInDays(yearEnd, yearStart)
      : 0;

    const planBuyerTarget = businessPlan?.buyer_deals ?? businessPlan?.buyerDeals ?? 0;
    const planListingTarget = businessPlan?.listing_deals ?? businessPlan?.listingDeals ?? 0;
    const planVolumeTarget = businessPlan?.total_volume ?? businessPlan?.totalVolume ?? 0;

    const definitions = [
      { title: 'Total Buyers Closed', unit: 'closings', fallback: planBuyerTarget },
      { title: 'Total Listings Closed', unit: 'closings', fallback: planListingTarget },
      { title: 'Total Sales Volume', unit: 'USD', fallback: planVolumeTarget },
    ];

    return definitions.map((definition) => {
      const goal = activeProductionGoals.find((g) => g.title === definition.title);
      const targetValue = goal?.targetValue ?? definition.fallback ?? 0;
      const currentValue = goal?.currentValue ?? 0;
      const targetUnit = goal?.targetUnit || definition.unit;
      const actualProgress = targetValue > 0 ? currentValue / targetValue : 0;
      const isCurrency = targetUnit === 'USD';

      let status = 'On Track';
      let statusColor = 'bg-green-100 text-green-800';
      let nextStep = `You are on track to meet your goal of ${isCurrency ? formatCurrency(targetValue) : targetValue}.`;

      if (actualProgress < elapsedRatio * 0.8) {
        status = 'At Risk';
        statusColor = 'bg-red-100 text-red-800';
        const neededRaw = Math.max(0, targetValue * elapsedRatio - currentValue);
        const neededDisplay = isCurrency ? formatCurrency(neededRaw) : Math.ceil(neededRaw);
        nextStep = `You need ${neededRaw > 0 ? neededDisplay : 'to accelerate'}${!isCurrency ? ` ${targetUnit}` : ''} to get back on pace.`;
      } else if (actualProgress < elapsedRatio) {
        status = 'Slightly Behind';
        statusColor = 'bg-yellow-100 text-yellow-800';
        const neededRaw = Math.max(0, targetValue * elapsedRatio - currentValue);
        const neededDisplay = isCurrency ? formatCurrency(neededRaw) : Math.ceil(neededRaw);
        nextStep = `You are slightly behind pace. Aim for ${neededRaw > 0 ? neededDisplay : 'a bit more'}${!isCurrency ? ` ${targetUnit}` : ''} soon.`;
      }

      return {
        id: goal?.id || definition.title,
        title: definition.title,
        targetValue,
        currentValue,
        targetUnit,
        progress: Math.round(actualProgress * 100),
        status,
        statusColor,
        nextStep,
      };
    });
  }, [activeProductionGoals, businessPlan]);

  const activityDriversData = useMemo(() => {
    const sorted = [...activeActivityGoals].sort((a, b) => (b.targetValue || 0) - (a.targetValue || 0));
    return sorted.slice(0, 2).map((goal) => {
      const progress = goal.targetValue > 0 ? Math.round(((goal.currentValue || 0) / goal.targetValue) * 100) : 0;
      return {
        ...goal,
        progress,
      };
    });
  }, [activeActivityGoals]);

  const forecastData = useMemo(() => {
    const planYear = businessPlan?.plan_year || businessPlan?.planYear || new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => ({
      name: formatDate(new Date(planYear, i, 1), 'MMM'),
      goal: ((i + 1) / 12) * 100,
    }));

    const totalTarget = activeProductionGoals.reduce((sum, goal) => sum + (goal.targetValue || 0), 0);
    const totalCurrent = activeProductionGoals.reduce((sum, goal) => sum + (goal.currentValue || 0), 0);
    const totalProgressRatio = totalTarget > 0 ? totalCurrent / totalTarget : 0;

    const now = new Date();
    let currentMonthIndex = 11;
    if (planYear === now.getFullYear()) {
      currentMonthIndex = now.getMonth();
    } else if (planYear > now.getFullYear()) {
      currentMonthIndex = -1;
    }

    const progressPerMonth = currentMonthIndex >= 0 ? totalProgressRatio / Math.max(1, currentMonthIndex + 1) : 0;

    return months.map((month, index) => ({
      ...month,
      actual: index <= currentMonthIndex && currentMonthIndex >= 0
        ? Math.min(100, progressPerMonth * (index + 1) * 100)
        : null,
    }));
  }, [activeProductionGoals, businessPlan]);

  const performanceDiagnostics = useMemo(() => {
    if (!summaryData || !priorityGoalsData) return null;

    const overallProgress = summaryData.overallProgress;
    const laggingGoal = priorityGoalsData.find(g => g.status === 'At Risk' || g.status === 'Slightly Behind');

    let diagnosticsSummary = `Overall goal progress is ${overallProgress}%.`;
    if (laggingGoal) {
      diagnosticsSummary += ` A key goal, "${laggingGoal.title}", is currently ${laggingGoal.status}. Next step: ${laggingGoal.nextStep}.`;
    } else {
      diagnosticsSummary += ` All priority goals are on track.`;
    }

    return {
      overallProgress: overallProgress,
      ytdGciProgress: summaryData.ytdGciProgress,
      quarterlyProgress: summaryData.quarterlyProgress,
      projectedPace: summaryData.projectedPace,
      laggingGoal: laggingGoal ? { title: laggingGoal.title, status: laggingGoal.status, nextStep: laggingGoal.nextStep } : null,
      diagnostics: diagnosticsSummary
    };
  }, [summaryData, priorityGoalsData]);

  const buildInsights = useCallback(() => {
    if (!performanceDiagnostics) {
      return {
        performanceAnalysis: 'Keep pushing forward on your goals. Focus on consistent daily action.',
        recommendedActions: [
          'Review your goal progress daily',
          'Focus on your highest priority goal',
          'Track your key metrics consistently'
        ],
        weeklyFocus: 'Maintain consistency and focus on your top priority goals.',
      };
    }

    const laggingGoal = priorityGoalsData.find((goal) => goal.status === 'At Risk' || goal.status === 'Slightly Behind');
    const topActivity = activityDriversData[0];

    const analysisParts = [`Your overall goal progress is ${summaryData.overallProgress}%.`];
    if (laggingGoal) {
      analysisParts.push(`A key goal, "${laggingGoal.title}", is currently ${laggingGoal.status}. ${laggingGoal.nextStep}`);
    } else {
      analysisParts.push('All priority goals are currently on track.');
    }

    const recommended = [];
    if (laggingGoal) {
      recommended.push(`Focus on ${laggingGoal.title.toLowerCase()} — ${laggingGoal.nextStep}`);
    }
    if (topActivity) {
      recommended.push(`Increase momentum for ${topActivity.title.toLowerCase()} to hit ${topActivity.targetValue}.`);
    }
    if (summaryData.projectedPace < 90) {
      recommended.push('Schedule a mid-week pipeline review to adjust your activity mix.');
    }
    recommended.push('Celebrate recent wins and reset your targets for the upcoming week.');

    const weeklyFocus = laggingGoal
      ? `This week, prioritize ${laggingGoal.title.toLowerCase()}. ${laggingGoal.nextStep}`
      : topActivity
        ? `This week, prioritize consistent ${topActivity.title.toLowerCase()} to sustain your pipeline.`
        : 'This week, stay consistent with your daily lead generation routines.';

    return {
      performanceAnalysis: analysisParts.join(' '),
      recommendedActions: [...new Set(recommended)].slice(0, 4),
      weeklyFocus,
    };
  }, [performanceDiagnostics, priorityGoalsData, activityDriversData, summaryData]);

  const loadCachedInsights = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      const cachedRaw = window.localStorage.getItem(insightsStorageKey);
      if (!cachedRaw) return false;
      const cached = JSON.parse(cachedRaw);
      const generatedAt = cached?.meta?.generatedAt;
      if (!generatedAt) return false;
      const ageMs = Date.now() - new Date(generatedAt).getTime();
      if (ageMs > 30 * 60 * 1000) return false;
      setAiInsights(cached.insights);
      setInsightsMeta(cached.meta);
      setInsightsLoading(false);
      return true;
    } catch (error) {
      console.warn('Failed to load cached insights', error);
      return false;
    }
  }, [insightsStorageKey]);

  const refreshInsights = useCallback(async (forceRefresh = false) => {
    if (!goals || goals.length === 0) return;

    if (!forceRefresh && loadCachedInsights()) {
      return;
    }

    setInsightsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const insights = buildInsights();
      const meta = { generatedAt: new Date().toISOString() };
      setAiInsights(insights);
      setInsightsMeta(meta);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(insightsStorageKey, JSON.stringify({ insights, meta }));
      }
    } catch (error) {
      console.error('Error generating goals insights:', error);
      setAiInsights(buildInsights());
    } finally {
      setInsightsLoading(false);
    }
  }, [buildInsights, goals, loadCachedInsights, insightsStorageKey]);

  useEffect(() => {
    refreshInsights(false);
  }, [refreshInsights]);

  const handleRefreshInsights = useCallback(() => {
    refreshInsights(true);
  }, [refreshInsights]);

  useEffect(() => {
    setInsightsExpanded(false);
  }, [aiInsights]);

  // --- END OF NEW CALCULATIONS ---

  // This function now only renders the content *below* the main page header
  const renderGoalsMainContent = () => {
    return (
      <>
        {/* CRM Connection Status Banner */}
        {crmConnected && (
          <div className="mb-6 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm font-semibold text-teal-900">
                    {crmConnected.service_name === 'follow_up_boss' ? 'Follow Up Boss' : 'Lofty'} Connected
                  </p>
                  <p className="text-xs text-teal-700">
                    Your goals automatically sync with your CRM data
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSyncFromCrm}
                disabled={isSyncingCrm}
                variant="outline"
                size="sm"
                className="border-teal-300 text-teal-700 hover:bg-teal-100"
              >
                {isSyncingCrm ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* TOP SECTION — Performance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1E293B]">{summaryData.overallProgress}%</div>
              <p className="text-xs text-gray-500 mt-1">Across all goals</p>
              <Progress value={summaryData.overallProgress} className="h-2 mt-2" indicatorClassName="bg-[#7C3AED]" />
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Year-to-Date GCI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1E293B]">{summaryData.currentGci}</div>
              <p className="text-xs text-gray-500 mt-1">of {summaryData.annualGciTarget}</p>
              <Progress value={summaryData.ytdGciProgress} className="h-2 mt-2" indicatorClassName="bg-[#7C3AED]" />
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Quarterly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1E293B]">{summaryData.quarterlyProgress}%</div>
              <p className="text-xs text-gray-500 mt-1">In {summaryData.currentQuarter}</p>
              <Progress value={summaryData.quarterlyProgress} className="h-2 mt-2" indicatorClassName="bg-[#7C3AED]" />
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Year-End Pace</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1E293B]">{summaryData.projectedPace}%</div>
              <p className="text-xs text-gray-500 mt-1">Based on current performance</p>
              <div className="h-2 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE SECTION — Focus Area Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white">
            <CardHeader><CardTitle>Priority Goals</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {priorityGoalsData.map((goal) =>
                <div key={goal.id}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">{goal.title}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${goal.statusColor}`}>{goal.status}</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" indicatorClassName="bg-[#7C3AED]" />
                  <p className="text-xs text-gray-500 mt-2">
                    {goal.targetUnit === 'USD' ? formatCurrency(goal.currentValue) : goal.currentValue} of {goal.targetUnit === 'USD' ? formatCurrency(goal.targetValue) : goal.targetValue}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded-md">{goal.nextStep}</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardHeader><CardTitle>Activity Drivers</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {activityDriversData.map((goal) =>
                <div key={goal.id}>
                  <p className="text-sm font-medium">{goal.title}</p>
                  <Progress value={goal.progress} className="h-2 mt-2" indicatorClassName="bg-[#7C3AED]" />
                  <p className="text-xs text-gray-500 mt-2">{goal.currentValue} of {goal.targetValue}</p>
                </div>
              )}
              <Button className="w-full mt-4" onClick={handleGenerateActions} disabled={generatingActions}>
                {generatingActions ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Generate Actions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* BOTTOM SECTION — Forecast & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white">
            <CardHeader><CardTitle>Performance Forecast</CardTitle></CardHeader>
            <CardContent style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip
                    contentStyle={{ fontSize: 12, padding: '4px 8px' }}
                    formatter={(value) => `${parseFloat(value).toFixed(1)}%`}
                  />
                  <Line type="monotone" dataKey="goal" stroke="#A8A29E" strokeWidth={2} dot={false} name="Goal Pace" />
                  <Line type="monotone" dataKey="actual" stroke="#7C3AED" strokeWidth={2} dot={false} name="Actual Progress" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* Replaced old AI Insights with a dummy card for structure - actual AI insights are now in sidebar */}
          <Card className="bg-white">
            <CardHeader><CardTitle>AI Insights Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-semibold text-[#1E293B]">Check the sidebar for your latest AI-driven insights.</p>
                <p className="text-xs text-gray-600">We refresh your insights whenever your goals update so you always know what to do next.</p>
              </div>
              <Button className="w-full" variant="outline" onClick={() => setActiveTab('insights')}>
                View All Insights
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  // RIGHT SIDEBAR - Changes based on active tab
  const renderSidebarContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-12">
          <InlineLoader message="Loading sidebar..." />
        </div>
      );
    }

    switch (activeTab) {
      case 'tracking':
        return (
          <div className="space-y-6">
            <h4 className="text-base font-semibold text-[#1E293B]">Activity Goals</h4>
            {activeActivityGoals.length > 0 ? (
              <div className="space-y-4">
                {activeActivityGoals.map((goal) => {
                  const progressPercentage = goal.targetValue > 0
                    ? Math.round(((goal.currentValue || 0) / goal.targetValue) * 100)
                    : 0;

                  return (
                    <div key={goal.id} className="border-b border-[#E2E8F0] pb-4 last:border-0">
                      <h5 className="mb-1 text-sm font-semibold text-[#1E293B]">{goal.title}</h5>
                      <p className="text-lg font-semibold text-[#1E293B]">{goal.currentValue}</p>
                      <p className="mb-2 text-xs text-[#64748B]">of {goal.targetValue}</p>
                      <Progress value={progressPercentage} indicatorClassName="bg-[#7C3AED]" className="h-2" />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-[#64748B]">{progressPercentage}% complete</span>
                        <button
                          onClick={() => {
                            setSelectedGoal(goal);
                            setShowUpdateProgress(true);
                          }}
                          className="text-sm font-medium text-[#7C3AED] hover:text-[#6D28D9]"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#64748B]">No active activity goals set.</p>
            )}

            {crmConnected && (
              <div className="border-t border-[#E2E8F0] pt-4">
                <Button
                  onClick={handleSyncFromCrm}
                  disabled={isSyncingCrm}
                  variant="outline"
                  className="w-full"
                >
                  {isSyncingCrm ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {isSyncingCrm
                    ? 'Syncing...'
                    : `Sync from ${crmConnected.service_name === 'follow_up_boss' ? 'Follow Up Boss' : 'Lofty'}`}
                </Button>
              </div>
            )}
          </div>
        );

      case 'insights': {
        const analysisText = aiInsights?.performanceAnalysis || 'Keep pushing forward on your goals. Focus on consistent daily action.';
        const shouldTruncate = analysisText.length > 260 && !insightsExpanded;
        const analysisDisplay = shouldTruncate ? `${analysisText.slice(0, 260)}…` : analysisText;
        const cacheLabel = insightsMeta?.generatedAt
          ? `Loaded from recent insights (${formatDistanceToNow(new Date(insightsMeta.generatedAt), { addSuffix: true })})`
          : null;

        return (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="flex items-center gap-2 text-base font-semibold text-[#1E293B]">
                  <img src="/images/icons/pulse-ai-icon.png" alt="PULSE AI" className="h-5 w-5" />
                  AI Goal Insights
                </h4>
                {cacheLabel && (
                  <span className="mt-2 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                    {cacheLabel}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleRefreshInsights}
                disabled={insightsLoading}
                className="rounded-full border border-[#E2E8F0] p-2 text-[#475569] transition-colors hover:bg-[#F8FAFC] hover:text-[#1E293B]"
                aria-label="Refresh insights"
              >
                <RefreshCw className={`h-4 w-4 ${insightsLoading ? 'animate-spin text-[#7C3AED]' : ''}`} />
              </button>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 p-5 text-white shadow-lg">
              {insightsLoading ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <img src="/images/icons/pulse-ai-icon.png" alt="Analyzing" className="h-10 w-10 animate-spin" />
                  <p className="text-sm text-violet-100">Analyzing your goals...</p>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-white/90">{analysisDisplay}</p>
                  {analysisText.length > 260 && (
                    <button
                      type="button"
                      onClick={() => setInsightsExpanded((prev) => !prev)}
                      className="mt-3 text-xs font-semibold text-white/80 underline"
                    >
                      {insightsExpanded ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1E293B]">Recommended Actions</h3>
              {insightsLoading ? (
                <LoadingIndicator text="Generating steps..." size="sm" />
              ) : (
                <ul className="space-y-2">
                  {(aiInsights?.recommendedActions?.length ? aiInsights.recommendedActions : defaultInsightActions).map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-[#475569]">
                      <span className="mt-1 text-[#6D28D9]">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <h3 className="mb-2 text-sm font-semibold text-[#1E293B]">Weekly Focus</h3>
              {insightsLoading ? (
                <LoadingIndicator text="Calculating focus..." size="sm" />
              ) : (
                <p className="text-sm text-[#475569]">
                  {aiInsights?.weeklyFocus || 'Maintain consistency and focus on your top priority goals.'}
                </p>
              )}
            </div>
          </div>
        );
      }


      case 'planner':
        return (
          <div className="space-y-6">
            <h4 className="text-base font-semibold text-[#1E293B]">Production Planner</h4>
            <p className="text-sm text-[#475569] mb-4">
              Use the planner to set up your annual production goals and activity targets.
            </p>
            <Button
              onClick={() => setShowPlannerModal(true)}
              className="w-full">

              Open Production Planner
            </Button>
          </div>);


      default:
        return null;
    }
  };

  return (
    <>
      <ContextualTopNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab} />


      <div className="flex-1 flex overflow-hidden">
        <div className="bg-[#F8FAFC] pt-6 pr-8 pb-8 pl-8 flex-1 overflow-y-auto">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-[30px] font-semibold text-[#1E293B]">Goals Overview</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddGoal(true)}
                  className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded transition-colors"
                  title="Add Custom Goal">
                  <PlusCircle className="w-5 h-5 text-[#475569]" />
                </button>
                <button
                  onClick={() => setShowPlannerModal(true)}
                  className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded transition-colors"
                  title="Edit Goals">
                  <Edit className="w-5 h-5 text-[#475569]" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded transition-colors"
                  title="Print Goals">
                  <Printer className="w-5 h-5 text-[#475569]" />
                </button>
                <button
                  onClick={handleDownloadGoals}
                  className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded transition-colors"
                  title="Download Goals">
                  <Download className="w-5 h-5 text-[#475569]" />
                </button>
              </div>
            </div>

            {loading ? (
              <PageLoader message="Loading your goals..." />
            ) : renderGoalsMainContent()}
          </div>
        </div>

        <ContextualSidebar title={getSidebarTitle(activeTab)}>
          {renderSidebarContent()}
        </ContextualSidebar>
      </div>

      {showUpdateProgress && selectedGoal &&
        <UpdateProgressModal
          isOpen={showUpdateProgress}
          onClose={() => {
            setShowUpdateProgress(false);
            setSelectedGoal(null);
          }}
          goal={selectedGoal}
          onUpdateProgress={handleUpdateProgress} />

      }

      {showAddGoal &&
        <AddGoalModal
          isOpen={showAddGoal}
          onClose={() => setShowAddGoal(false)}
          onAddGoal={handleAddGoal} />

      }

      {showPlannerModal &&
        <ProductionPlannerModal
          isOpen={showPlannerModal}
          onClose={() => setShowPlannerModal(false)}
          onPlanSaved={handlePlanSaved} />

      }
    </>);

}

function getSidebarTitle(tabId) {
  const titles = {
    tracking: 'Activity Goals',
    insights: 'AI Goal Insights',
    planner: 'Production Planner'
  };
  return titles[tabId] || 'Details';
}
