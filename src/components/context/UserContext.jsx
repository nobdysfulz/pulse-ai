
import { createContext } from 'react';

/**
 * Context to provide a comprehensive, global state for the logged-in user's profile,
 * including their core data, market configuration, AI profile, and preferences.
 * This serves as a single source of truth across the application.
 */
export const UserContext = createContext({
    user: null,
    marketConfig: null,
    agentProfile: null,
    preferences: null,
    onboarding: null,
    actions: [],
    agentConfig: null,
    userAgentSubscription: null,
    goals: [],
    businessPlan: null,
    pulseHistory: [],
    pulseConfig: null,
    loading: true,
    error: null,
    refreshUserData: () => {},
    isSupportChatOpen: false,
    setSupportChatOpen: () => {},
});
