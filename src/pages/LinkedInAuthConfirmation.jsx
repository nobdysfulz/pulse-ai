import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingIndicator from '../components/ui/LoadingIndicator'; // Ensure this path is correct

export default function LinkedInAuthConfirmation() {
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state) {
        try {
          const { data } = await supabase.functions.invoke('linkedinOAuthCallback', { body: { code, state } });

          if (data.success) {
            window.opener.postMessage('linkedin-auth-success', window.location.origin);
          } else {
            window.opener.postMessage('linkedin-auth-failure', window.location.origin);
          }
        } catch (error) {
          console.error('LinkedIn Auth Confirmation Error:', error);
          window.opener.postMessage('linkedin-auth-failure', window.location.origin);
        }
      } else {
        console.error('Missing code or state in LinkedIn OAuth callback URL.');
        window.opener.postMessage('linkedin-auth-failure', window.location.origin);
      }
      window.close();
    };

    handleAuthCallback();
  }, [location]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#F8FAFC]">
      <LoadingIndicator text="Connecting LinkedIn..." size="md" />
      <p className="text-sm text-gray-500 mt-4">Please wait, do not close this window.</p>
    </div>
  );
}