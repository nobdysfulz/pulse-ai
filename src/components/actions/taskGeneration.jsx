import { supabase } from '@/integrations/supabase/client';
import { DailyAction, TaskTemplate } from '@/api/entities';

/**
 * Helper function to sync CRM tasks into PULSE Daily Actions
 * @param {object} user The user object.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of CRM tasks.
 */
async function syncCrmTasks(user) {
    // TODO: Implement CRM task sync
    return [];
}

export const generateTasksForToday = async (user, profile, marketConfig, businessPlan) => {
    if (!user || !user.id) {
        console.error("[taskGeneration] Called without a valid user object.");
        throw new Error("Invalid user data - cannot generate tasks");
    }

    try {
        // Assuming timezone and activityMode are now part of the profile object
        const userTimezone = profile?.timezone || 'America/New_York';
        const activityMode = profile?.activityMode || 'get_moving';

        const todayDate = new Date().toLocaleDateString('en-CA', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            timeZone: userTimezone 
        });

        console.log(`[taskGeneration] Generating tasks for ${todayDate}, user: ${user.id}`);

        // Check for existing tasks
        const existingTasks = await DailyAction.filter({
            userId: user.id,
            actionDate: todayDate,
            generated: true
        });

        if (existingTasks && existingTasks.length > 0) {
            console.log(`[taskGeneration] Tasks already exist for ${todayDate}`);
            return 'already_exists';
        }

        // Fetch all active templates
        const allTemplates = await TaskTemplate.filter({ isActive: true });
        
        if (!allTemplates || allTemplates.length === 0) {
            console.warn("[taskGeneration] No active task templates found");
            return 'no_templates';
        }

        console.log(`[taskGeneration] Found ${allTemplates.length} active templates`);

        const userCreationDate = new Date(user.created_date);
        if (isNaN(userCreationDate.getTime())) {
            console.error("[taskGeneration] Invalid user creation date:", user.created_date);
            throw new Error("Invalid user creation date");
        }

        const accountAgeInDays = Math.floor((new Date().getTime() - userCreationDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const dayOfWeek = new Date().getDay(); // 0=Sunday
        const dayOfMonth = new Date().getDate();
        const month = new Date().getMonth();

        // Get current Pulse Score (default to 50 if unavailable)
        let currentPulseScore = 50;
        // TODO: Implement pulse score fetching

        let tasksToGenerate = [];

        const parseScoreRange = (triggerValue) => {
            if (!triggerValue || typeof triggerValue !== 'string') {
                console.warn('[taskGeneration] Invalid triggerValue:', triggerValue);
                return null;
            }

            if (!triggerValue.includes('-')) {
                console.warn('[taskGeneration] triggerValue missing hyphen:', triggerValue);
                return null;
            }

            const parts = triggerValue.split('-').map(Number);
            
            if (parts.length !== 2 || parts.some(isNaN)) {
                console.warn('[taskGeneration] Failed to parse triggerValue:', triggerValue);
                return null;
            }

            return parts;
        };

        // --- PULSE SCORE RANGE TASKS (Max 5, Sorted by Priority Weight) ---
        const pulseRangeTemplates = allTemplates.filter(template => template.triggerType === 'pulse_score_range');
        const eligiblePulseTasksForSorting = [];

        for (const template of pulseRangeTemplates) {
            const range = parseScoreRange(template.triggerValue);
            
            if (!range) {
                console.warn(`[taskGeneration] Skipping template ${template.id} - invalid triggerValue`);
                continue;
            }

            const [minScore, maxScore] = range;
            
            if (currentPulseScore >= minScore && currentPulseScore <= maxScore) {
                eligiblePulseTasksForSorting.push(template);
            }
        }

        // Sort by priorityWeight DESC and take top 5
        const topPulseTasks = eligiblePulseTasksForSorting
            .sort((a, b) => (b.priorityWeight || 3) - (a.priorityWeight || 3))
            .slice(0, 5);

        console.log(`[taskGeneration] Selected ${topPulseTasks.length} PULSE-based tasks`);

        topPulseTasks.forEach(template => {
            tasksToGenerate.push({
                userId: user.id,
                actionDate: todayDate,
                actionType: template.actionType,
                title: template.title,
                description: template.description,
                priority: template.priority,
                status: 'not_started',
                isRecurring: false,
                generated: true,
                category: template.category,
                pulseImpact: template.pulseImpact,
                displayCategory: template.displayCategory,
                priorityWeight: template.priorityWeight || 3,
                impactArea: template.impactArea
            });
        });

        // --- DAY OF WEEK TASKS ---
        const dayOfWeekTasks = allTemplates.filter(template => {
            if (template.triggerType !== 'day_of_week') return false;
            
            const templateDay = parseInt(template.triggerValue);
            const templateDayAsJs = templateDay === 1 ? 0 : templateDay - 1;
            return templateDayAsJs === dayOfWeek;
        });

        console.log(`[taskGeneration] Selected ${dayOfWeekTasks.length} day-of-week tasks`);

        dayOfWeekTasks.forEach(template => {
            tasksToGenerate.push({
                userId: user.id,
                actionDate: todayDate,
                actionType: template.actionType,
                title: template.title,
                description: template.description,
                priority: template.priority,
                status: 'not_started',
                isRecurring: false,
                generated: true,
                category: template.category,
                pulseImpact: template.pulseImpact,
                displayCategory: template.displayCategory,
                priorityWeight: template.priorityWeight || 3,
                impactArea: template.impactArea
            });
        });

        // --- ACCOUNT DAY EXACT TASKS ---
        const accountDayTasks = allTemplates.filter(template => {
            if (template.triggerType !== 'account_day_exact') return false;
            return parseInt(template.triggerValue) === accountAgeInDays;
        });

        console.log(`[taskGeneration] Selected ${accountDayTasks.length} account-day tasks (day ${accountAgeInDays})`);

        accountDayTasks.forEach(template => {
            tasksToGenerate.push({
                userId: user.id,
                actionDate: todayDate,
                actionType: template.actionType,
                title: template.title,
                description: template.description,
                priority: template.priority,
                status: 'not_started',
                isRecurring: false,
                generated: true,
                category: template.category,
                pulseImpact: template.pulseImpact,
                displayCategory: template.displayCategory,
                priorityWeight: template.priorityWeight || 3,
                impactArea: template.impactArea
            });
        });

        // --- INITIATIVE TASKS ---
        const initiativeTasks = allTemplates.filter(template => {
            if (template.triggerType !== 'initiative') return false;
            
            if (template.subCategory === 'monthly' && dayOfMonth === 1) return true;
            if (template.subCategory === 'quarterly' && dayOfMonth === 1 && [0, 3, 6, 9].includes(month)) return true;
            if (template.subCategory === 'semi-annually' && dayOfMonth === 1 && [0, 6].includes(month)) return true;
            if (template.subCategory === 'annually' && dayOfMonth === 1 && month === 0) return true;
            
            return false;
        });

        console.log(`[taskGeneration] Selected ${initiativeTasks.length} initiative tasks`);

        initiativeTasks.forEach(template => {
            tasksToGenerate.push({
                userId: user.id,
                actionDate: todayDate,
                actionType: template.actionType,
                title: template.title,
                description: template.description,
                priority: template.priority,
                status: 'not_started',
                isRecurring: false,
                generated: true,
                category: template.category,
                pulseImpact: template.pulseImpact,
                displayCategory: template.displayCategory,
                priorityWeight: template.priorityWeight || 3,
                impactArea: template.impactArea
            });
        });

        // --- CRM TASK SYNC ---
        try {
            const crmTasks = await syncCrmTasks(user);
            if (crmTasks.length > 0) {
                console.log(`[taskGeneration] Adding ${crmTasks.length} CRM tasks`);
                for (const crmTask of crmTasks) {
                    tasksToGenerate.push({
                        userId: user.id,
                        actionDate: todayDate,
                        actionType: 'client_follow_up',
                        category: `${crmTask.crmType}_sync`,
                        title: crmTask.title,
                        description: crmTask.description,
                        priority: crmTask.priority || 'medium',
                        status: 'not_started',
                        isRecurring: false,
                        generated: true,
                        pulseImpact: 0.1,
                        displayCategory: 'Power Hour Theme',
                        priorityWeight: 4,
                        impactArea: 'Urgency',
                        metadata: JSON.stringify({
                            source: crmTask.crmType,
                            crmTaskId: crmTask.crmTaskId,
                            dueDate: crmTask.dueDate,
                        })
                    });
                }
            }
        } catch (crmError) {
            console.error("[taskGeneration] CRM task sync failed:", crmError);
        }

        // --- ENFORCE TASK CAP (15-20 max per day) ---
        tasksToGenerate.sort((a, b) => (b.priorityWeight || 3) - (a.priorityWeight || 3));
        tasksToGenerate = tasksToGenerate.slice(0, 20);

        console.log(`[taskGeneration] Final task count: ${tasksToGenerate.length}`);

        if (tasksToGenerate.length === 0) {
            console.log("[taskGeneration] No tasks to generate");
            return 'no_templates';
        }

        // Create all tasks
        const createdTasks = await DailyAction.bulkCreate(tasksToGenerate);
        console.log(`[taskGeneration] ✅ Successfully created ${createdTasks.length} daily actions`);
        return createdTasks;

    } catch (error) {
        console.error("[taskGeneration] ❌ Error generating tasks:", error);
        throw error;
    }
};

// Wrapper function for easy calling from UI
export const generateDailyTasks = async (user, preferences) => {
    console.log('[taskGeneration] Wrapper called with:', { userId: user?.id, preferencesAvailable: !!preferences });
    
    if (!user || !user.id) {
        throw new Error("User data is required to generate tasks");
    }

    if (!preferences) {
        throw new Error("User preferences are required to generate tasks");
    }

    // These are not strictly required, but helpful
    const marketConfig = null;
    const businessPlan = null;

    return await generateTasksForToday(user, preferences, marketConfig, businessPlan);
};