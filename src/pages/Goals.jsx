
import React, { useState, useEffect, useContext, useMemo } from "react";
import { UserContext } from '../components/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, PlusCircle, TrendingUp, Edit, Printer, Download, Lightbulb, Target, Activity, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import ContextualTopNav from "../components/layout/ContextualTopNav";
import ContextualSidebar from "../components/layout/ContextualSidebar";
import UpdateProgressModal from "../components/goals/UpdateProgressModal";
import ProductionPlannerModal from "../components/goal-planner/ProductionPlannerModal";
import AddGoalModal from "../components/goals/AddGoalModal";
import { calculateConfidencePercentage } from "../components/goals/confidenceCalculator";
import { startOfQuarter, endOfQuarter, differenceInDays, startOfYear, endOfYear, getQuarter, format as formatDate, startOfWeek, subWeeks } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { generateDailyTasks } from "../components/actions/taskGeneration";
import LoadingIndicator from "../components/ui/LoadingIndicator";

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(value || 0);

export default function GoalsPage() {
  const { user, goals: contextGoals, businessPlan, refreshUserData, allActions, preferences } = useContext(UserContext);
  
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

  const tabs = [
    { id: 'tracking', label: 'Tracking' },
    { id: 'insights', label: 'Insights' }, // This will be updated with AI insights
    { id: 'planner', label: 'Planner' }
  ];


  const loadPageData = async () => {
    setLoading(true);
    try {
      // Set all goals first, then filter for display as needed
      // Add confidence level to all active goals here, as it's a common derived property
      const allGoalsWithConfidence = (contextGoals || []).map((goal) => ({
        ...goal,
        confidenceLevel: (goal.status === 'active' || goal.status === 'at-risk') ? calculateConfidencePercentage(
          new Date(),
          new Date(goal.deadline),
          goal.targetValue,
          goal.currentValue || 0,
          new Date(goal.created_date)
        ) : null
      }));
      setGoals(allGoalsWithConfidence); // Set all goals from context

      if (user) {
        // TODO: Implement CRM connections checking
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
    setIsSyncingCrm(true);
    try {
      // TODO: Implement CRM sync functionality
      toast.info("CRM sync functionality coming soon!");
    } catch (error) {
      console.error("Failed to sync from CRM:", error);
      toast.error("Failed to sync goals from CRM");
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
      const finalData = { 
        current_value: progressData.currentValue,
        status: isCompleted ? 'completed' : 'active' 
      };

      await supabase
        .from('goals')
        .update(finalData)
        .eq('id', goalId);
        
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
      
      await supabase
        .from('goals')
        .insert(payload);
        
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
    toast.success("Production plan saved!");
  };

  const handleDownloadGoals = () => {
    if (goals.length === 0) {
      toast.info("No goals to download.");
      return;
    }

    const headers = ["Title", "Category", "Current Value", "Target Value", "Unit", "Confidence Level", "Deadline"];
    const csvRows = [];

    // Add headers to CSV
    csvRows.push(headers.join(','));

    // Add data rows
    goals.forEach((goal) => {
      const values = [
        `"${goal.title ? String(goal.title).replace(/"/g, '""') : ''}"`, // Escape double quotes
        `"${goal.category ? String(goal.category).replace(/"/g, '""') : ''}"`,
        goal.currentValue || 0,
        goal.targetValue || 0,
        `"${goal.targetUnit ? String(goal.targetUnit).replace(/"/g, '""') : ''}"`,
        goal.confidenceLevel ? `${goal.confidenceLevel}%` : 'N/A',
        goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'N/A'
      ];

      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'goals_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Goals downloaded successfully!");
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
  const activeActivityGoals = useMemo(() => goals.filter((g) => g.status === 'active' && g.category === 'activity'), [goals]);


  // --- NEW DASHBOARD CALCULATIONS ---

  const summaryData = useMemo(() => {
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    const quarterStart = startOfQuarter(now);
    const quarterEnd = endOfQuarter(now);

    const totalProductionGoals = activeProductionGoals.length; // Use activeProductionGoals
    const completedProductionGoals = activeProductionGoals.filter((g) => g.status === 'completed').length; // Use activeProductionGoals

    // Card 1: Overall Goal Progress (consider active goals for progress)
    const overallProgress = totalProductionGoals > 0 ? completedProductionGoals / totalProductionGoals * 100 : 0;

    // Card 2: YTD GCI
    const gciGoal = activeProductionGoals.find((g) => g.title === 'Total GCI'); // Use activeProductionGoals
    const annualGciTarget = businessPlan?.gciRequired || gciGoal?.targetValue || 0;
    const currentGci = gciGoal?.currentValue || 0;
    const ytdGciProgress = annualGciTarget > 0 ? currentGci / annualGciTarget * 100 : 0;

    // Card 3: Current Quarter Progress
    const quarterGoals = activeProductionGoals.filter((g) => { // Use activeProductionGoals
      const deadline = new Date(g.deadline);
      return deadline >= quarterStart && deadline <= quarterEnd;
    });
    const completedQuarterGoals = quarterGoals.filter((g) => g.status === 'completed').length;
    const quarterlyProgress = quarterGoals.length > 0 ? completedQuarterGoals / quarterGoals.length * 100 : 0;

    // Card 4: Projected Year-End Pace
    const daysInYear = differenceInDays(yearEnd, yearStart);
    const elapsedDays = differenceInDays(now, yearStart);
    const timeElapsedRatio = daysInYear > 0 ? elapsedDays / daysInYear : 0;

    const totalProgressRatio = activeProductionGoals.reduce((acc, goal) => { // Use activeProductionGoals
      const progress = (goal.currentValue || 0) / goal.targetValue;
      return acc + (isNaN(progress) ? 0 : progress);
    }, 0) / (activeProductionGoals.length || 1); // Avoid division by zero

    const projectedPace = timeElapsedRatio > 0 ? totalProgressRatio / timeElapsedRatio * 100 : 0;


    return {
      overallProgress: Math.round(overallProgress),
      currentGci: formatCurrency(currentGci),
      annualGciTarget: formatCurrency(annualGciTarget),
      ytdGciProgress: Math.round(ytdGciProgress),
      quarterlyProgress: Math.round(quarterlyProgress),
      currentQuarter: `Q${getQuarter(now)} ${formatDate(now, 'yyyy')}`,
      projectedPace: Math.min(100, Math.round(projectedPace))
    };
  }, [activeProductionGoals, businessPlan]); // Depend on activeProductionGoals

  const priorityGoalsData = useMemo(() => {
    const mainTitles = ["Total Buyers Closed", "Total Listings Closed", "Total Sales Volume"];
    return activeProductionGoals.filter((g) => mainTitles.includes(g.title)).map((goal) => { // Use activeProductionGoals
      const now = new Date();
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);
      const timeElapsedRatio = differenceInDays(yearEnd, yearStart) > 0 ? differenceInDays(now, yearStart) / differenceInDays(yearEnd, yearStart) : 0;
      const expectedProgress = timeElapsedRatio;
      const actualProgress = goal.targetValue > 0 ? (goal.currentValue || 0) / goal.targetValue : 0;

      const isCurrency = goal.targetUnit === 'USD';

      let status = 'On Track';
      let statusColor = 'bg-green-100 text-green-800';
      let nextStep = `You are on track to meet your goal of ${isCurrency ? formatCurrency(goal.targetValue) : goal.targetValue}.`;

      if (actualProgress < expectedProgress * 0.8) {
        status = 'At Risk';
        statusColor = 'bg-red-100 text-red-800';
        const needed = Math.ceil(goal.targetValue * expectedProgress - goal.currentValue);
        const formattedNeeded = isCurrency ? formatCurrency(needed) : needed;
        nextStep = `You need ${needed > 0 ? formattedNeeded : 'to accelerate'} ${!isCurrency ? goal.targetUnit : ''} to get back on pace.`.trim();
      } else if (actualProgress < expectedProgress) {
        status = 'Slightly Behind';
        statusColor = 'bg-yellow-100 text-yellow-800';
        const needed = Math.ceil(goal.targetValue * expectedProgress - goal.currentValue);
        const formattedNeeded = isCurrency ? formatCurrency(needed) : needed;
        nextStep = `You are slightly behind pace. Aim for ${needed > 0 ? formattedNeeded : 'more'} ${!isCurrency ? goal.targetUnit : ''} soon.`.trim();
      }

      return {
        ...goal,
        progress: Math.round(actualProgress * 100),
        status,
        statusColor,
        nextStep
      };
    });
  }, [activeProductionGoals]); // Depend on activeProductionGoals

  const activityDriversData = useMemo(() => {
    return activeActivityGoals.slice(0, 2).map((goal) => { // Use activeActivityGoals
      const progress = goal.targetValue > 0 ? (goal.currentValue || 0) / goal.targetValue * 100 : 0;
      return {
        ...goal,
        progress: Math.round(progress),
        paceLabel: 'Pace calculation pending'
      };
    });
  }, [activeActivityGoals]); // Depend on activeActivityGoals

  const forecastData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      name: formatDate(new Date(2024, i, 1), 'MMM'),
      goal: (i + 1) / 12 * 100
    }));

    const currentMonth = new Date().getMonth();
    const totalProgressRatio = activeProductionGoals.reduce((acc, goal) => { // Use activeProductionGoals
      const progress = (goal.currentValue || 0) / goal.targetValue;
      return acc + (isNaN(progress) ? 0 : progress);
    }, 0) / (activeProductionGoals.length || 1); // Avoid division by zero

    months.forEach((month, i) => {
      if (i <= currentMonth) {
        month.actual = totalProgressRatio / (currentMonth + 1) * (i + 1) * 100;
      } else {
        month.actual = null;
      }
    });
    return months;
  }, [activeProductionGoals]); // Depend on activeProductionGoals

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

  // Generate AI insights for goals
  useEffect(() => {
    const generateInsights = async () => {
      if (!goals || goals.length === 0 || !user || !performanceDiagnostics) return;

      setInsightsLoading(true);
      try {
        // Prepare goals data
        const preparedGoals = goals.map(g => {
          const matchingPriorityGoal = priorityGoalsData.find(pg => pg.id === g.id);
          const progressPercentage = matchingPriorityGoal
            ? matchingPriorityGoal.progress
            : (g.targetValue > 0 ? Math.round((g.currentValue || 0) / g.targetValue * 100) : 0);

          let trend = 'on-track'; // Default trend
          if (g.status === 'completed') trend = 'completed';
          else if (g.confidenceLevel !== null) {
            if (g.confidenceLevel < 50) trend = 'at-risk';
            else if (g.confidenceLevel < 80) trend = 'behind';
            else trend = 'on-track';
          }
          // Override with more precise status from priorityGoalsData if available
          if (matchingPriorityGoal && matchingPriorityGoal.status) {
            if (matchingPriorityGoal.status === 'At Risk') trend = 'at-risk';
            else if (matchingPriorityGoal.status === 'Slightly Behind') trend = 'behind';
            else if (matchingPriorityGoal.status === 'On Track') trend = 'on-track';
          }

          return {
            title: g.title,
            category: g.category,
            targetValue: g.targetValue,
            currentValue: g.currentValue,
            progressPercentage: progressPercentage,
            trend: trend,
            deadline: g.deadline
          };
        });

        const goalsData = {
          totalGoals: preparedGoals.length,
          onTrack: preparedGoals.filter(g => g.trend === 'on-track').length,
          behind: preparedGoals.filter(g => g.trend === 'behind').length,
          atRisk: preparedGoals.filter(g => g.trend === 'at-risk').length,
          goals: preparedGoals
        };

        // Prepare activity data (if available)
        const activityData = {
          recentActions: allActions?.slice(0, 10).map(a => ({
            type: a.actionType,
            status: a.status,
            date: a.created_date // Use created_date for actionDate if available
          }))
        };

        // Get pulse data for diagnostics
        const pulseData = performanceDiagnostics ? {
          diagnostics: performanceDiagnostics.diagnostics
        } : null;

        // TODO: Implement AI insights generation
        setAiInsights({
          performanceAnalysis: 'Keep pushing forward on your goals. Focus on consistent daily action.',
          nextSteps: [
            'Review your goal progress daily',
            'Focus on your highest priority goal',
            'Track your key metrics consistently'
          ],
          weeklyFocus: 'Maintain consistency and focus on your top priority goals.'
        });
      } catch (error) {
        console.error('Error generating goals insights:', error);
        setAiInsights({
          performanceAnalysis: 'Keep pushing forward on your goals. Focus on consistent daily action.',
          nextSteps: [
            'Review your goal progress daily',
            'Focus on your highest priority goal',
            'Track your key metrics consistently'
          ],
          weeklyFocus: 'Maintain consistency and focus on your top priority goals.'
        });
      } finally {
        setInsightsLoading(false);
      }
    };

    generateInsights();
  }, [goals, user, allActions, performanceDiagnostics, priorityGoalsData]); // Add priorityGoalsData as dependency

  // --- END OF NEW CALCULATIONS ---

  // This function now only renders the content *below* the main page header
  const renderGoalsMainContent = () => {
    return (
      <>
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
                {generatingActions ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate Actions"}
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
              <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                <Lightbulb className="w-5 h-5 text-[#7C3AED] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Check the sidebar for your latest AI-driven insights!</p>
                  <p className="text-xs text-gray-600">Our AI has analyzed your goals and activities to provide actionable advice.</p>
                </div>
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
          <LoadingIndicator text="Loading sidebar..." size="md" />
        </div>);

    }

    switch (activeTab) {
      case 'tracking':
        return (
          <div className="space-y-6">
            <h4 className="text-base font-semibold text-[#1E293B]">Activity Goals</h4>
            {activeActivityGoals.length > 0 ? // Use activeActivityGoals here
              <div className="space-y-4">
                {activeActivityGoals.map((goal) => {
                  const progressPercentage = goal.targetValue > 0 ? goal.currentValue / goal.targetValue * 100 : 0;

                  return (
                    <div key={goal.id} className="pb-4 border-b border-[#E2E8F0] last:border-0">
                      <h5 className="text-[#1E293B] mb-2 text-sm font-medium">{goal.title}</h5>
                      <p className="text-[#1E293B] mb-1 text-lg font-medium">{goal.currentValue}</p>
                      <p className="text-xs text-[#64748B] mb-3">of {goal.targetValue}</p>
                      <Progress value={progressPercentage} indicatorClassName="bg-[#7C3AED]" className="h-2 mb-2" />
                      <button
                        onClick={() => {
                          setSelectedGoal(goal);
                          setShowUpdateProgress(true);
                        }}
                        className="text-sm text-[#7C3AED] font-medium hover:text-[#6D28D9]">

                        Update
                      </button>
                    </div>);

                })}
              </div> :

              <p className="text-sm text-[#64748B]">No active activity goals set.</p>
            }

            {crmConnected &&
              <div className="pt-4 border-t border-[#E2E8F0]">
                <Button
                  onClick={handleSyncFromCrm}
                  disabled={isSyncingCrm}
                  variant="outline"
                  className="w-full">

                  {isSyncingCrm ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Sync from CRM
                </Button>
              </div>
            }
          </div>);

      case 'insights': // This case is updated to use the new AI insights
        return (
          <div className="space-y-6">
            {/* Performance Analysis */}
            <div>
              <h3 className="text-sm font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
                <img
                  src="/images/icons/pulse-ai-icon.png"
                  alt="AI Analysis"
                  className="w-4 h-4 object-contain"
                />
                Performance Analysis
              </h3>
              {insightsLoading ? (
                <LoadingIndicator text="Analyzing..." size="sm" />
              ) : (
                <p className="text-sm text-[#475569] leading-relaxed">
                  {aiInsights?.performanceAnalysis || 'Keep pushing forward on your goals. Focus on consistent daily action.'}
                </p>
              )}
            </div>

            {/* Next Steps */}
            <div>
              <h3 className="text-sm font-semibold text-[#1E293B] mb-3">Next Steps</h3>
              {insightsLoading ? (
                <LoadingIndicator text="Generating steps..." size="sm" />
              ) : (
                <ul className="space-y-2">
                  {(aiInsights?.nextSteps || [
                    'Review your goal progress daily',
                    'Focus on your highest priority goal',
                    'Track your key metrics consistently'
                  ]).map((step, index) => (
                    <li key={index} className="text-sm text-[#475569] flex items-start gap-2">
                      <span className="text-[#6D28D9] mt-1">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Your Focus This Week */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#1E293B] mb-2">Your Focus This Week</h3>
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

            {loading ?
              <div className="flex items-center justify-center h-64">
                <LoadingIndicator text="Loading your goals..." size="lg" />
              </div> :

              renderGoalsMainContent()
            }
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
    tracking: 'Tracking',
    insights: 'Insights',
    planner: 'Planning Tools'
  };
  return titles[tabId] || 'Details';
}
