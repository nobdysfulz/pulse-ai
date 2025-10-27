import React from 'react';
import { cn } from '@/lib/utils';

const agentAvatars = {
  executive_assistant: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/9ed7e57e3_ExecutiveAssistant.png',
  leads_agent: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/20de0fbee_LeadsAgent.png',
  content_agent: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/4cce42e70_ContentAgent.png',
  transaction_coordinator: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/1b1eebc95_TransactionCoordinator.png'
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