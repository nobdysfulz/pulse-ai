import React, { useContext, useMemo } from 'react';
import { UserContext } from '../context/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, Circle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deriveSetupGroups } from '@/components/onboarding/onboardingLogic';
import { createPageUrl } from '@/utils';

const SetupStepItem = ({ step, status, onClick }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'current':
        return <Circle className="w-5 h-5 text-[#7C3AED] fill-current" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Complete</Badge>;
      case 'current':
        return <Badge className="bg-[#7C3AED] text-white hover:bg-[#7C3AED]">In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
      case 'locked':
        return <Badge variant="outline" className="text-muted-foreground">Locked</Badge>;
      default:
        return null;
    }
  };

  const isClickable = status !== 'locked';

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
        isClickable
          ? 'hover:border-[#7C3AED] hover:shadow-sm cursor-pointer'
          : 'cursor-not-allowed opacity-60'
      } ${status === 'current' ? 'border-[#7C3AED] bg-[#7C3AED]/5' : 'border-border bg-card'}`}
    >
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="text-left">
          <h4 className="font-medium text-[#1E293B]">{step.title}</h4>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge()}
        {isClickable && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
      </div>
    </button>
  );
};

export default function SetupProgressTab() {
  const { user, onboarding, loading } = useContext(UserContext);
  const navigate = useNavigate();

  const setupSteps = useMemo(() => {
    if (!user || !onboarding) return { core: [], agents: [], callcenter: [], journey: null };
    return deriveSetupGroups({ user, onboarding });
  }, [user, onboarding]);

  const getStepStatus = (step, moduleSteps) => {
    if (step.completed) return 'completed';
    if (step.locked) return 'locked';
    
    // Check if this is the next pending step
    const currentModuleIndex = moduleSteps.findIndex(s => !s.completed && !s.locked);
    if (currentModuleIndex >= 0 && moduleSteps[currentModuleIndex].id === step.id) {
      return 'current';
    }
    
    return 'pending';
  };

  const calculateProgress = () => {
    const allSteps = [...setupSteps.core, ...setupSteps.agents, ...setupSteps.callcenter];
    const completed = allSteps.filter(s => s.completed).length;
    const total = allSteps.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleStepClick = (step) => {
    navigate(step.path);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading setup progress...</p>
        </CardContent>
      </Card>
    );
  }

  const progress = calculateProgress();
  const allComplete = progress === 100;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Progress</CardTitle>
          <CardDescription>
            {allComplete
              ? 'Congratulations! You\'ve completed all setup steps.'
              : 'Complete these steps to unlock all PULSE AI features'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Core Setup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Core Setup
            <Badge variant="outline" className="ml-auto">Required for All Users</Badge>
          </CardTitle>
          <CardDescription>
            Essential setup to get started with PULSE AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {setupSteps.core.map((step) => (
            <SetupStepItem
              key={step.id}
              step={step}
              status={getStepStatus(step, setupSteps.core)}
              onClick={() => handleStepClick(step)}
            />
          ))}
        </CardContent>
      </Card>

      {/* AI Agent Setup Section */}
      {setupSteps.agents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              AI Agent Setup
              <Badge variant="outline" className="ml-auto">Accelerator Plan</Badge>
            </CardTitle>
            <CardDescription>
              Configure your AI assistant team (NOVA, SIRIUS, VEGA, PHOENIX)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {setupSteps.agents.map((step) => (
              <SetupStepItem
                key={step.id}
                step={step}
                status={getStepStatus(step, setupSteps.agents)}
                onClick={() => handleStepClick(step)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Calling Setup Section */}
      {setupSteps.callcenter.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              AI Calling Setup
              <Badge variant="outline" className="ml-auto">AI Appointment Setter Add-on</Badge>
            </CardTitle>
            <CardDescription>
              Set up your AI calling agent for outbound prospecting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {setupSteps.callcenter.map((step) => (
              <SetupStepItem
                key={step.id}
                step={step}
                status={getStepStatus(step, setupSteps.callcenter)}
                onClick={() => handleStepClick(step)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {allComplete && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">All Set!</h3>
                <p className="text-sm text-green-700">
                  You've completed all setup steps. You're ready to use all PULSE AI features.
                </p>
              </div>
              <Button
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="ml-auto"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
