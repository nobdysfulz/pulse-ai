
import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { UserContext } from '../components/context/UserContext';
import { DailyAction, AgentConfig } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardHeader, CardTitle
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, RefreshCw, Printer, Download, Clock, Info, Calendar as CalendarIcon, ArrowUp, ArrowDown, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameDay, eachHourOfInterval, startOfDay, endOfDay, subWeeks, eachDayOfInterval, differenceInHours, getHours, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { calculatePulseScore } from "../components/pulse/pulseScoring";
import { generateDailyTasks } from "../components/actions/taskGeneration";
import ContextualTopNav from '../components/layout/ContextualTopNav';
import ContextualSidebar from '../components/layout/ContextualSidebar';
import AddActionModal from '../components/actions/AddActionModal';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Bar, BarChart } from 'recharts';
import ReactMarkdown from 'react-markdown';
import LoadingIndicator, { InlineLoadingIndicator } from '../components/ui/LoadingIndicator';

export default function ToDoPage() {
  const {
    user,
    preferences,
    loading: contextLoading,
    goals: contextGoals,
    actions: allActions,
    businessPlan,
    pulseConfig,
    agentProfile,
    refreshUserData
  } = useContext(UserContext);

  // Check URL params for tab
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'schedule');

  // Listen for URL changes to update active tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [window.location.search]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pulseData, setPulseData] = useState(null);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]); // This state is kept but not used by new ScheduleView
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [displayedTasksCount, setDisplayedTasksCount] = useState(10);
  const [aiTakeaways, setAiTakeaways] = useState(null);
  const [takeawaysLoading, setTakeawaysLoading] = useState(false);


  const tabs = [
    { id: 'schedule', label: 'Daily Action Plan' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'scores', label: 'Scores' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'goals', label: 'Goals' }];


  const todayFormatted = useMemo(() => {
    const timezone = preferences?.timezone || 'America/New_York';
    return new Date().toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone
    });
  }, [preferences]);

  useEffect(() => {
    if (!contextLoading && user) {
      // Use the centralized calculatePulseScore function
      const contactCount = agentProfile?.databaseSize ? parseInt(agentProfile.databaseSize) : 0;
      const calculatedScore = calculatePulseScore(contextGoals || [], allActions || [], agentProfile, contactCount);
      setPulseData(calculatedScore);

      checkGoogleCalendar();
    }
  }, [contextLoading, user, allActions, contextGoals, agentProfile]);


  useEffect(() => {
    if (!contextLoading) {
      setLoading(false);
    }
  }, [contextLoading]);

  const checkGoogleCalendar = async () => {
    // Temporarily disabled: Edge function not yet implemented
    // Default to disconnected state
    setGoogleCalendarConnected(false);
  };
  const todaysTasks = useMemo(() => {
    return (allActions || []).filter((a) => a.actionDate === todayFormatted);
  }, [allActions, todayFormatted]);

  const completedToday = useMemo(() => {
    const timezone = preferences?.timezone || 'America/New_York';
    return (allActions || []).filter((a) => {
      if (a.status !== 'completed' || !a.completionDate) return false;
      const completionDay = new Date(a.completionDate).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone
      });
      return completionDay === todayFormatted;
    });
  }, [allActions, todayFormatted, preferences]);

  const overdueTasks = useMemo(() => {
    return (allActions || []).filter((a) =>
      a.status !== 'completed' &&
      a.actionDate &&
      a.actionDate < todayFormatted
    );
  }, [allActions, todayFormatted]);

  const monthlyGoals = useMemo(() => {
    const specificGoalTitles = [
      "Total Conversations",
      "Total Appointments Set",
      "Total Agreements Signed",
      "Total Under Contract",
      "Total Buyers Closed",
      "Total Listings Closed"];


    const annualGoals = (contextGoals || []).filter((goal) =>
      goal.type === 'annual' && goal.status === 'active' && specificGoalTitles.includes(goal.title)
    );

    // De-duplicate by title, keeping the most recently updated goal
    const uniqueGoalsMap = new Map();
    annualGoals.forEach((goal) => {
      const existing = uniqueGoalsMap.get(goal.title);
      if (!existing || (goal.updated_date && existing.updated_date && new Date(goal.updated_date) > new Date(existing.updated_date))) {
        uniqueGoalsMap.set(goal.title, goal);
      } else if (!existing && !goal.updated_date) {
        uniqueGoalsMap.set(goal.title, goal);
      }
    });
    const uniqueAnnualGoals = Array.from(uniqueGoalsMap.values());

    const selectedMonthIndex = selectedMonth.getMonth() + 1; // 1-12

    return uniqueAnnualGoals.map((goal) => {
      const monthlyTarget = goal.targetValue > 0 ? goal.targetValue / 12 : 0;
      const targetToDate = monthlyTarget * selectedMonthIndex;

      return {
        ...goal,
        displayTarget: targetToDate,
        displayProgress: goal.currentValue
      };
    });
  }, [contextGoals, selectedMonth]);

  const handleToggleTask = useCallback(async (actionId, isCompleted) => {
    const newStatus = isCompleted ? 'completed' : 'not_started';
    try {
      await DailyAction.update(actionId, {
        status: newStatus,
        completionDate: newStatus === 'completed' ? new Date().toISOString() : null
      });
      await refreshUserData();
      toast.success(isCompleted ? "Task completed!" : "Task marked incomplete");
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Could not update task.");
    }
  }, [refreshUserData]);

  const handleCreateManualAction = useCallback(async (formData) => {
    if (!user) {
      const error = new Error('User data not available');
      toast.error('Unable to add task at this time. Please try again.');
      throw error;
    }

    const frequency = formData.frequency || null;
    const dueDate = formData.dueDate || formData.actionDate;

    try {
      await DailyAction.create({
        userId: user.id,
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        actionType: formData.actionType,
        priority: formData.priority,
        actionDate: formData.actionDate,
        dueDate,
        frequency,
        status: 'not_started'
      });

      toast.success('Task added to your action plan');
      await refreshUserData();
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task. Please try again.');
      throw error;
    }
  }, [user, refreshUserData]);

  const handleGenerateActions = async () => {
    if (!user) {
      toast.error("User data not available.");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateDailyTasks(user, preferences);

      if (Array.isArray(result) && result.length > 0) {
        toast.success(`${result.length} new daily action(s) generated!`);
      } else if (result === 'already_exists') {
        toast.info("Today's actions already generated.");
      } else {
        toast.info("No new actions to generate.");
      }
      await refreshUserData();
    } catch (error) {
      console.error("Error generating actions:", error);
      toast.error("Could not generate actions.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCSV = () => {
    const allTasks = [
      ...todaysTasks.map((t) => ({ ...t, list: 'Due Today' })),
      ...completedToday.map((t) => ({ ...t, list: 'Completed' })),
      ...overdueTasks.map((t) => ({ ...t, list: 'Overdue' }))];



    if (allTasks.length === 0) {
      toast.info("No tasks to download.");
      return;
    }

    const headers = ['List', 'Title', 'Description', 'Category', 'Priority', 'Status', 'Date'];
    const csvRows = [headers.join(',')];

    allTasks.forEach((task) => {
      const row = [
        task.list,
        `"${task.title.replace(/"/g, '""')}"`,
        `"${task.description?.replace(/"/g, '""') || ''}"`,
        task.category || '',
        task.priority || '',
        task.status || '',
        task.actionDate || ''];


      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pulse_tasks_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Tasks downloaded successfully.");
  };

  const pulseTasks = useMemo(() => todaysTasks.filter((a) => a.category === 'pulse_based'), [todaysTasks]);
  const powerHourTasks = useMemo(() => todaysTasks.filter((a) => a.category === 'power_hour'), [todaysTasks]);
  const businessBuildingTasks = useMemo(() => todaysTasks.filter((a) => a.category === 'build_business'), [todaysTasks]);
  const initiativesTasks = useMemo(() => todaysTasks.filter((a) => a.category === 'initiative'), [todaysTasks]);
  const goalsPlanningTasks = useMemo(() => todaysTasks.filter((a) => a.category === 'goals_planning'), [todaysTasks]);
  const databaseBuildingTasks = useMemo(() => todaysTasks.filter((a) => a.category === 'build_database'), [todaysTasks]);

  const generateSuggestedSchedule = () => {
    const schedule = [];
    let currentTimeInMinutes = 9 * 60; // Start at 9 AM

    todaysTasks.forEach((task) => {
      const durationMinutes = task.duration || 60; // Default to 60 minutes

      const startHour = Math.floor(currentTimeInMinutes / 60);
      const startMinute = currentTimeInMinutes % 60;

      currentTimeInMinutes += durationMinutes;

      const endHour = Math.floor(currentTimeInMinutes / 60);
      const endMinute = currentTimeInMinutes % 60;

      schedule.push({
        id: task.id,
        title: task.title,
        description: task.description,
        startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
        endTime: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
        startHour: startHour, // Numeric start hour
        duration: durationMinutes / 60, // Duration in hours
        category: task.category
      });
    });

    return schedule;
  };

  // Analytics Data lifted from AnalyticsView component to ToDoPage
  const analyticsData = useMemo(() => {
    if (!allActions || allActions.length === 0 || !pulseData) {
      return {
        kpis: {
          completionRate: { value: 0, delta: 0 },
          consistency: { value: 0 },
          avgCompletionTime: { value: 0 },
          overdueRate: { value: 0 }
        },
        completionTrend: [],
        categoryAllocation: [],
        timeOfDayCompletion: []
      };
    }

    const now = new Date();
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const startOfLastWeek = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }); // Monday
    const endOfLastWeek = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const actionsCreatedThisWeek = allActions.filter((a) => new Date(a.created_date) >= startOfThisWeek);
    const actionsCreatedLastWeek = allActions.filter((a) => {
      const created = new Date(a.created_date);
      return created >= startOfLastWeek && created <= endOfLastWeek;
    });

    // --- KPI Calculations ---
    const completionThisWeek = actionsCreatedThisWeek.filter((a) => a.status === 'completed').length;
    const completionRateThisWeek = actionsCreatedThisWeek.length > 0 ? completionThisWeek / actionsCreatedThisWeek.length * 100 : 0;

    const completionLastWeek = actionsCreatedLastWeek.filter((a) => a.status === 'completed').length;
    const completionRateLastWeek = actionsCreatedLastWeek.length > 0 ? completionLastWeek / actionsCreatedLastWeek.length * 100 : 0;

    const completionRateDelta = completionRateThisWeek - completionRateLastWeek;

    const last7DaysInterval = eachDayOfInterval({ start: subWeeks(now, 1), end: now });
    let streak = 0;
    let currentStreak = 0;
    last7DaysInterval.forEach((day) => {
      const completedOnDay = allActions.some((a) => a.status === 'completed' && a.completionDate && isSameDay(new Date(a.completionDate), day));
      if (completedOnDay) {
        currentStreak++;
      } else {
        streak = Math.max(streak, currentStreak);
        currentStreak = 0;
      }
    });
    streak = Math.max(streak, currentStreak);

    const completedLast7Days = allActions.filter((a) => a.status === 'completed' && a.completionDate && new Date(a.completionDate) >= subWeeks(now, 1));
    const totalCompletionHours = completedLast7Days.reduce((sum, task) => {
      const createdDate = new Date(task.created_date);
      const completionDate = new Date(task.completionDate);
      if (completionDate > createdDate) { // Ensure completion is after creation
        return sum + differenceInHours(completionDate, createdDate);
      }
      return sum;
    }, 0);
    const avgCompletionHours = completedLast7Days.length > 0 ? totalCompletionHours / completedLast7Days.length : 0;

    // Overdue tasks are those that are not completed and whose actionDate is before today
    const overdueTasksCount = allActions.filter((a) =>
      a.status !== 'completed' && a.actionDate && new Date(a.actionDate) < startOfDay(now)
    ).length;
    const totalAssignedTasks = allActions.length;
    const overdueRate = totalAssignedTasks > 0 ? overdueTasksCount / totalAssignedTasks * 100 : 0;

    // --- Chart Data ---
    const completionTrend = last7DaysInterval.map((day) => {
      const assigned = allActions.filter((a) => a.actionDate && isSameDay(new Date(a.actionDate), day));
      const completed = assigned.filter((a) => a.status === 'completed' && a.completionDate && isSameDay(new Date(a.completionDate), day));
      return {
        name: format(day, 'E'),
        completion: assigned.length > 0 ? completed.length / assigned.length * 100 : 0
      };
    });

    const categoryMapping = {
      pulse_based: 'PULSE Tasks',
      power_hour: 'Power Hour Theme',
      build_business: 'Business Building',
      initiative: 'Initiatives',
      goals_planning: 'Goals & Planning',
      build_database: 'Database Building'
    };
    const categoryCounts = completedLast7Days.reduce((acc, task) => {
      let categoryName;
      if (task.actionType === 'lead_generation') {
        categoryName = 'Power Hour Theme';
      } else {
        categoryName = categoryMapping[task.category] || 'Other';
      }
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {});

    const categoryAllocation = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

    const timeOfDayCompletion = completedLast7Days.reduce((acc, task) => {
      const hour = getHours(new Date(task.completionDate));
      if (hour >= 8 && hour < 12) acc.Morning = (acc.Morning || 0) + 1; else
        if (hour >= 12 && hour < 17) acc.Afternoon = (acc.Afternoon || 0) + 1; else
          if (hour >= 17 && hour < 21) acc.Evening = (acc.Evening || 0) + 1; else
            acc.Other = (acc.Other || 0) + 1; // Handle tasks completed outside these main blocks
      return acc;
    }, { Morning: 0, Afternoon: 0, Evening: 0, Other: 0 });


    return {
      kpis: {
        completionRate: { value: completionRateThisWeek, delta: completionRateDelta },
        consistency: { value: streak },
        avgCompletionTime: { value: avgCompletionHours },
        overdueRate: { value: overdueRate }
      },
      completionTrend,
      categoryAllocation,
      timeOfDayCompletion: Object.entries(timeOfDayCompletion).
        filter(([, value]) => value > 0) // Only include categories with values
        .map(([name, value]) => ({ name, value }))
    };
  }, [allActions, pulseData]); // Added preferences as dependency for consistency if 'now' calculation was impacted by timezone


  // Generate AI takeaways for analytics
  useEffect(() => {
    const generateTakeaways = async () => {
      if (activeTab !== 'analytics' || !analyticsData || !user) {
        setAiTakeaways(null); // Clear previous takeaways if tab changes
        return;
      }

      setTakeawaysLoading(true);
      try {
        // Temporarily disabled: Edge function not yet implemented
        // Using default insight instead
        setAiTakeaways('Your activity patterns show steady progress. Focus on maintaining consistency and completing high-priority tasks during your most productive hours.');
      } catch (error) {
        console.error('Error generating AI takeaways:', error);
        setAiTakeaways('Your activity patterns show steady progress. Focus on maintaining consistency and completing high-priority tasks during your most productive hours.');
      } finally {
        setTakeawaysLoading(false);
      }
    };

    // Debounce or add a condition to prevent excessive calls if analyticsData changes rapidly
    const timeoutId = setTimeout(() => {
      generateTakeaways();
    }, 500); // Debounce to prevent multiple calls if dependencies change quickly

    return () => clearTimeout(timeoutId);

  }, [activeTab, analyticsData, user, pulseData]); // pulseData is used for pulseDataForAI


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <LoadingIndicator text="Loading Your Tasks..." size="lg" />
      </div>
    );
  }

  // MAIN CONTENT AREA
  const renderMainContent = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[30px] font-semibold text-[#1E293B] mb-1">Daily Action Plan</h1>
            <p className="text-[#475569] text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded transition-colors"
              title="Add Task">

              <PlusCircle className="w-5 h-5 text-[#475569]" />
            </button>
            <button
              onClick={handleGenerateActions}
              disabled={generating}
              className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded transition-colors"
              title="Generate Tasks">

              {generating ? <InlineLoadingIndicator /> : <RefreshCw className="w-5 h-5 text-[#475569]" />}
            </button>
            <button onClick={() => window.print()} className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded transition-colors" title="Print">
              <Printer className="w-5 h-5 text-[#475569]" />
            </button>
            <button onClick={handleDownloadCSV} className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded transition-colors" title="Download">
              <Download className="w-5 h-5 text-[#475569]" />
            </button>
          </div>
        </div>

        {/* Quadrants */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <TaskQuadrant title="PULSE Tasks" tasks={pulseTasks} onToggle={handleToggleTask} borderColor="border-t-purple-400" />
          <TaskQuadrant title="Power Hour Theme" tasks={powerHourTasks} onToggle={handleToggleTask} borderColor="border-t-teal-400" />
          <TaskQuadrant title="Business Building" tasks={businessBuildingTasks} onToggle={handleToggleTask} borderColor="border-t-orange-400" />
          <TaskQuadrant title="Initiatives" tasks={initiativesTasks} onToggle={handleToggleTask} borderColor="border-t-blue-400" />
          <TaskQuadrant title="Goals & Planning" tasks={goalsPlanningTasks} onToggle={handleToggleTask} borderColor="border-t-pink-400" />
          <TaskQuadrant title="Database Building" tasks={databaseBuildingTasks} onToggle={handleToggleTask} borderColor="border-t-green-400" />
        </div>
      </div>);

  };

  const renderAnalyticsView = () => {
    const StatCard = ({ title, value, delta }) => {
      const isIncrease = delta > 0;
      const isDecrease = delta < 0;
      const DeltaIcon = isIncrease ? ArrowUp : isDecrease ? ArrowDown : null;
      const deltaColor = isIncrease ? 'text-green-500' : isDecrease ? 'text-red-500' : 'text-gray-500';

      return (
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 font-medium">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-slate-800">{value}</p>
            {delta !== undefined && delta !== 0 &&
              <div className={`flex items-center text-xs font-semibold ${deltaColor}`}>
                {DeltaIcon && <DeltaIcon className="w-3 h-3" />}
                <span>{Math.abs(Math.round(delta))}%</span>
              </div>
            }
          </div>
        </div>);
    };

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1'];

    return (
      <div className="space-y-6">
        {/* KPIs Panel */}
        <div>
          <h4 className="text-base font-semibold text-[#1E293B] mb-3">Your Productivity This Week</h4>
          <div className="grid grid-cols-2 gap-3">
            <StatCard title="Task Completion" value={`${Math.round(analyticsData.kpis.completionRate.value)}%`} delta={analyticsData.kpis.completionRate.delta} />
            <StatCard title="Consistency Streak" value={`${analyticsData.kpis.consistency.value} days`} />
            <StatCard title="Avg. Completion Time" value={`${analyticsData.kpis.avgCompletionTime.value.toFixed(1)}h`} />
            <StatCard title="Overdue Rate" value={`${Math.round(analyticsData.kpis.overdueRate.value)}%`} />
          </div>
        </div>

        {/* Behavioral Charts Panel */}
        <div>
          <h4 className="text-base font-semibold text-[#1E293B] mb-3">Your Execution Trends</h4>
          {/* Completion Trend */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-600 mb-2">Daily Completion (Last 7 Days)</p>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={analyticsData.completionTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, padding: '4px 8px' }} formatter={(value) => `${value.toFixed(0)}%`} />
                <Line type="monotone" dataKey="completion" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Category Allocation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Where You Spent Your Time</p>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={analyticsData.categoryAllocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} fill="#8884d8" paddingAngle={5}>
                    {analyticsData.categoryAllocation.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, padding: '4px 8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Time of Day */}
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">When You're Most Effective</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={analyticsData.timeOfDayCompletion} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                  <Tooltip contentStyle={{ fontSize: 12, padding: '4px 8px' }} />
                  <Bar dataKey="value" fill="#82ca9d" barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Takeaways */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img
                src="/images/icons/pulse-ai-icon.png"
                alt="AI Takeaways"
                className="w-5 h-5 object-contain"
              />
              AI Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            {takeawaysLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingIndicator text="Analyzing your patterns..." size="md" />
              </div>
            ) : (
              <ReactMarkdown className="text-sm text-[#475569] leading-relaxed prose prose-sm max-w-none">
                {aiTakeaways || 'Your activity patterns show steady progress. Focus on maintaining consistency and completing high-priority tasks during your most productive hours.'}
              </ReactMarkdown>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };


  // RIGHT SIDEBAR
  const renderSidebarContent = () => {
    if (contextLoading) { // Use contextLoading here to keep consistency with the initial check
      return (
        <div className="flex items-center justify-center p-12">
          <InlineLoadingIndicator />
        </div>);

    }

    switch (activeTab) {
      case 'schedule':
        return <ScheduleView
          allActions={allActions} />; // New ScheduleView takes allActions directly

      case 'tasks':
        return <TasksView
          todaysTasks={todaysTasks}
          completedToday={completedToday}
          overdueTasks={overdueTasks}
          onToggle={handleToggleTask}
          displayedCount={displayedTasksCount}
          onLoadMore={() => setDisplayedTasksCount((prev) => prev + 10)} />;

      case 'scores':
        return <ScoresView pulseScores={pulseData} />;
      case 'analytics':
        return renderAnalyticsView(); // Call the new function here
      case 'goals':
        return <MonthlyGoalsView
          goals={monthlyGoals}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth} />;

      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <ContextualTopNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab} />


      <div className="flex-1 flex overflow-hidden">
        <div className="bg-[#F8FAFC] pt-5 pr-8 pb-8 pl-8 flex-1 overflow-y-auto printable-area">
          {renderMainContent()}
        </div>

        <ContextualSidebar title={getSidebarTitle(activeTab)} className="no-print">
          {renderSidebarContent()}
        </ContextualSidebar>
      </div>

      {showAddModal &&
        <AddActionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreateAction={handleCreateManualAction} />

      }
    </>);

}

function TaskQuadrant({ title, tasks, onToggle, borderColor }) {
  return (
    <Card className={cn("bg-white border border-[#E2E8F0] border-t-[3px] shadow-sm", borderColor)}>
      <CardContent className="pt-4 pr-6 pb-6 pl-6">
        <div className="mb-2 pb-3 border-b border-gray-200">
          <h3 className="text-[#1E293B] text-base font-semibold">{title}</h3>
        </div>
        <div className="pt-1 space-y-4 min-h-[150px]">
          {tasks.length > 0 ? tasks.map((task) =>
            <div key={task.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.status === 'completed'}
                  onCheckedChange={(checked) => onToggle(task.id, checked)} />

                <label
                  htmlFor={`task-${task.id}`}
                  className={`text-sm cursor-pointer truncate ${task.status === 'completed' ? 'line-through text-[#94A3B8]' : 'text-[#1E293B]'}`}>
                  {task.title}
                </label>
              </div>
            </div>
          ) :
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-[#64748B]">No tasks due in this category</p>
            </div>
          }
        </div>
      </CardContent>
    </Card>);
}

function ScheduleView({ allActions }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekStartsOn = 1; // Monday
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  const tasksForSelectedDate = useMemo(() => {
    // Filter for actions that have an actionDate and match the selectedDate
    return allActions.filter((action) => {
      if (!action.actionDate) return false;
      // FIX: The `new Date('YYYY-MM-DD')` constructor treats the date as UTC midnight.
      // This can cause the date to be off by one day in timezones behind UTC.
      // Parsing the string manually ensures it's treated as local time.
      const [year, month, day] = action.actionDate.split('-').map(Number);
      const actionDateObj = new Date(year, month - 1, day);
      return isSameDay(actionDateObj, selectedDate);
    });
  }, [allActions, selectedDate]);

  const scheduledItems = useMemo(() => {
    let currentTotalMinutes = 9 * 60; // Start at 9 AM in minutes from midnight
    const items = [];

    // Sort tasks for consistent display, e.g., by priority, then by title
    const sortedTasks = [...tasksForSelectedDate].sort((a, b) => {
      // Higher priority (lower number) comes first
      if (a.priority && b.priority && a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.title.localeCompare(b.title);
    });

    const startOfDayMinutes = 9 * 60; // 9 AM
    const endOfDayMinutes = 17 * 60; // 5 PM (Exclusive, so no task starts *at* 5 PM)

    sortedTasks.forEach((task) => {
      const taskDurationMinutes = task.duration || 60; // Default to 60 minutes if not specified

      // If current schedule time exceeds the end of the day window, skip
      if (currentTotalMinutes >= endOfDayMinutes) {
        return;
      }

      // Calculate the actual scheduled start and end times
      const scheduledStartMinutes = currentTotalMinutes;
      // Cap the scheduled end time so it doesn't go past endOfDayMinutes
      const scheduledEndMinutes = Math.min(currentTotalMinutes + taskDurationMinutes, endOfDayMinutes);

      // Calculate the duration for display based on the capped end time
      const durationForDisplay = scheduledEndMinutes - scheduledStartMinutes;

      // Only add to schedule if it has a positive duration within the window
      if (durationForDisplay > 0) {
        let categoryForBlock = task.category || 'default';
        if (task.actionType === 'lead_generation') {
          categoryForBlock = 'lead_generation_block'; // Specific key for teal block
        }
        items.push({
          id: task.id,
          title: task.title,
          description: task.description,
          // Store precise start/end minutes from midnight for display and positioning
          scheduledStartMinutesFromMidnight: scheduledStartMinutes,
          scheduledEndMinutesFromMidnight: scheduledEndMinutes,
          durationMinutes: durationForDisplay,
          category: categoryForBlock
        });
      }
      currentTotalMinutes = scheduledEndMinutes; // Next task starts after this one ends
    });
    return items;
  }, [tasksForSelectedDate]);


  // Hours to display on the Y-axis (from 9 AM to 5 PM)
  const hours = eachHourOfInterval({
    start: new Date().setHours(9, 0, 0, 0),
    end: new Date().setHours(17, 0, 0, 0)
  });

  const categoryColors = {
    'pulse_based': 'bg-purple-100 border-purple-400 text-purple-800',
    'power_hour': 'bg-teal-100 border-teal-400 text-teal-800', // Matches Power Hour Theme quadrant color
    'build_business': 'bg-orange-100 border-orange-400 text-orange-800',
    'initiative': 'bg-blue-100 border-blue-400 text-blue-800',
    'goals_planning': 'bg-pink-100 border-pink-400 text-pink-800',
    'build_database': 'bg-green-100 border-green-400 text-green-800', // New category
    'lead_generation_block': 'bg-teal-100 border-teal-400 text-teal-800', // Keep for actionType mapping
    'lofty_sync': 'bg-teal-100 border-teal-400 text-teal-800',
    'follow_up_boss_sync': 'bg-teal-100 border-teal-400 text-teal-800',
    'default': 'bg-gray-100 border-gray-300 text-gray-800'
  };

  const categoryDotColors = {
    'pulse_based': 'bg-purple-400',
    'power_hour': 'bg-teal-400', // Matches Power Hour Theme quadrant color
    'build_business': 'bg-orange-400',
    'initiative': 'bg-blue-400',
    'goals_planning': 'bg-pink-400',
    'build_database': 'bg-green-400', // New category
    'lead_generation_dot': 'bg-teal-400', // Keep for actionType mapping
    'default': 'bg-gray-400'
  };


  const DayButton = ({ day }) => {
    const dayTasks = allActions.filter((a) => a.actionDate && isSameDay(new Date(a.actionDate), day));
    // Get unique categories for the day, default if none specified
    const categories = [...new Set(dayTasks.map((t) => {
      // Special case for Power Hour Theme quadrant which is based on actionType
      if (t.actionType === 'lead_generation') return 'lead_generation_dot';
      return t.category || 'default';
    }))];

    return (
      <button
        onClick={() => setSelectedDate(day)}
        className={cn(
          "flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-12 h-16",
          isSameDay(day, selectedDate) ?
            "bg-purple-100 border border-purple-400" :
            "bg-white hover:bg-gray-50",
          !isSameDay(day, new Date()) && "text-gray-600" // Faint for other days if not today
        )}>

        <span className="text-xs text-gray-500">{format(day, 'E')}</span>
        <span className="font-semibold text-lg text-gray-800">{format(day, 'd')}</span>
        <div className="flex mt-1 space-x-0.5">
          {/* Render up to 4 colored dots for categories */}
          {categories.slice(0, 4).map((cat) =>
            <div key={cat} className={cn("w-1 h-1 rounded-full", categoryDotColors[cat] || categoryDotColors.default)} />
          )}
        </div>
      </button>);

  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">{format(selectedDate, "eeee 'the' do")}</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">{format(selectedDate, "MMMM yyyy")}</p>
        <div className="flex justify-around">
          {weekDays.map((day) => <DayButton key={day.toISOString()} day={day} />)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        {/* Time Axis */}
        <div className="absolute top-0 left-0 right-0 z-0">
          {hours.map((hour, index) =>
            <div key={index} className="flex items-start" style={{ height: '60px' }}> {/* 1 hour = 60px */}
              <div className="w-12 text-right pr-2 text-xs text-gray-400 -mt-2">
                {format(hour, 'ha')}
              </div>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>
          )}
        </div>
        {/* Scheduled Items */}
        <div className="absolute top-0 left-12 right-0 bottom-0 z-10">
          {scheduledItems.map((item) =>
            <div
              key={item.id}
              className={cn(
                "absolute w-[calc(100%-1rem)] ml-2 p-2 rounded-lg border shadow-sm",
                categoryColors[item.category] || categoryColors.default
              )}
              style={{
                top: `${item.scheduledStartMinutesFromMidnight - 9 * 60}px`, // Offset by 9 AM (540 minutes)
                height: `${item.durationMinutes - 4}px` // -4 for border/margin visual separation
              }}>

              <p className="text-xs font-bold truncate">{item.title}</p>
              <p className="text-xs">
                {format(new Date().setHours(Math.floor(item.scheduledStartMinutesFromMidnight / 60), item.scheduledStartMinutesFromMidnight % 60), 'h:mm a')} -
                {format(new Date().setHours(Math.floor(item.scheduledEndMinutesFromMidnight / 60), item.scheduledEndMinutesFromMidnight % 60), 'h:mm a')}
              </p>
              {item.description && <p className="text-xs text-gray-700 truncate">{item.description}</p>}
            </div>
          )}
        </div>
        {scheduledItems.length === 0 &&
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-500">No tasks scheduled for this day.</p>
          </div>
        }
      </div>
    </div>);

}

function TasksView({ todaysTasks, completedToday, overdueTasks, onToggle, displayedCount, onLoadMore }) {
  const [activeTaskTab, setActiveTaskTab] = useState('due_today');
  const [showQuadrants, setShowQuadrants] = useState(true);

  const currentTasks = activeTaskTab === 'due_today' ? todaysTasks :
    activeTaskTab === 'completed' ? completedToday : overdueTasks;

  const displayedTasks = currentTasks.slice(0, displayedCount);
  const hasMore = displayedTasks.length < currentTasks.length;

  // Group tasks by category for quadrant view
  const tasksByQuadrant = useMemo(() => {
    const quadrants = {
      pulse_based: { label: 'PULSE Tasks', tasks: [], color: 'border-purple-400 bg-purple-50' },
      power_hour: { label: 'Power Hour', tasks: [], color: 'border-teal-400 bg-teal-50' },
      build_business: { label: 'Business Building', tasks: [], color: 'border-orange-400 bg-orange-50' },
      initiative: { label: 'Initiatives', tasks: [], color: 'border-blue-400 bg-blue-50' },
      goals_planning: { label: 'Goals & Planning', tasks: [], color: 'border-pink-400 bg-pink-50' },
      build_database: { label: 'Database Building', tasks: [], color: 'border-green-400 bg-green-50' },
    };

    currentTasks.forEach(task => {
      const category = task.category || 'pulse_based';
      if (quadrants[category]) {
        quadrants[category].tasks.push(task);
      }
    });

    return Object.entries(quadrants)
      .filter(([_, data]) => data.tasks.length > 0)
      .map(([key, data]) => ({ key, ...data }));
  }, [currentTasks]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore) {
      onLoadMore();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center gap-4 border-b border-[#E2E8F0] pb-3 mb-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTaskTab('due_today')}
            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTaskTab === 'due_today' ? 'text-[#7C3AED] border-[#7C3AED]' : 'text-[#64748B] border-transparent'}`
            }>

            Due Today ({todaysTasks.length})
          </button>
          <button
            onClick={() => setActiveTaskTab('completed')}
            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTaskTab === 'completed' ? 'text-[#7C3AED] border-[#7C3AED]' : 'text-[#64748B] border-transparent'}`
            }>

            Completed ({completedToday.length})
          </button>
          <button
            onClick={() => setActiveTaskTab('overdue')}
            className={`text-sm font-medium pb-2 border-b-2 transition-colors relative ${activeTaskTab === 'overdue' ? 'text-[#7C3AED] border-[#7C3AED]' : 'text-[#64748B] border-transparent'}`
            }>

            Overdue
            {overdueTasks.length > 0 &&
              <span className="ml-1 bg-[#EF4444] text-white text-xs px-1.5 py-0.5 rounded-full">
                {overdueTasks.length > 99 ? '99+' : overdueTasks.length}
            </span>
          }
        </button>
        </div>
        {activeTaskTab === 'due_today' && currentTasks.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuadrants(!showQuadrants)}
            className="text-[#6D28D9] hover:text-[#5B21B6]"
          >
            {showQuadrants ? 'Hide' : 'Show'} Categories
          </Button>
        )}
      </div>

      {/* Quadrant View */}
      {showQuadrants && activeTaskTab === 'due_today' && tasksByQuadrant.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {tasksByQuadrant.map(({ key, label, tasks, color }) => (
              <div key={key} className={`border-2 rounded-lg p-4 ${color}`}>
                <h4 className="font-semibold text-sm mb-2 text-gray-800">{label}</h4>
                <p className="text-xs text-gray-600 mb-3">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</p>
                <div className="space-y-2">
                  {tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-start gap-2 text-xs">
                      <Checkbox
                        id={`quad-${task.id}`}
                        checked={task.status === 'completed'}
                        onCheckedChange={(checked) => onToggle(task.id, checked)}
                        className="mt-0.5"
                      />
                      <label htmlFor={`quad-${task.id}`} className="flex-1 cursor-pointer">
                        {task.title}
                      </label>
                    </div>
                  ))}
                  {tasks.length > 3 && (
                    <p className="text-xs text-gray-500 italic">+{tasks.length - 3} more</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2" onScroll={handleScroll}>
        {displayedTasks.map((task) =>
          <div key={task.id} className="p-3 bg-white rounded-md shadow-sm border border-[#E2E8F0]">
            <div className="flex items-start gap-3">
              <Checkbox
                id={`sidebar-task-${task.id}`}
                checked={task.status === 'completed'}
                onCheckedChange={(checked) => onToggle(task.id, checked)}
                className="mt-0.5" />

              <div className="flex-1 min-w-0">
                <label
                  htmlFor={`sidebar-task-${task.id}`}
                  className={`text-sm font-medium cursor-pointer block ${task.status === 'completed' ? 'line-through text-[#94A3B8]' : 'text-[#1E293B]'}`}>

                  {task.title}
                </label>
                {task.description &&
                  <p className="text-xs text-[#64748B] mt-1">{task.description}</p>
                }
              </div>
            </div>
          </div>
        )}
        {hasMore &&
          <div className="text-center py-2">
            <button
              onClick={onLoadMore}
              className="text-sm text-[#7C3AED] hover:text-[#6D28D9]">

              Load more...
            </button>
          </div>
        }
        {!hasMore && displayedTasks.length === 0 &&
          <p className="text-sm text-[#64748B] text-center py-4">No {activeTaskTab.replace('_', ' ')} tasks.</p>
        }
      </div>
    </div>);

}

function ScoresView({ pulseScores }) {
  const scores = [
    { letter: 'P', label: 'Planning', value: pulseScores?.planningAdherence || 0, max: 20 },
    { letter: 'U', label: 'Urgency', value: pulseScores?.urgencyManagement || 0, max: 20 },
    { letter: 'L', label: 'Lead Engagement', value: pulseScores?.leadEngagement || 0, max: 20 },
    { letter: 'S', label: 'Systems', value: pulseScores?.systemsUtilization || 0, max: 20 },
    { letter: 'E', label: 'Execution', value: pulseScores?.executionConsistency || 0, max: 20 }];


  return (
    <div className="space-y-6">
      <div className="text-center p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
        <div className="text-slate-950 mb-1 text-xs">Overall PULSE Score</div>
        <div className="text-3xl font-bold text-[#7C3AED]">{pulseScores?.overallPulseScore || 0}</div>
        <Progress value={pulseScores?.overallPulseScore || 0} indicatorClassName="bg-[#7C3AED]" className="h-2 mt-2" />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[#1E293B] mb-4">Score Breakdown</h4>
        {scores.map((score, idx) => {
          const percentage = score.max > 0 ? score.value / score.max * 100 : 0;
          const colorClass = percentage >= 80 ? 'bg-[#22C55E]' : percentage >= 60 ? 'bg-[#EAB308]' : 'bg-[#EF4444]';

          return (
            <div key={idx} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-xs`}>
                    {score.letter}
                  </div>
                  <span className="text-sm font-medium text-[#475569]">{score.label}</span>
                </div>
                <span className="text-sm font-bold text-[#1E293B]">{Math.round(percentage)}%</span>
              </div>
              <Progress value={percentage} indicatorClassName={colorClass} className="h-2" />
            </div>);

        })}
      </div>
    </div>);

}


function MonthlyGoalsView({ goals, selectedMonth, onMonthChange }) {
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(new Date().getFullYear(), i, 1);
    return {
      value: date.toISOString(),
      label: format(date, 'MMMM yyyy')
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-base font-semibold text-[#1E293B] mb-3">Monthly Goals</h4>
        <Select
          value={selectedMonth.toISOString()}
          onValueChange={(value) => onMonthChange(new Date(value))}>

          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) =>
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {goals.length > 0 ? goals.map((goal) => {
          const progressPercentage = goal.displayTarget > 0 ? goal.displayProgress / goal.displayTarget * 100 : 0;
          const isCurrency = goal.targetUnit === 'USD';

          const formatValue = (val) => {
            if (isCurrency) {
              return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
            }
            return Math.round(val);
          };

          return (
            <Card key={goal.id} className="p-4 bg-white border border-[#E2E8F0]">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#475569]">{goal.title}</span>
                  <span className="text-sm font-semibold text-[#1E293B]">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} indicatorClassName="bg-[#7C3AED]" className="h-2" />
                <div className="flex items-center justify-between text-xs text-[#64748B] mt-2">
                  <span>
                    {formatValue(goal.displayProgress)}
                  </span>
                  <span>
                    {formatValue(goal.displayTarget)}
                  </span>
                </div>
              </CardContent>
            </Card>);

        }) :
          <p className="text-sm text-[#64748B] text-center py-4">No monthly tracking goals found.</p>
        }
      </div>
    </div>);

}

function getSidebarTitle(tabId) {
  const titles = {
    schedule: 'My Schedule',
    tasks: 'Tasks',
    scores: 'Scores',
    analytics: 'Analytics',
    goals: 'Goals'
  };
  return titles[tabId] || 'Details';
}
