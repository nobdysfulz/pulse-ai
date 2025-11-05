import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserContext } from './UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useUser, useAuth } from '@clerk/clerk-react';

export default function UserProvider({ children }) {
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
    const { getToken } = useAuth();
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
        if (!isClerkLoaded || !clerkUser) {
            setLoading(false);
            return;
        }

        console.log('[UserProvider] Starting fetchUserData');
        setLoading(true);
        setError(null);
        
        try {
            // Get Clerk session token
            const token = await getToken();
            if (!token) {
                throw new Error('Failed to get authentication token');
            }

            console.log('[UserProvider] Calling getUserContext backend function...');
            
            // Call backend function to get all user data at once
            const { data: context, error: contextError } = await supabase.functions.invoke(
                'getUserContext',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (contextError) {
                console.error('[UserProvider] getUserContext error:', contextError);
                throw new Error('Failed to load user context: ' + (contextError.message || 'Unknown error'));
            }

            if (!context) {
                throw new Error('No context data returned from backend');
            }

            console.log('[UserProvider] Context loaded successfully from backend');

            // Set all state from backend response
            setUser(context.user);
            setOnboarding(context.onboarding || {
                userId: clerkUser.id,
                onboardingCompleted: false,
                agentOnboardingCompleted: false,
                agentIntelligenceCompleted: false,
                completedSteps: []
            });
            setMarketConfig(context.marketConfig);
            setAgentProfile(context.agentProfile);
            setPreferences(context.preferences || {
                userId: clerkUser.id,
                coachingStyle: 'balanced',
                activityMode: 'get_moving',
                dailyReminders: true,
                weeklyReports: true,
                marketUpdates: true,
                emailNotifications: true,
                timezone: 'America/New_York'
            });
            setActions(context.actions || []);
            setAgentConfig(context.agentConfig);
            setUserAgentSubscription(context.userAgentSubscription);
            setGoals(context.goals || []);
            setBusinessPlan(context.businessPlan);
            setPulseHistory(context.pulseHistory || []);
            setPulseConfig(context.pulseConfig);

            console.log('[UserProvider] All context data set successfully');

        } catch (err) {
            console.error("[UserProvider] Critical error in fetchUserData:", err);
            setError("Unable to load your data. Please refresh the page or contact support if the issue persists.");
        } finally {
            setLoading(false);
        }
    }, [clerkUser, isClerkLoaded, getToken]);

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
