import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../../../context/UserContext';
import { Button } from '@/components/ui/button';
import { Check, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ExternalServiceConnection } from '@/api/entities';
import { useAuth } from '@clerk/clerk-react';

export default function IntegrationsSetup({ data, onNext, onBack }) {
  const { user } = useContext(UserContext);
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [connected, setConnected] = useState({
    google: false,
    microsoft: false,
    crm: false,
    zoom: false,
    meta: false
  });

  useEffect(() => {
    if (user?.id) {
      checkExistingConnections();
    }
  }, [user?.id]);

  const checkExistingConnections = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      const connections = await ExternalServiceConnection.filter({ 
        userId: user.id,
        connectionStatus: 'connected'
      }, '-created_at', token);

      const status = {
        google: connections?.some(c => c.serviceName === 'google_workspace') || false,
        microsoft: connections?.some(c => c.serviceName === 'microsoft_365') || false,
        crm: connections?.some(c => c.serviceName === 'lofty' || c.serviceName === 'follow_up_boss') || false,
        zoom: connections?.some(c => c.serviceName === 'zoom') || false,
        meta: connections?.some(c => c.serviceName === 'facebook' || c.serviceName === 'instagram') || false
      };

      setConnected(status);
    } catch (error) {
      console.error('Error checking connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (service) => {
    setConnecting(service);
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }
      
      let response;
      
      switch (service) {
        case 'google':
          response = await supabase.functions.invoke('initiateGoogleWorkspaceOAuth', {
            headers: {
              Authorization: `Bearer ${token}`
            },
            body: {
              redirectPath: '/onboarding'
            }
          });
          if (response.data?.authUrl) {
            window.location.href = response.data.authUrl;
          } else {
            throw new Error('No authorization URL received');
          }
          break;
          
        case 'microsoft':
          response = await supabase.functions.invoke('initiateMicrosoftOAuth', {
            headers: {
              Authorization: `Bearer ${token}`
            },
            body: {
              redirectPath: '/onboarding'
            }
          });
          if (response.data?.authUrl) {
            window.location.href = response.data.authUrl;
          } else {
            throw new Error('No authorization URL received');
          }
          break;
          
        case 'zoom':
          response = await supabase.functions.invoke('initiateZoomOAuth', {
            headers: {
              Authorization: `Bearer ${token}`
            },
            body: {
              redirectPath: '/onboarding'
            }
          });
          if (response.data?.authUrl) {
            window.location.href = response.data.authUrl;
          } else {
            throw new Error('No authorization URL received');
          }
          break;
          
        case 'meta':
          response = await supabase.functions.invoke('initiateMetaOAuth', {
            headers: {
              Authorization: `Bearer ${token}`
            },
            body: {
              redirectPath: '/onboarding',
              service: 'facebook' // Default to Facebook, can be changed to Instagram
            }
          });
          if (response.data?.authUrl) {
            window.location.href = response.data.authUrl;
          } else {
            throw new Error('No authorization URL received');
          }
          break;
          
        default:
          toast.info(`${service} connection coming soon`);
      }
    } catch (error) {
      console.error(`Error connecting ${service}:`, error);
      toast.error(`Failed to connect ${service}`);
    } finally {
      setConnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1E293B] mb-3">
          Connect Your Services
        </h2>
        <p className="text-[#64748B]">
          Link your tools so your AI agents can work seamlessly (optional)
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] space-y-4 mb-8">
        <div className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F8FAFC] flex items-center justify-center">
              📧
            </div>
            <div>
              <h4 className="font-semibold text-[#1E293B]">Google Workspace</h4>
              <p className="text-sm text-[#64748B]">Gmail, Calendar, Drive</p>
            </div>
          </div>
          {connected.google ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <Button
              onClick={() => handleConnect('google')}
              disabled={connecting === 'google'}
              size="sm"
              variant="outline"
            >
              {connecting === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Connect <ExternalLink className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F8FAFC] flex items-center justify-center">
              📨
            </div>
            <div>
              <h4 className="font-semibold text-[#1E293B]">Microsoft 365</h4>
              <p className="text-sm text-[#64748B]">Outlook, Teams, OneDrive</p>
            </div>
          </div>
          {connected.microsoft ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <Button
              onClick={() => handleConnect('microsoft')}
              disabled={connecting === 'microsoft'}
              size="sm"
              variant="outline"
            >
              {connecting === 'microsoft' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Connect <ExternalLink className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F8FAFC] flex items-center justify-center">
              🎥
            </div>
            <div>
              <h4 className="font-semibold text-[#1E293B]">Zoom</h4>
              <p className="text-sm text-[#64748B]">Video meetings</p>
            </div>
          </div>
          {connected.zoom ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <Button
              onClick={() => handleConnect('zoom')}
              disabled={connecting === 'zoom'}
              size="sm"
              variant="outline"
            >
              {connecting === 'zoom' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Connect <ExternalLink className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F8FAFC] flex items-center justify-center">
              📱
            </div>
            <div>
              <h4 className="font-semibold text-[#1E293B]">Meta (Facebook & Instagram)</h4>
              <p className="text-sm text-[#64748B]">Social media posting</p>
            </div>
          </div>
          {connected.meta ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <Button
              onClick={() => handleConnect('meta')}
              disabled={connecting === 'meta'}
              size="sm"
              variant="outline"
            >
              {connecting === 'meta' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Connect <ExternalLink className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button
          onClick={() => onNext({})}
          size="lg"
          className="bg-gradient-to-r from-[#E4018B] to-[#7017C3] hover:opacity-90 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}