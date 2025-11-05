import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Component that syncs Clerk user data to Supabase
 * This ensures user profiles are created/updated when users sign in
 */
export default function ClerkSupabaseSync() {
  const { user, isLoaded } = useUser();
  const [syncAttempts, setSyncAttempts] = useState(0);

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !user) return;
      if (syncAttempts >= 3) return; // Max 3 retries

      try {
        console.log('[ClerkSync] Syncing user:', user.id);

        // 1. Check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('[ClerkSync] Error fetching profile:', fetchError);
          throw fetchError;
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
        setSyncAttempts(0); // Reset on success

      } catch (error) {
        console.error('[ClerkSync] Sync error:', error);
        setSyncAttempts(prev => prev + 1);
        
        if (syncAttempts >= 2) {
          toast.error('Profile sync failed. Please refresh the page.', {
            description: 'Contact support if this persists.',
            duration: 5000,
          });
        }
      }
    };

    syncUser();
  }, [user, isLoaded, syncAttempts]);

  return null;
}
