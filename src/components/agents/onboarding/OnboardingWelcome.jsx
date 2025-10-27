import React from 'react';

const AgentCard = ({ avatarUrl, name, description }) =>
<div className="p-6 border border-[#E2E8F0] rounded-lg bg-white hover:border-[#7C3AED] transition-colors text-center">
    <img
    src={avatarUrl}
    alt={name}
    className="w-24 h-24 mx-auto mb-4 rounded-full object-cover" />

    <h3 className="font-semibold text-[#1E293B] mb-2">{name}</h3>
    <p className="text-sm text-[#64748B]">{description}</p>
  </div>;


export default function OnboardingWelcome() {
  return (
    <div className="text-center p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-[#1E293B] mb-4"></h1>
      <p className="text-[#475569] mb-8">Let's personalize your AI assistants to work exactly how you prefer</p>
      
      <div className="grid grid-cols-2 gap-4">
        <AgentCard
          avatarUrl="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/9b81961d8_ExecutiveAssistant.png"
          name="NOVA - Executive Assistant"
          description="Email, scheduling, and business management" />

        <AgentCard
          avatarUrl="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/87cbb14be_ContentAgent.png"
          name="SIRIUS - Content Agent"
          description="Social media and marketing content" />

        <AgentCard
          avatarUrl="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/76c3f0c3c_TransactionCoordinator.png"
          name="VEGA - Transaction Coordinator"
          description="Deal management and communication" />

        <AgentCard
          avatarUrl="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/39b5ba55a_LeadsAgent.png"
          name="PHOENIX - Leads Agent"
          description="Calling and lead follow-up" />

      </div>
    </div>);

}