import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingIndicator from '../components/ui/LoadingIndicator'; // Ensure this path is correct

export default function GoogleAuthConfirmation() {
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state) {
        try {
          // Invoke the backend function to handle the OAuth callback
          const { data } = await supabase.functions.invoke('googleCalendarAuth', {
            body: {
              action: 'handleCallback',
              payload: { code, state }
            }
          });

          if (data.success) {
            // Send success message to the opener window and close the popup
            window.opener.postMessage('google-auth-success', window.location.origin);
          } else {
            // Send failure message
            window.opener.postMessage('google-auth-failure', window.location.origin);
          }
        } catch (error) {
          console.error('Google Auth Confirmation Error:', error);
          window.opener.postMessage('google-auth-failure', window.location.origin);
        }
      } else {
        console.error('Missing code or state in Google OAuth callback URL.');
        window.opener.postMessage('google-auth-failure', window.location.origin);
      }
      // Always close the popup after attempting to handle the callback
      window.close();
    };

    handleAuthCallback();
  }, [location]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#F8FAFC]">
      <LoadingIndicator text="Connecting Google Calendar..." size="md" />
      <p className="text-sm text-gray-500 mt-4">Please wait, do not close this window.</p>
    </div>
  );
}