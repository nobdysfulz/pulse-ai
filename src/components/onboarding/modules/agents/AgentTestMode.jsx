import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, FileText, Phone } from 'lucide-react';

export default function AgentTestMode({ onNext, onBack }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1E293B] mb-3">
          Ready to Test Your AI Team
        </h2>
        <p className="text-[#64748B]">
          Your agents are configured and ready to assist you
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] mb-8">
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-[#F8FAFC] rounded-lg">
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <h4 className="font-semibold text-[#1E293B] mb-1">Chat with Your Agents</h4>
              <p className="text-sm text-[#64748B]">Visit the Agents page to start conversations</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-[#F8FAFC] rounded-lg">
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <h4 className="font-semibold text-[#1E293B] mb-1">Connected Services</h4>
              <p className="text-sm text-[#64748B]">Your agents can now access your connected tools</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-[#F8FAFC] rounded-lg">
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <h4 className="font-semibold text-[#1E293B] mb-1">Guidelines Active</h4>
              <p className="text-sm text-[#64748B]">Your custom preferences are being followed</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-[#F8FAFC] rounded-lg">
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <h4 className="font-semibold text-[#1E293B] mb-1">Voice Calling Ready</h4>
              <p className="text-sm text-[#64748B]">PHOENIX can start making calls for you</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button
          onClick={() => onNext({})}
          size="lg"
          className="bg-gradient-to-r from-[#E4018B] to-[#7017C3] hover:opacity-90 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}