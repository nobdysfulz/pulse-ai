import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function CallerIdentitySetup({ data, onNext, onBack }) {
  const [formData, setFormData] = useState({
    agentName: data.agentName || '',
    companyName: data.companyName || '',
    greeting: data.greeting || '',
    specialInstructions: data.specialInstructions || ''
  });

  const handleContinue = () => {
    if (!formData.agentName || !formData.companyName) {
      toast.error('Please fill in agent name and company name');
      return;
    }
    onNext(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1E293B] mb-3">
          Set Up Caller Identity
        </h2>
        <p className="text-[#64748B]">
          Customize how your AI agent introduces itself
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] space-y-6 mb-8">
        <div>
          <Label htmlFor="agentName">Agent Name *</Label>
          <Input
            id="agentName"
            value={formData.agentName}
            onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
            placeholder="e.g., Sarah"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="e.g., Smith Realty"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="greeting">Custom Greeting (Optional)</Label>
          <Textarea
            id="greeting"
            value={formData.greeting}
            onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
            placeholder="e.g., Hi, this is Sarah calling from Smith Realty..."
            className="mt-2 h-24"
          />
        </div>

        <div>
          <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
          <Textarea
            id="specialInstructions"
            value={formData.specialInstructions}
            onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
            placeholder="e.g., Always mention our 5-star reviews, avoid calling before 9am..."
            className="mt-2 h-24"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          size="lg"
          className="bg-gradient-to-r from-[#E4018B] to-[#7017C3] hover:opacity-90 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}