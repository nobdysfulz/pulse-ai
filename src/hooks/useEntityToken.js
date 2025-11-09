import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to get Supabase JWT token for entity operations
 * Provides a consistent way to retrieve tokens across the app
 */
export const useEntityToken = () => {
  const [session, setSession] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoaded(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getEntityToken = useCallback(async () => {
    if (!isLoaded) {
      throw new Error('Auth not loaded yet');
    }

    if (!session) {
      throw new Error('User not signed in');
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        throw new Error('Failed to retrieve authentication token');
      }
      
      return currentSession.access_token;
    } catch (error) {
      console.error('[useEntityToken] Error getting token:', error);
      throw new Error('Authentication failed. Please log in again.');
    }
  }, [session, isLoaded]);

  return {
    getEntityToken,
    isReady: isLoaded && !!session,
  };
};
