import React, { useState, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { Button } from '@/components/ui/button';
import { UserGuidelines, UserOnboarding } from '@/api/entities';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import OnboardingWelcome from './OnboardingWelcome';
import EmailCategoriesStep from './EmailCategoriesStep';
import EmailStyleStep from './EmailStyleStep';
import AutoResponseStep from './AutoResponseStep';
import ContentThemesStep from './ContentThemesStep';
import TransactionPartiesStep from './TransactionPartiesStep';

export default function AgentOnboardingFlow({ onComplete }) {
  const { user } = useContext(UserContext);
  const [currentStep, setCurrentStep] = useState(0);
  const [guidelines, setGuidelines] = useState([]);
  const [saving, setSaving] = useState(false);

  const steps = [
    { component: OnboardingWelcome, title: "Welcome", agent: null },
    { component: EmailCategoriesStep, title: "Email Categories", agent: "executive_assistant" },
    { component: EmailStyleStep, title: "Email Style", agent: "executive_assistant" },
    { component: AutoResponseStep, title: "Auto-Responses", agent: "executive_assistant" },
    { component: ContentThemesStep, title: "Content Themes", agent: "content_agent" },
    { component: TransactionPartiesStep, title: "Transaction Parties", agent: "transaction_coordinator" }
  ];

  const saveGuidelines = async (newGuidelines) => {
    setGuidelines(newGuidelines);
  };

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      for (const guideline of guidelines) {
        await UserGuidelines.create({
          userId: user.id,
          agentType: guideline.agentType,
          guidelineCategory: guideline.guidelineCategory,
          guidelineText: guideline.guidelineText,
          guidelineType: guideline.guidelineType
        });
      }

      const existingOnboarding = await UserOnboarding.filter({ userId: user.id });
      if (existingOnboarding.length > 0) {
        await UserOnboarding.update(existingOnboarding[0].id, {
          completedSteps: steps.map(s => s.title),
          agentOnboardingCompleted: true,
          onboardingCompletionDate: new Date().toISOString()
        });
      } else {
        await UserOnboarding.create({
          userId: user.id,
          completedSteps: steps.map(s => s.title),
          agentOnboardingCompleted: true,
          onboardingCompletionDate: new Date().toISOString()
        });
      }

      toast.success("AI Agents setup complete!");
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error("Failed to save onboarding settings");
    } finally {
      setSaving(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const currentStepGuidelines = guidelines.filter(g => 
    !steps[currentStep].agent || g.agentType === steps[currentStep].agent
  );

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div className="border-b border-[#E2E8F0] p-6 bg-white">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-[#1E293B]">Setup Your AI Assistants</h2>
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-[#7C3AED]' : 'bg-[#E2E8F0]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto bg-[#F8FAFC]">
        <CurrentStepComponent
          guidelines={currentStepGuidelines}
          onUpdate={(newGuidelines) => {
            const otherGuidelines = guidelines.filter(g => 
              steps[currentStep].agent && g.agentType !== steps[currentStep].agent
            );
            saveGuidelines([...otherGuidelines, ...newGuidelines]);
          }}
        />
      </div>

      <div className="border-t border-[#E2E8F0] p-6 bg-white">
        <div className="flex justify-between max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
          >
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={completeOnboarding}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              Finish Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}