
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { UserContext } from '../components/context/UserContext';
import { CallLog, UserOnboarding } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { RefreshCw, CalendarPlus, Phone, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import ContextualTopNav from '../components/layout/ContextualTopNav';
import ContextualSidebar from '../components/layout/ContextualSidebar';
import AgentChatInterface from '../components/agents/AgentChatInterface';
import GuidelinesPanel from '../components/agents/GuidelinesPanel';
import KnowledgePanel from '../components/agents/KnowledgePanel';
import PastContentPanel from '../components/agents/PastContentPanel';
import CurrentTransactionsPanel from '../components/agents/CurrentTransactionsPanel';
import AgentOnboardingFlow from '../components/agents/onboarding/AgentOnboardingFlow';
import LoadingIndicator from '../components/ui/LoadingIndicator'; // Added import

// Lead Concierge imports (DO NOT MODIFY)
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CallDetailSidebar from '../components/agents/CallDetailSidebar';
import CallMetrics from '../components/agents/CallMetrics';
import CreateCampaignModal from '../components/agents/CreateCampaignModal';
import SingleCallModal from '../components/agents/SingleCallModal';

export default function AgentsPage() {
  const { user, loading: contextLoading } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('executive_assistant');
  const [loading, setLoading] = useState(true);
  const [rightSidebarTab, setRightSidebarTab] = useState('guidelines');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Lead Concierge state (DO NOT MODIFY)
  const [callLogs, setCallLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showSingleCallModal, setShowSingleCallModal] = useState(false);
  const logsPerPage = 10;

  const isSubscriber = user?.subscriptionTier === 'Subscriber' || user?.subscriptionTier === 'Admin';

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      if (user) {
        try {
          const onboardingRecords = await UserOnboarding.filter({ userId: user.id });
          if (onboardingRecords.length === 0 || !onboardingRecords[0].agentOnboardingCompleted) {
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      }
    };
    checkOnboarding();
  }, [user]);

  // Read initial tab from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setRightSidebarTab('guidelines');
    const newUrl = `${createPageUrl('Agents')}?tab=${tabId}`;
    window.history.pushState({}, '', newUrl);
  };

  // MEMOIZE agent profiles and tabs to prevent unnecessary re-renders
  const agentProfiles = useMemo(() => ({
    executive_assistant: { name: 'NOVA', role: 'Executive Assistant', avatar: '🤖' },
    content_agent: { name: 'SIRIUS', role: 'Content Agent', avatar: '✨' },
    leads_agent: { name: 'PHOENIX', role: 'Leads Agent', avatar: '🔥' },
    transaction_coordinator: { name: 'VEGA', role: 'Transaction Coordinator', avatar: '📋' }
  }), []);

  const tabs = useMemo(() => [
    {
      id: 'executive_assistant',
      label: agentProfiles.executive_assistant.name,
      subtitle: agentProfiles.executive_assistant.role
    },
    {
      id: 'leads_agent',
      label: agentProfiles.leads_agent.name,
      subtitle: agentProfiles.leads_agent.role
    },
    {
      id: 'content_agent',
      label: agentProfiles.content_agent.name,
      subtitle: agentProfiles.content_agent.role
    },
    {
      id: 'transaction_coordinator',
      label: agentProfiles.transaction_coordinator.name,
      subtitle: agentProfiles.transaction_coordinator.role
    }
  ], [agentProfiles]);

  useEffect(() => {
    if (!contextLoading && user) {
      loadPageData();
    }
  }, [contextLoading, user]);

  const loadPageData = async () => {
    setLoading(true);
    try {
      const logsData = await CallLog.filter({ userEmail: user.email }, '-created_date');
      setCallLogs(logsData || []);
    } catch (error) {
      console.error('Error loading agent data:', error);
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  // Show onboarding if not completed
  if (showOnboarding) {
    return <AgentOnboardingFlow onComplete={() => setShowOnboarding(false)} />;
  }

  // Replace generic loader with custom AI icon
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <LoadingIndicator text="Loading AI Agents..." size="lg" />
      </div>
    );
  }

  // Lead Concierge functions (DO NOT MODIFY)
  // FIX: Optimize CSV export to prevent UI freezing
  const handleDownloadLogs = async () => {
    if (callLogs.length === 0) {
      toast.info("No call logs to download.");
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading('Preparing download...');

      // Use setTimeout to yield to browser and keep UI responsive
      await new Promise(resolve => setTimeout(resolve, 0));

      const headers = ['Date', 'Name', 'Phone', 'Status', 'Duration (s)', 'Campaign'];
      const csvRows = [headers.join(',')];

      // Process in chunks to avoid blocking
      const chunkSize = 100;
      for (let i = 0; i < callLogs.length; i += chunkSize) {
        const chunk = callLogs.slice(i, i + chunkSize);
        
        chunk.forEach((log) => {
          const row = [
            format(new Date(log.created_date), 'yyyy-MM-dd hh:mm a'),
            `"${log.contactName || 'Unknown'}"`,
            log.contactPhone || '',
            log.status?.replace(/_/g, ' ') || 'N/A',
            log.duration || 0,
            `"${log.campaignName || ''}"`
          ];
          csvRows.push(row.join(','));
        });

        // Yield to browser after each chunk
        if (i + chunkSize < callLogs.length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pulse_call_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the object URL

      toast.dismiss(loadingToast);
      toast.success("Call logs downloaded successfully.");
    } catch (error) {
      console.error('Error downloading logs:', error);
      toast.error("Failed to download logs. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'appointment_set': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'initiated': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
  };

  const handleBackToList = () => {
    setSelectedLog(null);
  };

  const paginatedLogs = callLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);
  const totalPages = Math.ceil(callLogs.length / logsPerPage);

  const renderMainContent = () => {
    // The global loading indicator now handles the loading state for the entire page.
    // The previous `if (loading && activeTab !== 'leads_agent')` block is removed.

    switch (activeTab) {
      case 'executive_assistant':
      case 'content_agent':
      case 'transaction_coordinator':
        return (
          <div className="h-full flex flex-col">
            <AgentChatInterface agentType={activeTab} />
          </div>
        );

      case 'leads_agent':
        // EXISTING LEAD CONCIERGE CODE - DO NOT MODIFY
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-[30px] font-semibold text-[#1E293B]">Call History</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowCampaignModal(true)}>
                  <CalendarPlus className="w-4 h-4 mr-2" /> Start Campaign
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowSingleCallModal(true)}>
                  <Phone className="w-4 h-4 mr-2" /> Call Now
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
                  <Upload className="w-4 h-4 mr-2" /> Download Logs
                </Button>
                <Button variant="outline" size="icon" onClick={loadPageData}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recent</TableHead>
                    <TableHead>Time (EST)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recording</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id} onClick={() => handleRowClick(log)} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium text-[#1E293B]">{log.contactPhone}</div>
                        <div className="text-sm text-[#64748B]">{log.contactName || 'Unknown'}</div>
                      </TableCell>
                      <TableCell className="text-sm text-[#475569]">
                        {format(new Date(log.created_date), 'MMM dd, yyyy - hh:mm a')}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium text-sm ${getStatusColor(log.status)}`}>
                          {log.status?.replace(/_/g, ' ') || 'No Information'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-[#475569]">{formatDuration(log.duration)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {callLogs.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-base text-[#475569]">No calls yet</p>
                  <p className="text-sm text-[#64748B] mt-1">Start a campaign to see call history</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  Previous
                </Button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Next
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // FIX: Extract repeated sidebar button group into reusable component
  const SidebarTabButton = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium transition-colors ${
        active
          ? 'text-[#7C3AED] border-b-2 border-[#7C3AED]'
          : 'text-[#64748B] hover:text-[#1E293B]'
      }`}
    >
      {children}
    </button>
  );

  const renderSidebarContent = () => {
    if (selectedLog && activeTab === 'leads_agent') {
      return <CallDetailSidebar log={selectedLog} onBack={handleBackToList} onDelete={loadPageData} />;
    }

    switch (activeTab) {
      case 'leads_agent':
        if (selectedLog) return null;
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Smart Lead Management</h3>
              <CallMetrics callLogs={callLogs} />
            </div>
          </div>
        );

      case 'executive_assistant':
        return (
          <div className="h-full flex flex-col">
            <div className="flex border-b border-[#E2E8F0] mb-4">
              <SidebarTabButton
                active={rightSidebarTab === 'guidelines'}
                onClick={() => setRightSidebarTab('guidelines')}
              >
                Guidelines
              </SidebarTabButton>
              <SidebarTabButton
                active={rightSidebarTab === 'knowledge'}
                onClick={() => setRightSidebarTab('knowledge')}
              >
                Knowledge
              </SidebarTabButton>
            </div>

            <div className="flex-1 overflow-y-auto">
              {rightSidebarTab === 'guidelines' && <GuidelinesPanel agentType={activeTab} />}
              {rightSidebarTab === 'knowledge' && <KnowledgePanel />}
            </div>
          </div>
        );

      case 'content_agent':
        return (
          <div className="h-full flex flex-col">
            <div className="flex border-b border-[#E2E8F0] mb-4">
              <SidebarTabButton
                active={rightSidebarTab === 'guidelines'}
                onClick={() => setRightSidebarTab('guidelines')}
              >
                Guidelines
              </SidebarTabButton>
              <SidebarTabButton
                active={rightSidebarTab === 'past_content'}
                onClick={() => setRightSidebarTab('past_content')}
              >
                Past Content
              </SidebarTabButton>
            </div>

            <div className="flex-1 overflow-y-auto">
              {rightSidebarTab === 'guidelines' && <GuidelinesPanel agentType={activeTab} />}
              {rightSidebarTab === 'past_content' && <PastContentPanel />}
            </div>
          </div>
        );

      case 'transaction_coordinator':
        return (
          <div className="h-full flex flex-col">
            <div className="flex border-b border-[#E2E8F0] mb-4">
              <SidebarTabButton
                active={rightSidebarTab === 'guidelines'}
                onClick={() => setRightSidebarTab('guidelines')}
              >
                Guidelines
              </SidebarTabButton>
              <SidebarTabButton
                active={rightSidebarTab === 'transactions'}
                onClick={() => setRightSidebarTab('transactions')}
              >
                Current Transactions
              </SidebarTabButton>
            </div>

            <div className="flex-1 overflow-y-auto">
              {rightSidebarTab === 'guidelines' && <GuidelinesPanel agentType={activeTab} />}
              {rightSidebarTab === 'transactions' && <CurrentTransactionsPanel />}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getSidebarTitle = () => {
    if (selectedLog && activeTab === 'leads_agent') return "Call Details";

    const agent = agentProfiles[activeTab];
    return agent ? `${agent.name} - ${agent.role}` : "Agent";
  };

  return (
    <>
      <ContextualTopNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="bg-[#F8FAFC] pt-6 pr-8 pb-8 pl-8 flex-1 overflow-y-auto">
          {renderMainContent()}
        </div>

        <ContextualSidebar title={getSidebarTitle()}>
          {renderSidebarContent()}
        </ContextualSidebar>
      </div>

      {/* Lead Concierge Modals (DO NOT MODIFY) */}
      <CreateCampaignModal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        onCampaignStarted={() => {
          setShowCampaignModal(false);
          loadPageData();
        }}
      />

      <SingleCallModal
        isOpen={showSingleCallModal}
        onClose={() => setShowSingleCallModal(false)}
        onCallStarted={() => {
          setShowSingleCallModal(false);
          loadPageData();
        }}
      />
    </>
  );
}
