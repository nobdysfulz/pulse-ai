
import React, { useContext, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { User, MapPin, Settings, Bell, Link as LinkIcon, Gift, Brain, Shield, Share2, KeyRound, ChevronDown } from 'lucide-react';

export default function SettingsSidebar({ activeTab, onTabChange }) {
  const { user } = useContext(UserContext);
  const [adminExpanded, setAdminExpanded] = useState(false);

  const regularMenuItems = [
    { id: 'setup-progress', label: 'Setup Progress', icon: Settings },
    { id: 'account', label: 'Profile', icon: User },
    { id: 'market', label: 'My Market', icon: MapPin },
    { id: 'agent-intelligence', label: 'AI', icon: Brain },
    { id: 'integrations', label: 'Integrations', icon: LinkIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'referrals', label: 'Share & Earn', icon: Gift },
    { id: 'security', label: 'Security', icon: KeyRound },
  ];

  const adminSubItems = [
    { id: 'data-import', label: 'Data Import' },
    { id: 'admin-monitoring', label: 'System Monitoring' },
    { id: 'admin-errors', label: 'System Errors' },
    { id: 'admin-integrations', label: 'Integration Health' },
    { id: 'admin-flags', label: 'Feature Flags' },
    { id: 'admin-autopilot', label: 'Autopilot Activity' },
    { id: 'admin-users', label: 'Users & Permissions' },
    { id: 'admin-subscriptions', label: 'Subscriptions' },
    { id: 'admin-emails', label: 'Email Campaigns' },
    { id: 'admin-content', label: 'Content Topics' },
    { id: 'admin-packs', label: 'Content Packs' },
    { id: 'admin-featured', label: 'Featured Packs' },
    { id: 'admin-prompts', label: 'AI Prompts' },
    { id: 'admin-campaigns', label: 'Campaign Templates' },
    { id: 'admin-scenarios', label: 'Role-Play Scenarios' },
    { id: 'admin-personas', label: 'Client Personas' },
    { id: 'admin-scripts', label: 'Objection Scripts' },
    { id: 'admin-tasks', label: 'Task Templates' },
    { id: 'admin-voices', label: 'Agent Voices' },
    { id: 'admin-disclosures', label: 'Legal Documents' },
  ];

  const isAdminTabActive = activeTab.startsWith('admin-') || activeTab === 'data-import';

  React.useEffect(() => {
    if (isAdminTabActive) {
      setAdminExpanded(true);
    }
  }, [isAdminTabActive]);

  return (
    <aside className="bg-gray-50 w-64 border-r border-[#E2E8F0] flex-shrink-0 flex flex-col h-screen">
      <div className="p-6 border-b border-[#E2E8F0]">
        <h2 className="text-xl font-semibold text-[#1E293B]">Settings</h2>
      </div>
      
      {/* FIX: Add overflow-y-auto to make the nav scrollable */}
      <nav className="flex-1 overflow-y-auto p-6 space-y-1">
        {regularMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-white text-[#1E293B] font-semibold shadow-sm' 
                  : 'text-[#475569] hover:bg-gray-100 hover:text-[#1E293B]'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Admin Section with Expandable Sub-menu */}
        {user?.role === 'admin' && (
          <div className="mt-2">
            <button
              onClick={() => setAdminExpanded(!adminExpanded)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isAdminTabActive 
                  ? 'bg-white text-[#1E293B] font-semibold shadow-sm' 
                  : 'text-[#475569] hover:bg-gray-100 hover:text-[#1E293B]'
                }
              `}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
              <ChevronDown 
                className={`w-4 h-4 ml-auto transition-transform ${
                  adminExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Expandable Admin Sub-items */}
            {adminExpanded && (
              <div className="mt-1 ml-4 space-y-1 border-l-2 border-[#E2E8F0] pl-2">
                {adminSubItems.map((subItem) => {
                  const isActive = activeTab === subItem.id;
                  
                  return (
                    <button
                      key={subItem.id}
                      onClick={() => onTabChange(subItem.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors
                        ${isActive 
                          ? 'bg-[#6D28D9] text-white font-medium' 
                          : 'text-[#64748B] hover:bg-gray-100 hover:text-[#1E293B]'
                        }
                      `}
                    >
                      {subItem.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}
