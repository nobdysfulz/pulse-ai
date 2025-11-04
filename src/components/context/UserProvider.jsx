
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserContext } from './UserContext';
import { differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export default function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [marketConfig, setMarketConfig] = useState(null);
    const [agentProfile, setAgentProfile] = useState(null);
    const [preferences, setPreferences] = useState(null);
    const [onboarding, setOnboarding] = useState(null);
    const [actions, setActions] = useState([]);
    const [agentConfig, setAgentConfig] = useState(null);
    const [userAgentSubscription, setUserAgentSubscription] = useState(null);
    const [goals, setGoals] = useState([]);
    const [businessPlan, setBusinessPlan] = useState(null);
    const [pulseHistory, setPulseHistory] = useState([]);
    const [pulseConfig, setPulseConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSupportChatOpen, setSupportChatOpen] = useState(false);

    const fetchUserData = useCallback(async () => {
        console.log('[UserProvider] Starting fetchUserData');
        setLoading(true);
        setError(null);
        
        try {
            // Get authenticated user from Supabase
            console.log('[UserProvider] Fetching authenticated user...');
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                console.log("[UserProvider] No active session");
                setLoading(false);
                return;
            }

            // Get user profile from profiles table
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (profileError) {
                console.error('[UserProvider] Error fetching profile:', profileError);
                throw profileError;
            }

            // Fetch roles from protected user_roles table (RLS allows users to read only their own)
            const { data: userRoles, error: rolesError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id);
            if (rolesError) {
                console.warn('[UserProvider] Failed to load user roles:', rolesError.message);
            }
            const roles = Array.isArray(userRoles) ? userRoles.map(r => r.role) : [];
            const isAdmin = roles.includes('admin');

            const userData = {
                id: session.user.id,
                email: session.user.email,
                role: isAdmin ? 'admin' : 'user', // Backward compatibility for existing UI checks
                roles,
                isAdmin,
                ...profile,
            };

            console.log('[UserProvider] User loaded:', userData.email);
            setUser(userData);

            // Fetch all user context data in parallel
            console.log('[UserProvider] Fetching user context in parallel...');
            
            const [
                onboardingResult,
                marketConfigResult,
                preferencesResult,
                actionsResult,
                agentConfigResult,
                goalsResult,
                businessPlanResult,
                pulseHistoryResult,
                pulseConfigResult
            ] = await Promise.all([
                supabase.from('user_onboarding').select('*').eq('user_id', userData.id).maybeSingle(),
                supabase.from('market_config').select('*').eq('user_id', userData.id).maybeSingle(),
                supabase.from('user_preferences').select('*').eq('user_id', userData.id).maybeSingle(),
                supabase.from('daily_actions').select('*').eq('user_id', userData.id).order('due_date', { ascending: true }),
                supabase.from('agent_config').select('*').eq('user_id', userData.id).maybeSingle(),
                supabase.from('goals').select('*').eq('user_id', userData.id).order('created_at', { ascending: false }),
                supabase.from('business_plans').select('*').eq('user_id', userData.id).maybeSingle(),
                supabase.from('pulse_scores').select('*').eq('user_id', userData.id).order('date', { ascending: false }).limit(30),
                supabase.from('pulse_scores').select('*').eq('user_id', userData.id).order('date', { ascending: false }).limit(1)
            ]);

            // Log any fetch errors but continue with available data
            if (onboardingResult.error) console.warn('[UserProvider] Onboarding fetch error:', onboardingResult.error);
            if (marketConfigResult.error) console.warn('[UserProvider] Market config fetch error:', marketConfigResult.error);
            if (preferencesResult.error) console.warn('[UserProvider] Preferences fetch error:', preferencesResult.error);
            if (actionsResult.error) console.warn('[UserProvider] Actions fetch error:', actionsResult.error);
            if (agentConfigResult.error) console.warn('[UserProvider] Agent config fetch error:', agentConfigResult.error);
            if (goalsResult.error) console.warn('[UserProvider] Goals fetch error:', goalsResult.error);
            if (businessPlanResult.error) console.warn('[UserProvider] Business plan fetch error:', businessPlanResult.error);
            if (pulseHistoryResult.error) console.warn('[UserProvider] Pulse history fetch error:', pulseHistoryResult.error);
            if (pulseConfigResult.error) console.warn('[UserProvider] Pulse config fetch error:', pulseConfigResult.error);

            // Build context with fetched data
            const agentContext = {
                user: userData,
                onboarding: onboardingResult.data || {
                    userId: userData.id,
                    onboardingCompleted: false,
                    agentOnboardingCompleted: false,
                    agentIntelligenceCompleted: false,
                    completedSteps: []
                },
                marketConfig: marketConfigResult.data || null,
                agentProfile: null, // This is not a table, keeping as null
                preferences: preferencesResult.data || {
                    userId: userData.id,
                    coachingStyle: 'balanced',
                    activityMode: 'get_moving',
                    dailyReminders: true,
                    weeklyReports: true,
                    marketUpdates: true,
                    emailNotifications: true,
                    timezone: 'America/New_York'
                },
                actions: actionsResult.data || [],
                agentConfig: agentConfigResult.data || null,
                userAgentSubscription: null, // This is not a table, keeping as null
                goals: goalsResult.data || [],
                businessPlan: businessPlanResult.data || null,
                pulseHistory: pulseHistoryResult.data || [],
                pulseConfig: pulseConfigResult.data?.[0] || null
            };

            console.log('[UserProvider] Context loaded successfully:', {
                hasMarketConfig: !!agentContext.marketConfig,
                hasPreferences: !!agentContext.preferences,
                actionsCount: agentContext.actions.length,
                goalsCount: agentContext.goals.length,
                hasBusinessPlan: !!agentContext.businessPlan,
                pulseHistoryCount: agentContext.pulseHistory.length
            });

            // Set all context data
            setOnboarding(agentContext.onboarding);
            setMarketConfig(agentContext.marketConfig);
            setAgentProfile(agentContext.agentProfile);
            setPreferences(agentContext.preferences);
            setActions(agentContext.actions);
            setAgentConfig(agentContext.agentConfig);
            setUserAgentSubscription(agentContext.userAgentSubscription);
            setGoals(agentContext.goals);
            setBusinessPlan(agentContext.businessPlan);
            setPulseHistory(agentContext.pulseHistory);
            setPulseConfig(agentContext.pulseConfig);

            console.log('[UserProvider] All context data set successfully');

        } catch (err) {
            console.error("[UserProvider] Critical error in fetchUserData:", err);
            setError("Unable to load your data. Please refresh the page or contact support if the issue persists.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const contextValue = useMemo(() => ({
        user,
        marketConfig,
        agentProfile,
        preferences,
        onboarding,
        actions,
        agentConfig,
        userAgentSubscription,
        goals,
        businessPlan,
        pulseHistory,
        pulseConfig,
        loading,
        error,
        refreshUserData: fetchUserData,
        isSupportChatOpen,
        setSupportChatOpen
    }), [
        user, marketConfig, agentProfile, preferences, onboarding, actions,
        agentConfig, userAgentSubscription, goals, businessPlan, pulseHistory,
        pulseConfig, loading, error, fetchUserData, isSupportChatOpen, setSupportChatOpen
    ]);

    if (error && !loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-[#1E293B] mb-2">Connection Error</h2>
                    <p className="text-sm text-[#64748B] mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Refresh Page
                        </button>
                        <button
                            onClick={() => window.open('mailto:support@pwru.app', '_blank')}
                            className="w-full border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
}
