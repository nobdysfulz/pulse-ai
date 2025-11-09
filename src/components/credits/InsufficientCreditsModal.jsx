import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function InsufficientCreditsModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleViewPlans = () => {
    navigate(createPageUrl('Plans'));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full bg-white border border-[#E2E8F0]">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1E293B]">Insufficient Credits</h2>
          </div>
          <button onClick={onClose} className="text-[#475569] hover:text-[#1E293B]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <CardContent className="p-6">
          <p className="text-base text-[#475569] mb-6 leading-relaxed">
            You don't have enough credits to use this feature. Upgrade your plan to get more credits and unlock unlimited content generation, advanced AI tools, and more.
          </p>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Maybe Later
            </Button>
            <Button onClick={handleViewPlans} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}