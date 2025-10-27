import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

export default function TransactionPartiesStep({ guidelines, onUpdate }) {
  const presetParties = [
    "Buyers/Sellers",
    "Lenders/Mortgage Brokers",
    "Title/Escrow Companies",
    "Other Agents",
    "Inspectors",
    "Appraisers",
    "Attorneys",
    "Insurance Agents"
  ];

  const [customParty, setCustomParty] = useState("");

  const toggleParty = (party) => {
    const exists = guidelines.some(g => g.guidelineText === party);
    if (exists) {
      onUpdate(guidelines.filter(g => g.guidelineText !== party));
    } else {
      onUpdate([...guidelines, {
        agentType: 'transaction_coordinator',
        guidelineCategory: 'communication_parties',
        guidelineText: party,
        guidelineType: 'preset'
      }]);
    }
  };

  const addCustomParty = () => {
    if (customParty.trim()) {
      onUpdate([...guidelines, {
        agentType: 'transaction_coordinator',
        guidelineCategory: 'communication_parties',
        guidelineText: customParty.trim(),
        guidelineType: 'custom'
      }]);
      setCustomParty("");
    }
  };

  const isSelected = (party) => guidelines.some(g => g.guidelineText === party);

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-2xl font-semibold text-[#1E293B] mb-2">Who should I communicate with during transactions?</h3>
      <p className="text-sm text-[#64748B] mb-6">Select the parties you typically coordinate with</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {presetParties.map(party => (
          <button
            key={party}
            onClick={() => toggleParty(party)}
            className={`p-3 border rounded-lg text-left transition-colors ${
              isSelected(party)
                ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#7C3AED]'
            }`}
          >
            <span className="flex items-center justify-between">
              {party}
              {isSelected(party) && <X className="w-4 h-4" />}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          value={customParty}
          onChange={(e) => setCustomParty(e.target.value)}
          placeholder="Add other party..."
          onKeyPress={(e) => e.key === 'Enter' && addCustomParty()}
        />
        <Button onClick={addCustomParty} variant="outline">
          Add
        </Button>
      </div>
    </div>
  );
}