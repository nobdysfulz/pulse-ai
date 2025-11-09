
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Loader2, CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function ConnectionsPanel({ agentType }) {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadIntegrationStatus();
    }
  }, [agentType, user]);

  const loadIntegrationStatus = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const { data } = await supabase.functions.invoke('getIntegrationContext', {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          userId: user.id
        }
      });
      setIntegrationStatus(data);
    } catch (error) {
      console.error('Error loading integration status:', error);
      toast.error('Failed to load integration status');
    } finally {
      setLoading(false);
    }
  };

  const handleManageConnections = () => {
    navigate(createPageUrl('Settings?tab=integrations'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[#1E293B] mb-1">Connected Services</h3>
        <p className="text-xs text-[#64748B] mb-4">
          Manage your integrations to unlock more capabilities
        </p>

        <div className="space-y-3">
          {/* Calendar */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#1E293B]">Calendar</span>
              <div className="flex items-center gap-1">
                {integrationStatus?.calendarStatus === 'connected' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 text-xs">Connected</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500 text-xs">Not connected</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-[#64748B]">
              Schedule appointments and manage your availability
            </p>
            {integrationStatus?.upcomingEvents > 0 && (
              <p className="text-xs text-[#7C3AED] mt-2">
                {integrationStatus.upcomingEvents} upcoming events
              </p>
            )}
          </div>

          {/* Video Conferencing */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#1E293B]">Video Meetings</span>
              <div className="flex items-center gap-1">
                {integrationStatus?.zoomStatus === 'connected' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 text-xs">Connected</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500 text-xs">Not connected</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-[#64748B]">
              Create and manage Zoom/Google Meet meetings
            </p>
          </div>

          {/* Email */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#1E293B]">Email</span>
              <div className="flex items-center gap-1">
                {integrationStatus?.emailStatus === 'connected' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 text-xs">Connected</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500 text-xs">Not connected</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-[#64748B]">
              Send emails and manage communications
            </p>
          </div>

          {/* Social Media - Facebook */}
          {(agentType === 'content_agent' || agentType === 'executive_assistant') && (
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1E293B]">Facebook</span>
                <div className="flex items-center gap-1">
                  {integrationStatus?.facebookStatus === 'connected' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 text-xs">Connected</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-xs">Not connected</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#64748B]">
                Post to Facebook Pages
              </p>
            </div>
          )}

          {/* Social Media - Instagram */}
          {(agentType === 'content_agent' || agentType === 'executive_assistant') && (
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1E293B]">Instagram</span>
                <div className="flex items-center gap-1">
                  {integrationStatus?.instagramStatus === 'connected' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 text-xs">Connected</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-xs">Not connected</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#64748B]">
                Post to Instagram Business
              </p>
              {integrationStatus?.scheduledPosts > 0 && (
                <p className="text-xs text-[#7C3AED] mt-2">
                  {integrationStatus.scheduledPosts} scheduled posts
                </p>
              )}
            </div>
          )}

          {/* LinkedIn */}
          {(agentType === 'content_agent' || agentType === 'executive_assistant') && (
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1E293B]">LinkedIn</span>
                <div className="flex items-center gap-1">
                  {integrationStatus?.linkedinStatus === 'connected' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 text-xs">Connected</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-xs">Not connected</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#64748B]">
                Post to LinkedIn Profile
              </p>
            </div>
          )}

          {/* CRM */}
          {(agentType === 'executive_assistant' || agentType === 'transaction_coordinator') && (
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1E293B]">CRM</span>
                <div className="flex items-center gap-1">
                  {integrationStatus?.crmStatus === 'connected' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 text-xs">Connected</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-xs">Not connected</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#64748B]">
                Access leads and contact information
              </p>
              {integrationStatus?.recentLeads > 0 && (
                <p className="text-xs text-[#7C3AED] mt-2">
                  {integrationStatus.recentLeads} recent leads
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleManageConnections}
        variant="outline"
        className="w-full"
        size="sm"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Manage Connections
      </Button>
    </div>
  );
}
