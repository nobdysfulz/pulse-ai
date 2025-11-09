import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../../../context/UserContext';
import { Button } from '@/components/ui/button';
import { Check, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ExternalServiceConnection } from '@/api/entities';

export default function GoogleWorkspaceSetup({ data, onNext, onBack }) {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const connections = await ExternalServiceConnection.filter({
        userId: user.id,
        serviceName: 'google_workspace',
        status: 'connected'
      });
      setConnected(connections.length > 0);
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const response = await supabase.functions.invoke('initiateGoogleWorkspaceOAuth', {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          redirectPath: '/onboarding'
        }
      });

      if (response.data && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting Google:', error);
      toast.error('Failed to connect Google Workspace');
      setConnecting(false);
    }
  };

  const handleContinue = () => {
    if (!connected) {
      toast.error('Please connect Google Workspace to continue');
      return;
    }
    onNext({ googleConnected: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1E293B] mb-3">
          Connect Google Calendar
        </h2>
        <p className="text-[#64748B]">
          Allow your AI agent to schedule appointments on your calendar
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] mb-8">
        <div className="flex items-center justify-between p-6 border border-[#E2E8F0] rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <h4 className="font-semibold text-[#1E293B]">Google Workspace</h4>
              <p className="text-sm text-[#64748B]">Calendar access for appointment scheduling</p>
            </div>
          </div>

          {connected ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">Connected</span>
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="gap-2"
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Connect
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!connected}
          size="lg"
          className="bg-gradient-to-r from-[#E4018B] to-[#7017C3] hover:opacity-90 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}