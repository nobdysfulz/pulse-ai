import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Component that syncs Clerk user data to Supabase
 * This ensures user profiles are created/updated when users sign in
 */
export default function ClerkSupabaseSync() {
  const { user, isLoaded } = useUser();
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
          console.log('[ClerkSync] Syncing user:', user.id);

          // 1. Check if profile exists
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (fetchError) {
            // Database schema mismatch (wrong database)
            if (fetchError.code === '22P02' || fetchError.message?.includes('invalid input')) {
              console.error('[ClerkSync] ❌ Database schema mismatch - connected to wrong database?');
              toast.error('Database connection error', {
                description: 'The app may be connected to the wrong database. Please refresh.',
              });
              return; // Don't retry on schema errors
            }
            
            // Network error (retry allowed)
            if (fetchError.code === 'PGRST301' || fetchError.message?.includes('network')) {
              console.warn('[ClerkSync] ⚠️ Network error, will retry...');
            }
            
            if (fetchError.code !== 'PGRST116') { // PGRST116 = no rows (ok for new users)
              console.error('[ClerkSync] Error fetching profile:', fetchError);
              throw fetchError;
            }
          }

          // 2. Build profile data
          const profileData = {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            full_name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
            avatar_url: user.imageUrl,
            updated_at: new Date().toISOString(),
          };

          if (existingProfile) {
            // Update existing profile
            console.log('[ClerkSync] Updating existing profile');
            const { error: updateError } = await supabase
              .from('profiles')
              .update(profileData)
              .eq('id', user.id);

            if (updateError) throw updateError;
          } else {
            // Create new profile
            console.log('[ClerkSync] Creating new profile');
            const { error: insertError } = await supabase
              .from('profiles')
              .insert(profileData);

            if (insertError) throw insertError;

            // Create onboarding record for new users
            console.log('[ClerkSync] Creating onboarding record');
            const { error: onboardingError } = await supabase
              .from('user_onboarding')
              .insert({
                user_id: user.id,
                onboarding_completed: false,
                agent_onboarding_completed: false,
                call_center_onboarding_completed: false,
              });

            if (onboardingError && onboardingError.code !== '23505') { // Ignore duplicate key errors
              console.error('[ClerkSync] Error creating onboarding:', onboardingError);
            }
          }

          console.log('[ClerkSync] ✓ Sync successful');
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
  }, [user, isLoaded]);

  return null;
}
