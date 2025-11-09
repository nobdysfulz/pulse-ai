import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserContext } from './UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Mail } from 'lucide-react';
import { normalizeOnboardingProgress } from '../onboarding/onboardingLogic';

// Set global token getter for entities.js
if (typeof window !== 'undefined') {
  window.__getSupabaseToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');
    return session.access_token;
  };
}

export default function UserProvider({ children }) {
    const [session, setSession] = useState(null);
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
        if (!session) {
            setLoading(false);
            return;
        }

        console.log('[UserProvider] Starting fetchUserData');
        setLoading(true);
        setError(null);
        
        try {
            const token = session.access_token;
            
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
                
                // Check if it's an authentication error
                if (contextError.message?.includes('401') || contextError.message?.includes('Token') || contextError.message?.includes('expired')) {
                    // Try to refresh the session and retry once
                    console.log('[UserProvider] Attempting to refresh session...');
                    try {
                        const { data: { session: newSession } } = await supabase.auth.refreshSession();
                        
                        if (newSession) {
                            console.log('[UserProvider] Retrying with fresh session...');
                            const { data: retryContext, error: retryError } = await supabase.functions.invoke(
                                'getUserContext',
                                {
                                    headers: {
                                        Authorization: `Bearer ${newSession.access_token}`,
                                    },
                                }
                            );
                            
                            if (!retryError && retryContext) {
                                console.log('[UserProvider] Successfully fetched user data on retry');
                                populateUserData(retryContext);
                                setLoading(false);
                                return;
                            }
                        }
                    } catch (refreshError) {
                        console.error('[UserProvider] Failed to refresh session:', refreshError);
                    }
                }
                
                throw contextError;
            }

            if (context) {
                console.log('[UserProvider] Successfully fetched user data');
                populateUserData(context);
            } else {
                console.warn('[UserProvider] No context data returned');
            }

        } catch (err) {
            console.error('[UserProvider] Error in fetchUserData:', err);
            setError(err.message || 'Failed to load user data');
        } finally {
            setLoading(false);
        }
    }, [session]);

    // Normalize user profile from snake_case to camelCase
    const normalizeUser = (profileRow, currentSession) => {
        if (!profileRow) return null;
        
        const id = currentSession?.user?.id || profileRow?.id || null;
        const email = currentSession?.user?.email || profileRow?.email || '';
        const fullName = profileRow?.full_name || '';
        
        // Derive firstName/lastName from full_name
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
            id,
            email,
            fullName,
            firstName,
            lastName,
            phone: profileRow?.phone || '',
            avatar: profileRow?.avatar_url || '',
            licenseNumber: profileRow?.license_number || '',
            licenseState: profileRow?.license_state || '',
            brokerage: profileRow?.brokerage || '',
            isAdmin: profileRow?.isAdmin || false,
            roles: profileRow?.roles || [],
            role: (profileRow?.isAdmin || profileRow?.role === 'admin') ? 'admin' : 'user',
            createdAt: profileRow?.created_at,
            updatedAt: profileRow?.updated_at,
        };
    };

    // Normalize actions from snake_case to camelCase
    const normalizeActions = (rows) => {
        if (!Array.isArray(rows)) return [];
        
        return rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            category: row.category,
            priority: row.priority,
            status: row.status,
            frequency: row.frequency,
            dueDate: row.due_date,
            actionType: row.action_type,
            completedAt: row.completed_at,
            scheduledTime: row.scheduled_time,
            duration: row.duration_minutes ?? 60,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            generated: row.generated,
        }));
    };

    // Normalize goals from snake_case to camelCase
    const normalizeGoals = (rows) => {
        if (!Array.isArray(rows)) return [];
        
        return rows.map(row => ({
            id: row.id,
            title: row.title,
            goalType: row.goal_type,
            unit: row.unit,
            timeframe: row.timeframe,
            type: row.timeframe, // compatibility alias used in UI
            targetValue: row.target_value,
            currentValue: row.current_value,
            status: row.status,
            deadline: row.deadline,
            confidenceScore: row.confidence_score,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    };

    // Normalize agent profile from snake_case to camelCase
    const normalizeAgentProfile = (profile) => {
        if (!profile) return null;
        
        return {
            id: profile.id,
            userId: profile.user_id,
            experienceLevel: profile.experience_level,
            workCommitment: profile.work_commitment,
            businessStructure: profile.business_structure,
            databaseSize: profile.database_size,
            sphereWarmth: profile.sphere_warmth,
            previousYearTransactions: profile.previous_year_transactions,
            previousYearVolume: profile.previous_year_volume,
            averagePricePoint: profile.average_price_point,
            businessConsistency: profile.business_consistency,
            biggestChallenges: profile.biggest_challenges,
            growthTimeline: profile.growth_timeline,
            learningPreference: profile.learning_preference,
            surveyCompletedAt: profile.survey_completed_at,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
        };
    };

    const populateUserData = (context) => {
        // Use correct keys from getUserContext and normalize data
        setUser(normalizeUser(context.user, session));
        setMarketConfig(context.marketConfig || null);
        setAgentProfile(normalizeAgentProfile(context.agentProfile));
        setPreferences(context.preferences || null);
        setOnboarding(normalizeOnboardingProgress(context.onboarding));
        setActions(normalizeActions(context.actions));
        setAgentConfig(context.agentConfig || null);
        setUserAgentSubscription(context.userAgentSubscription || null);
        setGoals(normalizeGoals(context.goals));
        setBusinessPlan(context.businessPlan || null);
        setPulseHistory(context.pulseHistory || []);
        setPulseConfig(context.pulseConfig || null);
    };

    // Set up auth state listener
    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch user data when session changes
    useEffect(() => {
        if (session) {
            fetchUserData();
        } else {
            setLoading(false);
        }
    }, [session, fetchUserData]);

    const contextValue = useMemo(
        () => ({
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
            setSupportChatOpen,
        }),
        [
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
            fetchUserData,
            isSupportChatOpen,
        ]
    );

    // Error UI with retry button
    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4 text-red-600">
                        Failed to Load User Data
                    </h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="space-y-3">
                        <Button onClick={fetchUserData} className="w-full">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => window.location.href = 'mailto:support@pulse.pwru.app'}
                            className="w-full"
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            Contact Support
                        </Button>
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
