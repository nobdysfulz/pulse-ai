import React, { useState, useEffect, useContext, useMemo } from 'react';
import { UserContext } from '../context/UserContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@clerk/clerk-react';
import { UserOnboarding } from '@/api/entities';
import OnboardingSidebar from './OnboardingSidebar';
import {
  buildActiveModules,
  determineInitialPhase,
  normalizeOnboardingProgress
} from './onboardingLogic';

// Core Module Components
import WelcomeStep from './modules/core/WelcomeStep';
import MarketBusinessSetup from './modules/core/MarketBusinessSetup';
import BrandPreferencesSetup from './modules/core/BrandPreferencesSetup';
import CoreConfirmation from './modules/core/CoreConfirmation';

// Agents Module Components
import AITeamIntro from './modules/agents/AITeamIntro';
import IntegrationsSetup from './modules/agents/IntegrationsSetup';
import AgentCustomization from './modules/agents/AgentCustomization';
import AgentTestMode from './modules/agents/AgentTestMode';

// Call Center Module Components
import PhoneNumberSetup from './modules/callcenter/PhoneNumberSetup';
import VoiceSelection from './modules/callcenter/VoiceSelection';
import CallerIdentitySetup from './modules/callcenter/CallerIdentitySetup';
import GoogleWorkspaceSetup from './modules/callcenter/GoogleWorkspaceSetup';
import CallCenterConfirmation from './modules/callcenter/CallCenterConfirmation';

const MODULES = {
  core: {
    title: 'Core Setup',
    steps: [
      { id: 'welcome', component: WelcomeStep, title: 'Welcome' },
      { id: 'market', component: MarketBusinessSetup, title: 'Business & Market' },
      { id: 'preferences', component: BrandPreferencesSetup, title: 'Preferences' },
      { id: 'core-confirm', component: CoreConfirmation, title: 'Review' }
    ],
    postModuleRedirect: 'IntelligenceSurvey'
  },
  agents: {
    title: 'AI Agents',
    steps: [
      { id: 'ai-team-intro', component: AITeamIntro, title: 'Meet Your Team' },
      { id: 'integrations', component: IntegrationsSetup, title: 'Connect Services' },
      { id: 'customization', component: AgentCustomization, title: 'Customize' },
      { id: 'test', component: AgentTestMode, title: 'Test Mode' }
    ]
  },
  callcenter: {
    title: 'Call Center',
    steps: [
      { id: 'phone', component: PhoneNumberSetup, title: 'Phone Number' },
      { id: 'voice', component: VoiceSelection, title: 'Voice Selection' },
      { id: 'identity', component: CallerIdentitySetup, title: 'Caller Identity' },
      { id: 'workspace', component: GoogleWorkspaceSetup, title: 'Google Workspace' },
      { id: 'call-confirm', component: CallCenterConfirmation, title: 'Launch' }
    ]
  }
};

