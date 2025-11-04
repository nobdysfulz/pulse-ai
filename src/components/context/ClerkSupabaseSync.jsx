import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Component that syncs Clerk user data to Supabase
 * This ensures user profiles are created/updated when users sign in
 */
export default function ClerkSupabaseSync() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !user) return;

      try {
        // Get or create profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const profileData = {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          full_name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
          avatar_url: user.imageUrl,
          updated_at: new Date().toISOString(),
        };

        if (existingProfile) {
          // Update existing profile
          await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', user.id);
        } else {
          // Create new profile
          await supabase
            .from('profiles')
            .insert(profileData);

          // Create onboarding record
          await supabase
            .from('user_onboarding')
            .insert({
              user_id: user.id,
              onboarding_completed: false,
              agent_onboarding_completed: false,
              call_center_onboarding_completed: false,
            });
        }
      } catch (error) {
        console.error('Error syncing user to Supabase:', error);
      }
    };

    syncUser();
  }, [user, isLoaded]);

  return null;
}
