import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Play } from 'lucide-react';

export default function WelcomeVideoModal({ isOpen, onDismiss }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full bg-white border border-[#E2E8F0]">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
              <Play className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1E293B]">Welcome to PULSE Intelligence</h2>
          </div>
          <button onClick={onDismiss} className="text-[#475569] hover:text-[#1E293B]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <CardContent className="p-6">
          <div className="aspect-video bg-[#F8FAFC] rounded-lg flex items-center justify-center mb-6 border border-[#E2E8F0]">
            <div className="text-center">
              <Play className="w-16 h-16 text-[#7C3AED] mx-auto mb-4" />
              <p className="text-base text-[#475569]">Welcome Video</p>
              <p className="text-sm text-[#64748B] mt-1">Video player will be embedded here</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[#1E293B] mb-2">Get Started with PULSE</h3>
              <p className="text-base text-[#475569] leading-relaxed">
                Welcome to your AI-powered real estate business intelligence platform. This quick video will show you how to:
              </p>
            </div>

            <ul className="space-y-2 text-sm text-[#475569] ml-4">
              <li className="flex items-start gap-2">
                <span className="text-[#7C3AED] mt-0.5">•</span>
                <span>Set up your business goals and production targets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7C3AED] mt-0.5">•</span>
                <span>Navigate your daily action plan and PULSE intelligence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7C3AED] mt-0.5">•</span>
                <span>Use AI-powered content creation and market analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7C3AED] mt-0.5">•</span>
                <span>Practice objection handling with role-play scenarios</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[#E2E8F0] mt-6">
            <Button variant="outline" onClick={onDismiss}>
              Skip for Now
            </Button>
            <Button onClick={onDismiss}>
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}