// Error Boundary Component
class OnboardingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 Onboarding Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFEFE] to-[#F8FAFC]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#1E293B] mb-4">Something went wrong</h2>
            <p className="text-[#64748B] mb-4">Please refresh the page and try again.</p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper to interact with user_onboarding table using entity API
const getUserOnboarding = async (userId, token) => {
  try {
    const results = await UserOnboarding.filter({ userId }, '-created_at', token);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('[getUserOnboarding] Error:', error);
    return null;
  }
};

function TierAwareOnboarding({ initialPhase = 'core' }) {
  const { user, onboarding: onboardingContext, refreshUserData } = useContext(UserContext);
  const { getToken } = useAuth();
  const [currentPhase, setCurrentPhase] = useState(initialPhase);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState({});
  const [activeModules, setActiveModules] = useState(['core']);
  const navigate = useNavigate();

  const userTier = user?.subscriptionTier || '';
  const hasCallCenter = user?.hasCallCenterAddon || false;

  const validateModuleTransition = (currentMod, nextMod) => {
    const validTransitions = {
      core: ['agents', 'callcenter'],
      agents: ['callcenter'],
      callcenter: []
    };
    return validTransitions[currentMod]?.includes(nextMod) ?? false;
  };

  useEffect(() => {
    if (user?.id) {
      const modules = buildActiveModules({
        subscriptionTier: userTier,
        hasCallCenterAddon: hasCallCenter
      });
      console.log('🔄 Setting active modules:', modules);
      setActiveModules(modules);
    }
  }, [user?.id, userTier, hasCallCenter]);

  useEffect(() => {
    if (activeModules.length > 0 && user?.id) {
      loadOnboardingProgress();
    }
  }, [activeModules, user?.id]);

  const loadOnboardingProgress = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        console.error('No user ID available');
        setLoading(false);
        return;
      }

      let progress = onboardingContext;

      try {
        const token = await getToken();
        const onboardingData = await getUserOnboarding(user.id, token);
        if (onboardingData) {
          progress = normalizeOnboardingProgress(onboardingData);
        }
      } catch (error) {
        console.error('Error fetching onboarding:', error);
        if (!onboardingContext) {
          throw new Error('Onboarding service is not available');
        }
      }

      const normalizedProgress = normalizeOnboardingProgress(progress) || null;

      if (normalizedProgress?.completedSteps) {
        setCompletedSteps(new Set(normalizedProgress.completedSteps));
      }

      const { phase } = determineInitialPhase(normalizedProgress, activeModules);

      if (phase) {
        console.log(`🚀 Starting ${phase} module`);
        setCurrentPhase(phase);
        setCurrentStep(0);
      } else if (normalizedProgress) {
        console.log('🎉 All required onboarding modules completed - redirecting to dashboard');
        toast.success('Onboarding complete! Welcome to PULSE AI.');
        navigate(createPageUrl('Dashboard'));
        return;
      } else {
        console.log('🆕 No onboarding record - starting fresh at core');
        setCurrentPhase('core');
        setCurrentStep(0);
      }
    } catch (error) {
      console.error('❌ Error loading onboarding progress:', error);
      toast.error('Failed to load onboarding progress');
      setCurrentPhase('core');
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async (stepData) => {
    try {
      if (!currentPhase || !MODULES[currentPhase]) {
        throw new Error(`Invalid phase: ${currentPhase}`);
      }

      const currentModuleObj = MODULES[currentPhase];
      const currentStepObj = currentModuleObj.steps[currentStep];
      
      if (!currentStepObj) {
        throw new Error(`Invalid step: ${currentStep}`);
      }
      
      setOnboardingData(prev => ({
        ...prev,
        [currentStepObj.id]: stepData
      }));
      
      const newCompleted = new Set(completedSteps);
      newCompleted.add(currentStepObj.id);
      setCompletedSteps(newCompleted);
      
      // Save progress to database via backend function
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Failed to get authentication token');
        }

        const { error } = await supabase.functions.invoke(
          'saveOnboardingProgress',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: {
              progressData: {
                completed_steps: Array.from(newCompleted),
              },
            },
          }
        );
        
        if (error) {
          console.error('❌ Failed to save progress:', error);
          toast.error('Failed to save progress. Please try again.');
          return; // Don't proceed if save fails
        }
        
        console.log(`✅ Progress saved for step: ${currentStepObj.id}`);
      } catch (saveError) {
        console.error('❌ Failed to save progress:', saveError);
        toast.error('Failed to save progress. Please try again.');
        return; // Don't proceed if save fails
      }
      
      if (currentStep < currentModuleObj.steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Module is complete
        await completeModule(currentPhase);
        await refreshUserData();

        // Logic for module transitions
        if (currentPhase === 'core') {
          // Core complete - redirect to Intelligence Survey if not completed
          const token = await getToken();
          const onboardingData = await getUserOnboarding(user.id, token);
          const normalizedData = normalizeOnboardingProgress(onboardingData);
          
          if (!normalizedData?.agentIntelligenceCompleted) {
            toast.success('Core setup complete! Please complete the Intelligence Survey.');
            navigate(createPageUrl('IntelligenceSurvey'));
            return;
          }
          
          const isSubscriber = user?.subscriptionTier === 'Subscriber' || user?.subscriptionTier === 'Admin';
          if (isSubscriber && activeModules.includes('agents')) {
            setCurrentPhase('agents');
            setCurrentStep(0);
          } else {
            toast.success('Core onboarding complete! Welcome to PULSE AI.');
            navigate(createPageUrl('Dashboard'));
          }
        } else if (currentPhase === 'agents') {
          if (activeModules.includes('callcenter')) {
            setCurrentPhase('callcenter');
            setCurrentStep(0);
          } else {
            toast.success('AI Agents setup complete!');
            navigate(createPageUrl('Dashboard'));
          }
        } else if (currentPhase === 'callcenter') {
          toast.success('Call Center setup complete!');
          navigate(createPageUrl('Dashboard'));
        } else {
          console.warn(`Unexpected module completion: ${currentPhase}`);
          navigate(createPageUrl('Dashboard'));
        }
      }
    } catch (error) {
      console.error('❌ Error in handleNext:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      const currentModuleIndex = activeModules.indexOf(currentPhase);
      if (currentModuleIndex > 0) {
        const previousModule = activeModules[currentModuleIndex - 1];
        setCurrentPhase(previousModule);
        setCurrentStep(MODULES[previousModule].steps.length - 1);
      }
    }
  };

  const completeModule = async (moduleKey) => {
    try {
      console.log(`🎯 Completing module: ${moduleKey}`);
      
      const token = await getToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      const updates = {};
      
      if (moduleKey === 'core') {
        updates.onboarding_completion_date = new Date().toISOString();
      } else if (moduleKey === 'agents') {
        updates.agent_onboarding_completed = true;
      }
      // Note: callcenter completion is tracked via completed_steps only
      
      const { error } = await supabase.functions.invoke(
        'saveOnboardingProgress',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: {
            progressData: updates,
          },
        }
      );
      
      if (error) {
        console.error(`❌ Error completing module ${moduleKey}:`, error);
        throw error;
      }
      
      console.log(`✅ Module ${moduleKey} marked as complete`);
      toast.success(`${MODULES[moduleKey].title} complete!`);
    } catch (error) {
      console.error(`❌ Error completing module ${moduleKey}:`, error);
      toast.error(`Failed to save completion status`);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFEFE] to-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
          <span className="text-[#64748B]">Loading onboarding...</span>
        </div>
      </div>
    );
  }

  const currentModuleObj = MODULES[currentPhase];
  
  if (!currentModuleObj) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Invalid module: {currentPhase}</p>
          <Button onClick={() => { setCurrentPhase('core'); setCurrentStep(0); }}>
            Return to start
          </Button>
        </div>
      </div>
    );
  }

  const currentStepComp = currentModuleObj.steps[currentStep];
  
  if (!currentStepComp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Invalid step</p>
          <Button onClick={() => setCurrentStep(0)}>Return to start of module</Button>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = currentStepComp.component;
  
  if (!CurrentStepComponent || typeof CurrentStepComponent !== 'function') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Component failed to load</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#FEFEFE] to-[#F8FAFC]">
      <OnboardingSidebar
        activeModules={activeModules}
        currentModule={currentPhase}
        currentStepIndex={currentStep}
        completedSteps={completedSteps}
        onStepClick={(moduleKey, stepIndex) => {
          setCurrentPhase(moduleKey);
          setCurrentStep(stepIndex);
        }}
        moduleSteps={MODULES}
      />

      <div className="flex-1 overflow-y-auto p-12">
        <div className="max-w-4xl mx-auto">
          <CurrentStepComponent
            data={onboardingData[currentStepComp.id] || {}}
            onNext={handleNext}
            onBack={currentStep > 0 || activeModules.indexOf(currentPhase) > 0 ? handleBack : null}
            allData={onboardingData}
          />
        </div>
      </div>
    </div>
  );
}

export default function OnboardingWithErrorBoundary(props) {
  return (
    <OnboardingErrorBoundary>
      <TierAwareOnboarding {...props} />
    </OnboardingErrorBoundary>
  );
}