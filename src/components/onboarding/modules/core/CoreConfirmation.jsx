import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserOnboarding } from '@/api/entities';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CoreConfirmation({ data, onNext, allData }) {
  const [completing, setCompleting] = useState(false);
  const navigate = useNavigate();

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update User metadata with full name
      if (allData?.welcome?.firstName && allData?.welcome?.lastName) {
        await supabase.auth.updateUser({
          data: {
            firstName: allData.welcome.firstName,
            lastName: allData.welcome.lastName,
            full_name: `${allData.welcome.firstName} ${allData.welcome.lastName}`
          }
        });
      }

      // Core completion is handled by TierAwareOnboarding's completeModule
      // which sets onboarding_completion_date
      toast.success('Onboarding completed successfully!');
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate(createPageUrl('Dashboard'));
      }, 500);
    } catch (error) {
      console.error('[CoreConfirmation] Error completing:', error);
      toast.error('Failed to complete onboarding. Please try again.');
      setCompleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-[#1E293B] mb-3">You're All Set!</h2>
        <p className="text-lg text-[#64748B]">
          Your core profile is complete. Let's get you started with PULSE AI.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 mb-6">
        <h3 className="text-xl font-semibold text-[#1E293B] mb-4">What's Next?</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#7C3AED] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-[#1E293B]">Set Your Production Goals</h4>
              <p className="text-sm text-[#64748B]">Complete the 12-Month Production Planner to activate your personalized action plan</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#7C3AED] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-[#1E293B]">Generate Your Daily Tasks</h4>
              <p className="text-sm text-[#64748B]">Let AI create your personalized daily action items based on your goals</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#7C3AED] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-[#1E293B]">Track Your PULSE Score</h4>
              <p className="text-sm text-[#64748B]">Monitor your daily performance and watch your score improve</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#7C3AED] to-[#6366F1] rounded-xl p-8 text-white mb-6">
        <h3 className="text-xl font-semibold mb-2">Optional: Upgrade to Pro</h3>
        <p className="text-white/90 mb-4">
          Unlock AI Agents, advanced analytics, and priority support for just $49/month
        </p>
        <Button variant="secondary" className="bg-white text-[#7C3AED] hover:bg-white/90">
          View Plans
        </Button>
      </div>

      <Button
        onClick={handleComplete}
        className="w-full"
        disabled={completing}
        size="lg"
      >
        {completing ? 'Completing...' : 'Go to Dashboard'}
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );
}