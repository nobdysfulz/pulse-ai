import React from 'react';
import { cn } from '@/lib/utils';

const agentAvatars = {
  executive_assistant: '/images/agents/executive-assistant.png',
  leads_agent: '/images/agents/leads-agent.png',
  content_agent: '/images/agents/content-agent.png',
  transaction_coordinator: '/images/agents/transaction-coordinator.png'
};

export default function ContextualTopNav({ tabs, activeTab, onTabChange, actionButton }) {
  return (
    <div className="bg-white pt-2 pr-6 pl-6 border-b border-[#E2E8F0] flex items-center justify-between h-[64px] flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors relative top-[1px] text-center flex items-center gap-2",
              activeTab === tab.id
                ? "text-[#7C3AED] border-[#7C3AED]"
                : "text-[#475569] border-transparent hover:text-[#1E293B]"
            )}
          >
            {agentAvatars[tab.id] && (
              <img 
                src={agentAvatars[tab.id]} 
                alt={tab.label}
                className="w-6 h-6 rounded-full"
              />
            )}
            <div>
              <div className="font-semibold">{tab.label}</div>
              {tab.subtitle && (
                <div className="text-xs font-normal text-[#64748B]">{tab.subtitle}</div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
}