import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

/**
 * Custom hook to get Clerk JWT token for entity operations
 * Provides a consistent way to retrieve tokens across the app
 */
export const useEntityToken = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const getEntityToken = useCallback(async () => {
    if (!isLoaded) {
      throw new Error('Auth not loaded yet');
    }

    if (!isSignedIn) {
      throw new Error('User not signed in');
    }

    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Failed to retrieve authentication token');
      }
      
      return token;
    } catch (error) {
      console.error('[useEntityToken] Error getting token:', error);
      throw new Error('Authentication failed. Please log in again.');
    }
  }, [getToken, isLoaded, isSignedIn]);

  return {
    getEntityToken,
    isReady: isLoaded && isSignedIn,
  };
};
