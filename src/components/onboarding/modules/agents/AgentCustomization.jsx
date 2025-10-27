import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function AgentCustomization({ data, onNext, onBack }) {
  const [formData, setFormData] = useState({
    executiveNotes: data.executiveNotes || '',
    contentNotes: data.contentNotes || '',
    transactionNotes: data.transactionNotes || '',
    leadsNotes: data.leadsNotes || ''
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1E293B] mb-3">
          Customize Your Agents
        </h2>
        <p className="text-[#64748B]">
          Add special instructions for each AI agent (optional)
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] space-y-6 mb-8">
        <div>
          <Label htmlFor="executiveNotes">NOVA - Executive Assistant</Label>
          <Textarea
            id="executiveNotes"
            value={formData.executiveNotes}
            onChange={(e) => setFormData({ ...formData, executiveNotes: e.target.value })}
            placeholder="e.g., Always cc my assistant on calendar invites..."
            className="mt-2 h-24"
          />
        </div>

        <div>
          <Label htmlFor="contentNotes">SIRIUS - Content Agent</Label>
          <Textarea
            id="contentNotes"
            value={formData.contentNotes}
            onChange={(e) => setFormData({ ...formData, contentNotes: e.target.value })}
            placeholder="e.g., Focus on luxury properties, avoid emojis..."
            className="mt-2 h-24"
          />
        </div>

        <div>
          <Label htmlFor="transactionNotes">VEGA - Transaction Coordinator</Label>
          <Textarea
            id="transactionNotes"
            value={formData.transactionNotes}
            onChange={(e) => setFormData({ ...formData, transactionNotes: e.target.value })}
            placeholder="e.g., Always notify me 3 days before deadlines..."
            className="mt-2 h-24"
          />
        </div>

        <div>
          <Label htmlFor="leadsNotes">PHOENIX - Leads Agent</Label>
          <Textarea
            id="leadsNotes"
            value={formData.leadsNotes}
            onChange={(e) => setFormData({ ...formData, leadsNotes: e.target.value })}
            placeholder="e.g., Only call leads between 10am-5pm..."
            className="mt-2 h-24"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button
          onClick={() => onNext(formData)}
          size="lg"
          className="bg-gradient-to-r from-[#E4018B] to-[#7017C3] hover:opacity-90 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}