
import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { UserOnboarding, UserMarketConfig, UserPreferences } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import MarketConfigForm from '../market/MarketConfigForm';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

// Helper function to create page URLs.
// This function is assumed to exist in the application. For a functional file,
// we define a basic version here or assume it's imported from a utility file.
const createPageUrl = (pageName) => {
  switch (pageName) {
    case 'Dashboard':
      return '/dashboard';
    // Add other cases as needed for other page names
    default:
      return `/${pageName.toLowerCase()}`;
  }
};

export default function OnboardingFlow({ isOpen, onComplete }) {
  const { user, refreshUserData } = useContext(UserContext);
  const navigate = useNavigate(); // Initialize useNavigate hook
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // primaryTerritory, state, city are now managed by MarketConfigForm
    coachingStyle: 'balanced',
    activityMode: 'get_moving'
  });

  const steps = [
    {
      id: 'profile',
      title: 'Get Started',
      description: 'We just need a few details to tailor your experience.',
      component: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#7C3AED]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B] mb-2">Welcome Aboard!</h3>
            <p className="text-sm text-[#475569]">Let's set up your profile for a personalized experience.</p>
          </div>
          {/* No specific form fields are requested for the profile step in the outline, keeping it as a welcome. */}
        </div>
      )
    },
    {
      id: 'market',
      title: 'Define Your Market Area',
      description: 'Help us understand your primary territory so we can provide hyper-local market intelligence.',
      component: (
        <div className="space-y-6">
          <MarketConfigForm
            userId={user?.id} // Pass userId to the MarketConfigForm
            onSaveComplete={async () => {
              try {
                // Mark market setup as complete in UserOnboarding
                const currentOnboardings = await UserOnboarding.filter({ userId: user.id });
                if (currentOnboardings.length > 0) {
                  await UserOnboarding.update(currentOnboardings[0].id, {
                    marketSetupCompleted: true,
                    marketCompletionDate: new Date().toISOString()
                  });
                } else {
                  // If no onboarding record exists, create one with market info
                  await UserOnboarding.create({
                    userId: user.id,
                    marketSetupCompleted: true,
                    marketCompletionDate: new Date().toISOString(),
                    preferencesCompleted: false // Default for other steps
                  });
                }
                toast.success('Market setup complete!');
                await refreshUserData(); // Refresh user context to get updated onboarding status
                handleNext(); // Move to the next step
              } catch (error) {
                console.error('Error marking market setup complete:', error);
                toast.error('Failed to mark market setup as complete.');
              }
            }}
          />
        </div>
      )
    },
    {
      id: 'coachingStyle',
      title: 'Coaching Style',
      description: 'How would you like PULSE to coach you?',
      component: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#7C3AED]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B] mb-2">Coaching Style</h3>
            <p className="text-sm text-[#475569]">How would you like PULSE to coach you?</p>
          </div>

          <div className="space-y-3">
            {[
              { value: 'supportive', label: 'Supportive', desc: 'Gentle encouragement and positive reinforcement' },
              { value: 'balanced', label: 'Balanced', desc: 'Mix of support and accountability' },
              { value: 'direct', label: 'Direct', desc: 'Straightforward feedback and challenges' }
            ].map((style) => (
              <button
                key={style.value}
                onClick={() => setFormData({ ...formData, coachingStyle: style.value })}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  formData.coachingStyle === style.value
                    ? 'border-[#7C3AED] bg-[#F8FAFC]'
                    : 'border-[#E2E8F0] hover:border-[#7C3AED]/50'
                }`}
              >
                <div className="font-medium text-[#1E293B]">{style.label}</div>
                <div className="text-sm text-[#475569] mt-1">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'activityLevel',
      title: 'Activity Level',
      description: 'How many daily tasks would you like?',
      component: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#7C3AED]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B] mb-2">Activity Level</h3>
            <p className="text-sm text-[#475569]">How many daily tasks would you like?</p>
          </div>

          <div className="space-y-3">
            {[
              { value: 'get_moving', label: 'Get Moving', desc: '3-5 tasks per day' },
              { value: 'building_momentum', label: 'Building Momentum', desc: '5-7 tasks per day' },
              { value: 'do_the_most', label: 'Do The Most', desc: '7-10 tasks per day' },
              { value: 'tried_it_all', label: 'Tried It All', desc: '10+ tasks per day' }
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => setFormData({ ...formData, activityMode: mode.value })}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  formData.activityMode === mode.value
                    ? 'border-[#7C3AED] bg-[#F8FAFC]'
                    : 'border-[#E2E8F0] hover:border-[#7C3AED]/50'
                }`}
              >
                <div className="font-medium text-[#1E293B]">{mode.label}</div>
                <div className="text-sm text-[#475569] mt-1">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )
    }
  ];

  const totalSteps = steps.length;

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // If it's the last step (preferences), then handle completion fully
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Market config saving and its completion status are handled by MarketConfigForm
      // This `handleComplete` is primarily for the final 'preferences' step and overall flow completion.

      // Save preferences
      const preferences = await UserPreferences.filter({ userId: user.id });
      if (preferences.length > 0) {
        await UserPreferences.update(preferences[0].id, {
          coachingStyle: formData.coachingStyle,
          activityMode: formData.activityMode
        });
      } else {
        await UserPreferences.create({
          userId: user.id,
          coachingStyle: formData.coachingStyle,
          activityMode: formData.activityMode
        });
      }

      // Update onboarding status for preferences completion AND overall onboarding completion
      const onboardings = await UserOnboarding.filter({ userId: user.id });
      if (onboardings.length > 0) {
        await UserOnboarding.update(onboardings[0].id, {
          preferencesCompleted: true,
          preferencesCompletionDate: new Date().toISOString(),
          onboardingCompleted: true, // Mark overall onboarding as completed
          onboardingCompletionDate: new Date().toISOString() // Set overall completion date
          // marketSetupCompleted and marketCompletionDate should already be set by MarketConfigForm's onSaveComplete
        });
      } else {
        // Fallback: If no onboarding record exists by this point, create one with preferences completed
        await UserOnboarding.create({
          userId: user.id,
          preferencesCompleted: true,
          preferencesCompletionDate: new Date().toISOString(),
          onboardingCompleted: true, // Mark overall onboarding as completed
          onboardingCompletionDate: new Date().toISOString(), // Set overall completion date
          marketSetupCompleted: false // Default to false, as MarketConfigForm would handle this
        });
      }

      toast.success('Onboarding completed!'); // Changed toast message
      await refreshUserData(); // Ensure user context is up-to-date
      // Replace onComplete() with navigation to Dashboard
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding.'); // Changed toast message
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentStepData = steps[step - 1];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full bg-white border border-[#E2E8F0]">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Welcome to PULSE Intelligence</h2>
            <p className="text-sm text-[#475569] mt-1">Let's get you set up in a few quick steps</p>
          </div>
          <button onClick={() => navigate(createPageUrl('Dashboard'))} className="text-[#475569] hover:text-[#1E293B]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="p-6 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#475569]">Step {step} of {totalSteps}</span>
            <span className="text-sm font-medium text-[#7C3AED]">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-[#E2E8F0] rounded-full h-2">
            <div
              className="bg-[#7C3AED] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <CardContent className="p-6">
          {currentStepData && currentStepData.component}
        </CardContent>

        <div className="flex items-center justify-between p-6 border-t border-[#E2E8F0]">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || saving}
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={saving}
          >
            {step === totalSteps ? (saving ? 'Saving...' : 'Complete Setup') : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
