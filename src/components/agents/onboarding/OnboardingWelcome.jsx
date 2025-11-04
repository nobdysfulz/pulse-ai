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
          avatarUrl="/images/agents/executive-assistant.png"
          name="NOVA - Executive Assistant"
          description="Email, scheduling, and business management" />

        <AgentCard
          avatarUrl="/images/agents/content-agent.png"
          name="SIRIUS - Content Agent"
          description="Social media and marketing content" />

        <AgentCard
          avatarUrl="/images/agents/transaction-coordinator.png"
          name="VEGA - Transaction Coordinator"
          description="Deal management and communication" />

        <AgentCard
          avatarUrl="/images/agents/leads-agent.png"
          name="PHOENIX - Leads Agent"
          description="Calling and lead follow-up" />

      </div>
    </div>);

}