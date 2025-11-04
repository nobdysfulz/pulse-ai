import React from 'react';
import { Button } from '@/components/ui/button';

const AgentCard = ({ avatarUrl, name, description }) => (
  <div className="p-6 border border-[#E2E8F0] rounded-lg bg-white hover:border-[#7C3AED] transition-colors text-center">
    <img
      src={avatarUrl}
      alt={name}
      className="w-24 h-24 mx-auto mb-4 rounded-full object-cover"
    />
    <h3 className="font-semibold text-[#1E293B] mb-2">{name}</h3>
    <p className="text-sm text-[#64748B]">{description}</p>
  </div>
);

export default function AITeamIntro({ onNext, onBack }) {
  console.log('✅ AITeamIntro rendering');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1E293B] mb-3">
          Meet Your AI Team
        </h2>
        <p className="text-[#64748B]">
          Four specialized AI agents ready to transform your business
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <AgentCard
          avatarUrl="/images/agents/executive-assistant.png"
          name="NOVA - Executive Assistant"
          description="Email, scheduling, and business management"
        />
        <AgentCard
          avatarUrl="/images/agents/content-agent.png"
          name="SIRIUS - Content Agent"
          description="Social media and marketing content"
        />
        <AgentCard
          avatarUrl="/images/agents/transaction-coordinator.png"
          name="VEGA - Transaction Coordinator"
          description="Deal management and communication"
        />
        <AgentCard
          avatarUrl="/images/agents/leads-agent.png"
          name="PHOENIX - Leads Agent"
          description="Calling and lead follow-up"
        />
      </div>

      <div className="flex justify-between">
        {onBack && typeof onBack === 'function' && (
          <Button variant="outline" onClick={onBack} size="lg">
            Back
          </Button>
        )}
        <Button
          onClick={() => {
            console.log('✅ AITeamIntro - Continue clicked');
            if (typeof onNext === 'function') {
              onNext({});
            }
          }}
          size="lg"
          className="bg-gradient-to-r from-[#E4018B] to-[#7017C3] hover:opacity-90 text-white ml-auto"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}