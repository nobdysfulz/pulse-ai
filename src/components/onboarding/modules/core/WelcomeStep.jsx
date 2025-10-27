import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function WelcomeStep({ onNext }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E4018B] to-[#7017C3] flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-4xl font-bold text-[#1E293B] mb-4">
        Welcome to PULSE AI
      </h1>
      
      <p className="text-lg text-[#475569] mb-8">
        Let's get you set up with your AI-powered real estate business platform
      </p>

      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] mb-8 text-left">
        <h3 className="text-xl font-semibold text-[#1E293B] mb-4">What we'll set up:</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#7C3AED] text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium text-[#1E293B]">Your Profile & Market</p>
              <p className="text-sm text-[#64748B]">Set up your business information and target market</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#7C3AED] text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium text-[#1E293B]">Preferences & Goals</p>
              <p className="text-sm text-[#64748B]">Customize your experience and set your targets</p>
            </div>
          </li>
        </ul>
      </div>

      <Button 
        onClick={() => onNext({})}
        size="lg"
        className="bg-gradient-to-r from-[#E4018B] to-[#7017C3] hover:opacity-90 text-white px-12"
      >
        Let's Get Started
      </Button>

      <p className="text-xs text-[#94A3B8] mt-6">
        This will only take a few minutes
      </p>
    </div>
  );
}