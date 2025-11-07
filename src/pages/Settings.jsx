
import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../components/context/UserContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import SettingsSidebar from '../components/settings/SettingsSidebar';
import SetupProgressTab from '../components/settings/SetupProgressTab';
import IntegrationsTab from '../components/settings/IntegrationsTab';
import ReferralTab from '../components/settings/ReferralTab';
import AgentIntelligenceTab from '../components/settings/AgentIntelligenceTab';
import ProfileTab from '../components/settings/ProfileTab';
import MarketTab from '../components/settings/MarketTab';
import NotificationsTab from '../components/settings/NotificationsTab';
import PreferencesTab from '../components/settings/PreferencesTab';
import SecurityTab from '../components/settings/SecurityTab';
import { Card, CardContent } from '@/components/ui/card';

// Admin Components
import UserManagementTab from '../components/settings/UserManagementTab';
import ManualSubscriptionManager from '../components/settings/ManualSubscriptionManager';
import ContentTopicsManager from '../components/settings/ContentTopicsManager';
import ContentPackManager from '../components/settings/ContentPackManager';
import FeaturedContentPackManager from '../components/settings/FeaturedContentPackManager';
import AiPromptManager from '../components/settings/AiPromptManager';
import CampaignTemplateManager from '../components/settings/CampaignTemplateManager';
import ScenarioManager from '../components/settings/ScenarioManager';
import ClientPersonaManager from '../components/settings/ClientPersonaManager';
import ObjectionScriptManager from '../components/settings/ObjectionScriptManager';
import TaskTemplateManager from '../components/settings/TaskTemplateManager'; // Changed from TaskTemplateForm to TaskTemplateManager
import AgentVoiceManager from '../components/settings/AgentVoiceManager';
import DisclosureManager from '../components/settings/DisclosureManager';
import EmailCampaignManager from '../components/settings/EmailCampaignManager';
import SystemMonitoringDashboard from '../components/settings/SystemMonitoringDashboard';
import SystemErrorsManager from '../components/settings/SystemErrorsManager';
import FeatureFlagsManager from '../components/settings/FeatureFlagsManager';
import IntegrationHealthMonitor from '../components/settings/IntegrationHealthMonitor';
import AutopilotMonitoring from '../components/settings/AutopilotMonitoring';
import DataImportManager from '../components/settings/DataImportManager';

export default function SettingsPage() {
  const { user, loading } = useContext(UserContext);
  const isAdmin = useIsAdmin();
  const [activeTab, setActiveTab] = useState('account');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, []);

  const renderContent = () => {
    // Regular Settings Tabs
    switch (activeTab) {
      case 'setup-progress':
        return <SetupProgressTab />;
      case 'account':
        return <ProfileTab />;
      case 'market':
        return <MarketTab />;
      case 'agent-intelligence':
        return <AgentIntelligenceTab />;
      case 'integrations':
        return <IntegrationsTab user={user} />;
      case 'notifications':
        return <NotificationsTab />;
      case 'preferences':
        return <PreferencesTab />;
      case 'referrals':
        return <ReferralTab user={user} />;
      case 'security':
        return <SecurityTab />;
      
      // Admin Tabs
      case 'data-import':
        return isAdmin ? <DataImportManager /> : <AccessDenied />;
      case 'admin-users':
        return isAdmin ? <UserManagementTab /> : <AccessDenied />;
      case 'admin-subscriptions':
        return isAdmin ? <ManualSubscriptionManager /> : <AccessDenied />;
      case 'admin-content':
        return isAdmin ? <ContentTopicsManager /> : <AccessDenied />;
      case 'admin-packs':
        return isAdmin ? <ContentPackManager /> : <AccessDenied />;
      case 'admin-featured':
        return isAdmin ? <FeaturedContentPackManager /> : <AccessDenied />;
      case 'admin-prompts':
        return isAdmin ? <AiPromptManager /> : <AccessDenied />;
      case 'admin-campaigns':
        return isAdmin ? <CampaignTemplateManager /> : <AccessDenied />;
      case 'admin-scenarios':
        return isAdmin ? <ScenarioManager /> : <AccessDenied />;
      case 'admin-personas':
        return isAdmin ? <ClientPersonaManager /> : <AccessDenied />;
      case 'admin-scripts':
        return isAdmin ? <ObjectionScriptManager /> : <AccessDenied />;
      case 'admin-tasks':
        return isAdmin ? <TaskTemplateManager /> : <AccessDenied />;
      case 'admin-voices':
        return isAdmin ? <AgentVoiceManager /> : <AccessDenied />;
      case 'admin-disclosures':
        return isAdmin ? <DisclosureManager /> : <AccessDenied />;
      
      // NEW Admin Tabs
      case 'admin-emails':
        return isAdmin ? <EmailCampaignManager /> : <AccessDenied />;
      case 'admin-monitoring':
        return isAdmin ? <SystemMonitoringDashboard /> : <AccessDenied />;
      case 'admin-errors':
        return isAdmin ? <SystemErrorsManager /> : <AccessDenied />;
      case 'admin-flags':
        return isAdmin ? <FeatureFlagsManager /> : <AccessDenied />;
      case 'admin-integrations':
        return isAdmin ? <IntegrationHealthMonitor /> : <AccessDenied />;
      case 'admin-autopilot':
        return isAdmin ? <AutopilotMonitoring /> : <AccessDenied />;
      
      default:
        return <ProfileTab />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
        <LoadingIndicator text="Loading Settings..." size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function AccessDenied() {
  return (
    <Card className="bg-white border border-[#E2E8F0]">
      <CardContent className="p-12 text-center">
        <h3 className="text-lg font-semibold text-[#1E293B] mb-2">Access Denied</h3>
        <p className="text-sm text-[#475569]">You don't have permission to access this section</p>
      </CardContent>
    </Card>
  );
}
