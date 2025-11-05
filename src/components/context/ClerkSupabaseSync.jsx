import { useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';

/**
 * Component that syncs Clerk user data to Supabase
 * This ensures user profiles are created/updated when users sign in
 */
export default function ClerkSupabaseSync() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const syncAttemptsRef = useRef(0);

  // Verify database connection on mount
  useEffect(() => {
    console.log('[ClerkSync] Environment check:');
    console.log('  - Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('  - Expected: https://gzdzmqpkbgvkuulykjml.supabase.co');
    console.log('  - Match:', import.meta.env.VITE_SUPABASE_URL === 'https://gzdzmqpkbgvkuulykjml.supabase.co');
  }, []);

  useEffect(() => {
    // Debounce sync to prevent rapid retries
    const timeoutId = setTimeout(() => {
      const syncUser = async () => {
        if (!isLoaded || !user) return;
        if (syncAttemptsRef.current >= 3) return; // Max 3 retries

        try {
          console.log('[ClerkSync] Syncing user via backend:', user.id);

          // Get Clerk session token
          const token = await getToken();
          if (!token) {
            console.error('[ClerkSync] No token available');
            return;
          }

          // Call backend sync function
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clerkSyncProfile`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Sync failed');
          }

          const result = await response.json();
          console.log('[ClerkSync] ✓ Server sync complete:', result);
          syncAttemptsRef.current = 0; // Reset on success

        } catch (error) {
          console.error('[ClerkSync] Sync error:', error);
          syncAttemptsRef.current += 1;
          
          if (syncAttemptsRef.current >= 3) {
            toast.error('Profile sync failed. Please refresh the page.', {
              description: 'Contact support if this persists.',
              duration: 5000,
            });
          }
        }
      };

      syncUser();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [user, isLoaded, getToken]);

  return null;
}
