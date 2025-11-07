/**
 * Calculates the detailed PULSE score based on various business metrics.
 * This is the SINGLE SOURCE OF TRUTH for PULSE score calculation.
 * Used by both Dashboard and ToDo pages.
 */
export const calculatePulseScore = (goals, actions, agentProfile, contactCount = 0) => {
    const hasActions = Array.isArray(actions) && actions.length > 0;
    const hasGoals = Array.isArray(goals) && goals.length > 0;
    const hasAgentProfile = agentProfile && agentProfile.experienceLevel;
    
    const hasSufficientData = hasActions || hasGoals || hasAgentProfile;

    if (!hasSufficientData) {
        return {
            planningAdherence: 0,
            urgencyManagement: 0,
            leadEngagement: 0,
            systemsUtilization: 0,
            executionConsistency: 0,
            overallPulseScore: 0,
            hasInsufficientData: true,
            diagnostics: {
                strengths: [],
                weaknesses: ["Not enough data to generate a PULSE score. Start by setting goals or adding actions."],
                opportunities: [],
                threats: []
            },
            contactCount: 0
        };
    }
    
    const activeGoals = goals.filter(g => g.status === 'active');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfLast30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfLast7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const actionsLast30Days = actions.filter(a => a.dueDate && new Date(a.dueDate) >= startOfLast30Days);
    const completedActionsLast30Days = actionsLast30Days.filter(a => a.status === 'completed');
    const actionsLast7Days = actions.filter(a => a.dueDate && new Date(a.dueDate) >= startOfLast7Days);
    const completedActionsLast7Days = actionsLast7Days.filter(a => a.status === 'completed');

    // 1. Planning Score (0-20 points)
    const calculatePlanningScore = () => {
        let score = 0;
        if (activeGoals.length > 2) score += 10;
        
        const recentGoals = goals.filter(g => g.updated_date && new Date(g.updated_date) > startOfLast30Days).length;
        score += Math.min(10, (recentGoals / Math.max(activeGoals.length, 1)) * 10);
        
        return score;
    };

    // 2. Urgency Score (0-20 points)
    const calculateUrgencyScore = () => {
        const overdueActions = actions.filter(a => a.dueDate && new Date(a.dueDate) < today && a.status !== 'completed' && a.status !== 'archived');
        const overduePenalty = Math.min(10, overdueActions.length * 1);
        let score = 10 - overduePenalty;

        const highPriorityActions = completedActionsLast30Days.filter(a => a.priority === 'high');
        const totalCompleted = completedActionsLast30Days.length;
        
        const dailyCompletionRate = actionsLast7Days.length > 0 ? completedActionsLast7Days.length / actionsLast7Days.length : 0;
        score += dailyCompletionRate * 5;
        
        if (totalCompleted > 0) {
            const priorityExecutionRatio = highPriorityActions.length / totalCompleted;
            score += priorityExecutionRatio * 5;
        }
        
        return Math.max(0, Math.min(20, score));
    };
    
    // 3. Lead Engagement Score (0-20 points) - DYNAMIC BASED ON CONTACT COUNT
    const calculateLeadEngagementScore = () => {
        if (contactCount === 0) return 0;
        if (contactCount <= 50) return 2;
        if (contactCount <= 150) return 5;
        if (contactCount <= 300) return 10;
        if (contactCount <= 500) return 15;
        if (contactCount <= 1000) return 18;
        return 20;
    };

    // 4. Systems Score (0-20 points)
    const calculateSystemsScore = () => {
        let score = 0;
        if (goals.length > 3) score += 4;

        const actionDates = new Set(actionsLast30Days.map(a => new Date(a.dueDate).toDateString()));
        if (actionDates.size > 10) score += 6;
        
        const generatedTasks = actions.filter(a => a.generated === true);
        if (generatedTasks.length > 5) score += 5;
        
        if (activeGoals.length > 0) score += 3;
        if (actionsLast7Days.length > 0) score += 2;
        
        return Math.min(20, score);
    };

    // 5. Execution Score (0-20 points)
    const calculateExecutionScore = () => {
        let score = 0;
        
        if (actionsLast30Days.length > 0) {
            const executionRate = completedActionsLast30Days.length / actionsLast30Days.length;
            score += executionRate * 8;
        } else {
            score += 4;
        }
        
        if (activeGoals.length > 0) {
            const avgProgress = activeGoals.reduce((sum, goal) => sum + (goal.progressPercentage || 0), 0) / activeGoals.length;
            score += (avgProgress / 100) * 6;
        } else {
            score += 3;
        }
        
        const recentCompletionRate = actionsLast7Days.length > 0 ? completedActionsLast7Days.length / actionsLast7Days.length : 0;
        score += recentCompletionRate * 6;
        
        return Math.min(20, score);
    };

    const planningScore = calculatePlanningScore();
    const urgencyScore = calculateUrgencyScore();
    const leadsScore = calculateLeadEngagementScore();
    const systemsScore = calculateSystemsScore();
    const executionScore = calculateExecutionScore();

    const overallPulseScore = planningScore + urgencyScore + leadsScore + systemsScore + executionScore;

    // --- Diagnostic Analysis ---
    const diagnostics = {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: []
    };

    // Planning Diagnostics
    if (planningScore > 15) diagnostics.strengths.push("Excellent goal planning foundation.");
    if (activeGoals.length < 3) diagnostics.weaknesses.push("Set at least 3 active goals to provide clear targets.");

    // Urgency Diagnostics
    const overdueCount = actions.filter(a => a.dueDate && new Date(a.dueDate) < today && a.status !== 'completed' && a.status !== 'archived').length;
    if (overdueCount > 5) diagnostics.weaknesses.push(`High number of overdue tasks (${overdueCount}). Focus on clearing your backlog.`);
    if (urgencyScore < 10) diagnostics.threats.push("Lack of urgency in task completion may be slowing progress.");

    // Execution Diagnostics
    const completionRate7Days = actionsLast7Days.length > 0 ? (completedActionsLast7Days.length / actionsLast7Days.length) : 0;
    if (completionRate7Days > 0.8) diagnostics.strengths.push("High task completion rate in the last 7 days.");
    if (completionRate7Days < 0.4) diagnostics.weaknesses.push("Low task completion rate. Focus on completing daily generated actions.");
    
    // Systems Diagnostics
    if (systemsScore < 10) diagnostics.weaknesses.push("Increase engagement with PULSE features like task generation and goal tracking.");

    // Leads Diagnostics
    if (contactCount < 100) {
        diagnostics.weaknesses.push(`Your database has ${contactCount} contacts. Focus on growing your network to at least 150+ contacts.`);
        diagnostics.opportunities.push("Building your database is the fastest way to improve your Lead Engagement score.");
    } else if (contactCount >= 500) {
        diagnostics.strengths.push(`Strong database with ${contactCount} contacts! This gives you a solid foundation for consistent business.`);
    }

    if (leadsScore < 10) {
        diagnostics.opportunities.push("Growing your contact database will significantly boost your PULSE score.");
    }

    return {
        planningAdherence: Math.round(planningScore),
        urgencyManagement: Math.round(urgencyScore),
        leadEngagement: Math.round(leadsScore),
        systemsUtilization: Math.round(systemsScore),
        executionConsistency: Math.round(executionScore),
        overallPulseScore: Math.round(overallPulseScore),
        hasInsufficientData: false,
        diagnostics,
        completionRate7Days: actionsLast7Days.length > 0 ? Math.round((completedActionsLast7Days.length / actionsLast7Days.length) * 100) : 0,
        completionRate30Days: actionsLast30Days.length > 0 ? Math.round((completedActionsLast30Days.length / actionsLast30Days.length) * 100) : 0,
        contactCount: contactCount
    };
};