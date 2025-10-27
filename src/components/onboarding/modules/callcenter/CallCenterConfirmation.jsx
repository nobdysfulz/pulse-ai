import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Phone, Mic, Calendar, User } from 'lucide-react';

export default function CallCenterConfirmation({ data, allData, onNext, onBack }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E4018B] to-[#7017C3] flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-[#1E293B] mb-3">
          Call Center Setup Complete!
        </h2>
        <p className="text-[#64748B]">
          Your AI calling agent is ready to start reaching out
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] space-y-4 mb-8">
        <div className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-lg">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Phone className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-[#1E293B]">Phone Number</h4>
            <p className="text-sm text-[#64748B]">{allData.phone?.selectedNumber || 'Configured'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-lg">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Mic className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-[#1E293B]">Voice Selected</h4>
            <p className="text-sm text-[#64748B]">Ready for calls</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-lg">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <User className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-[#1E293B]">Caller Identity</h4>
            <p className="text-sm text-[#64748B]">
              {allData.identity?.agentName} from {allData.identity?.companyName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-lg">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-[#1E293B]">Google Calendar</h4>
            <p className="text-sm text-[#64748B]">Connected for scheduling</p>
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
          Finish Setup
        </Button>
      </div>
    </div>
  );
}