import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X, AlertCircle } from 'lucide-react';
import { UserOnboarding } from '@/api/entities';
import { toast } from 'sonner';

export default function AgentDisclosureModal({ isOpen, onAccept, onDecline, userId }) {
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    if (!accepted) {
      toast.error("Please accept the terms to continue");
      return;
    }

    setSaving(true);
    try {
      const onboardings = await UserOnboarding.filter({ userId });
      if (onboardings.length > 0) {
        await UserOnboarding.update(onboardings[0].id, {
          disclosureAccepted: true,
          disclosureAcceptanceTimestamp: new Date().toISOString()
        });
      }
      onAccept();
    } catch (error) {
      console.error('Error saving disclosure acceptance:', error);
      toast.error('Failed to save acceptance');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full bg-white border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1E293B]">AI Agent Terms & Disclosure</h2>
          </div>
          <button onClick={onDecline} className="text-[#475569] hover:text-[#1E293B]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
            <h3 className="text-base font-semibold text-[#1E293B] mb-3">Important Information</h3>
            <div className="space-y-3 text-sm text-[#475569] leading-relaxed">
              <p>
                By using PULSE Intelligence AI Agents, you acknowledge and agree to the following:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The AI agent will make calls on your behalf using a dedicated phone number</li>
                <li>All calls are recorded and transcribed for quality and training purposes</li>
                <li>You are responsible for complying with all applicable telemarketing laws and regulations</li>
                <li>The AI agent uses advanced language models and may not be perfect in all scenarios</li>
                <li>You maintain full responsibility for the content and outcomes of all calls</li>
                <li>Usage is subject to your subscription plan's minute allowances</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={setAccepted}
            />
            <Label htmlFor="accept-terms" className="cursor-pointer text-sm text-[#475569] leading-relaxed">
              I have read and agree to the AI Agent terms and disclosures. I understand that I am responsible for compliance with all applicable laws and regulations.
            </Label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <Button variant="outline" onClick={onDecline}>
              Decline
            </Button>
            <Button onClick={handleAccept} disabled={!accepted || saving}>
              {saving ? 'Accepting...' : 'Accept & Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}