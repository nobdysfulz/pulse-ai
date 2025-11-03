import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { createPageUrl } from "@/utils";

export default function ReferralNotification({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const cleanupUrl = useCallback(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.has('referrerId') || urlParams.has('new_user_id') || urlParams.has('new_user_email')) {
        // Clean the URL parameters by removing them
        const pageName = location.pathname.split('/').pop() || 'Dashboard'; // Default to dashboard if path is '/'
        navigate(createPageUrl(pageName), { replace: true });
    }
  }, [location.search, location.pathname, navigate]);


  useEffect(() => {
    // Only attempt to process if a user is logged in
    if (!user || !user.id || !user.email) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const referrerId = urlParams.get('referrerId');

    // Check if it's a new user who just signed up
    const userCreatedDate = new Date(user.created_date);
    const now = new Date();
    // Check if account was created in the last 5 minutes.
    const isRecentlyCreated = (now.getTime() - userCreatedDate.getTime()) < (5 * 60 * 1000);

    // Flag to prevent repeated calls in the same browser session
    const referralProcessedInSession = sessionStorage.getItem('referredProcessed');

    if (referrerId && isRecentlyCreated && !referralProcessedInSession) {
      // Prevent subsequent re-triggers in this session immediately
      sessionStorage.setItem('referredProcessed', 'true');

      const process = async () => {
        try {
          const { data: response, error } = await supabase.functions.invoke('processReferral', {
            body: {
              referrerId: referrerId,
              newUserId: user.id,
              newUserEmail: user.email
            }
          });
          
          if (error) throw error;

          if (response.data.success) {
            toast.success("Credits Have Been Added!", {
              description: `Your referrer earned ${response.data.creditsAwarded || 5} credits. Thank you!`,
              duration: 8000,
            });
          } else {
            // Only show error toasts for actual errors, not for "already processed"
            if (response.data.error && !response.data.error.includes('already referred')) {
               toast.error("Referral Processing Error", {
                description: response.data.error,
                duration: 8000,
              });
            }
          }
        } catch (error) {
          console.error("Error calling processReferral function:", error);
          toast.error("Network Error", {
            description: "Could not communicate with the referral service.",
            duration: 8000,
          });
        } finally {
          // Clean the URL to prevent re-triggering on next load
          cleanupUrl();
        }
      };
      process();
    } else if (referrerId && !isRecentlyCreated) {
        // If the referralId is still in the URL for a non-new user, clean it up.
        cleanupUrl();
    }
  }, [user, navigate, cleanupUrl]);

  // This component doesn't render anything visible directly
  return null;
}