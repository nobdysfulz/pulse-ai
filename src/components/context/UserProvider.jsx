
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
                .single();

            if (profileError) {
                console.error('[UserProvider] Error fetching profile:', profileError);
                throw profileError;
            }

            const userData = {
                id: session.user.id,
                email: session.user.email,
                ...profile
            };

            console.log('[UserProvider] User loaded:', userData.email);
            setUser(userData);

            // Fetch additional context from database
            console.log('[UserProvider] Fetching user context...');
            
            // Fetch onboarding status
            const { data: onboardingData } = await supabase
                .from('user_onboarding')
                .select('*')
                .eq('user_id', userData.id)
                .maybeSingle();

            // Create minimal viable context
            const agentContext = {
                user: userData,
                onboarding: onboardingData || {
                    userId: userData.id,
                    onboardingCompleted: false,
                    agentOnboardingCompleted: false,
                    completedSteps: []
                },
                marketConfig: null,
                agentProfile: null,
                preferences: {
                    userId: userData.id,
                    coachingStyle: 'balanced',
                    activityMode: 'get_moving',
                    dailyReminders: true,
                    weeklyReports: true,
                    marketUpdates: true,
                    emailNotifications: true,
                    timezone: 'America/New_York'
                },
                actions: [],
                agentConfig: null,
                userAgentSubscription: null,
                goals: [],
                businessPlan: null,
                pulseHistory: [],
                pulseConfig: null
            };

            console.log('[UserProvider] Context loaded successfully');

            // Set all context data with safety checks
            setOnboarding(agentContext.onboarding || null);
            setMarketConfig(agentContext.marketConfig || null);
            setAgentProfile(agentContext.agentProfile || null);
            setPreferences(agentContext.preferences || {
                userId: userData.id,
                coachingStyle: 'balanced',
                activityMode: 'get_moving',
                dailyReminders: true,
                weeklyReports: true,
                marketUpdates: true,
                emailNotifications: true,
                timezone: 'America/New_York'
            });
            setActions(Array.isArray(agentContext.actions) ? agentContext.actions : []);
            setAgentConfig(agentContext.agentConfig || null);
            setUserAgentSubscription(agentContext.userAgentSubscription || null);
            setGoals(Array.isArray(agentContext.goals) ? agentContext.goals : []);
            setBusinessPlan(agentContext.businessPlan || null);
            setPulseHistory(Array.isArray(agentContext.pulseHistory) ? agentContext.pulseHistory : []);
            setPulseConfig(agentContext.pulseConfig || null);

            console.log('[UserProvider] All context data loaded successfully');

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
