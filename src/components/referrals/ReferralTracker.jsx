import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// This component handles referral tracking and processing
export default function ReferralTracker() {
  useEffect(() => {
    const handleReferralTracking = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref');
        
        if (referralCode) {
          // Store referral code with timestamp for 60-day window
          const referralData = {
            referrerId: referralCode,
            timestamp: new Date().getTime()
          };
          localStorage.setItem('referralData', JSON.stringify(referralData));
          
          // Set flag that user just signed up (this should be set by your signup process)
          localStorage.setItem('userJustSignedUp', 'true');
        }

        // Check if user just signed up and has referral data
        const storedReferralData = localStorage.getItem('referralData');
        const userJustSignedUp = localStorage.getItem('userJustSignedUp');
        
        if (storedReferralData && userJustSignedUp) {
          const referralData = JSON.parse(storedReferralData);
          const referralAge = new Date().getTime() - referralData.timestamp;
          const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000; // 60 days
          
          // Check if referral is within 60-day window
          if (referralAge <= sixtyDaysInMs) {
            try {
              const currentUser = clerkUser;
              
              if (!currentUser) return;
              
              if (currentUser && referralData.referrerId !== currentUser.id) {
                // Process the referral
                const { error } = await supabase.functions.invoke('processReferral', {
                  body: {
                    referrerId: referralData.referrerId,
                    newUserId: currentUser.id,
                    newUserEmail: currentUser.email
                  }
                });
                
                if (error) throw error;
              }
            } catch (error) {
              // User might not be logged in yet, which is fine
              console.log('User not authenticated yet for referral processing');
            }
          }
          
          // Clean up localStorage
          localStorage.removeItem('referralData');
          localStorage.removeItem('userJustSignedUp');
        }
      } catch (error) {
        console.error('Error handling referral tracking:', error);
      }
    };

    handleReferralTracking();
  }, []);

  // This component doesn't render anything
  return null;
}