import React from 'react';
import { Check, Circle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OnboardingSidebar({ 
  activeModules, 
  currentModule, 
  currentStepIndex, 
  completedSteps,
  onStepClick,
  moduleSteps 
}) {
  const getStepStatus = (moduleKey, stepIndex, stepId) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (moduleKey === currentModule && stepIndex === currentStepIndex) return 'current';
    
    // Check if step is accessible (previous step in same module is completed, or it's the first step)
    if (moduleKey === currentModule) {
      if (stepIndex === 0) return 'accessible';
      const previousStepId = moduleSteps[moduleKey].steps[stepIndex - 1].id;
      if (completedSteps.has(previousStepId)) return 'accessible';
    }
    
    // Check if module is accessible (previous module is complete)
    const moduleIndex = activeModules.indexOf(moduleKey);
    if (moduleIndex === 0) return 'accessible';
    
    const previousModule = activeModules[moduleIndex - 1];
    const allPreviousStepsComplete = moduleSteps[previousModule].steps.every(
      step => completedSteps.has(step.id)
    );
    
    if (allPreviousStepsComplete && stepIndex === 0) return 'accessible';
    
    return 'locked';
  };

  return (
    <aside className="w-80 bg-white border-r border-[#E2E8F0] flex-shrink-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E4018B] to-[#7017C3] flex items-center justify-center">
            <span className="text-white text-xl">🚀</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">Setup Wizard</h2>
            <p className="text-xs text-[#64748B]">Complete your profile</p>
          </div>
        </div>

        <nav className="space-y-6">
          {activeModules.map((moduleKey, moduleIndex) => {
            const module = moduleSteps[moduleKey];
            const allModuleStepsComplete = module.steps.every(
              step => completedSteps.has(step.id)
            );

            return (
              <div key={moduleKey}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                    allModuleStepsComplete
                      ? "bg-green-100 text-green-600"
                      : currentModule === moduleKey
                      ? "bg-[#7C3AED] text-white"
                      : "bg-gray-100 text-gray-400"
                  )}>
                    {allModuleStepsComplete ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span>{moduleIndex + 1}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[#1E293B]">
                    {module.title}
                  </h3>
                </div>

                <div className="ml-3 pl-3 border-l-2 border-[#E2E8F0] space-y-1">
                  {module.steps.map((step, stepIndex) => {
                    const status = getStepStatus(moduleKey, stepIndex, step.id);
                    const isClickable = status === 'accessible' || status === 'completed' || status === 'current';

                    return (
                      <button
                        key={step.id}
                        onClick={() => isClickable && onStepClick(moduleKey, stepIndex)}
                        disabled={!isClickable}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                          status === 'current' && "bg-[#F8FAFC] text-[#7C3AED] font-medium",
                          status === 'completed' && "text-[#64748B] hover:bg-gray-50",
                          status === 'accessible' && "text-[#475569] hover:bg-gray-50",
                          status === 'locked' && "text-gray-300 cursor-not-allowed"
                        )}
                      >
                        {status === 'completed' ? (
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : status === 'current' ? (
                          <Circle className="w-4 h-4 fill-[#7C3AED] flex-shrink-0" />
                        ) : status === 'locked' ? (
                          <Lock className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="flex-1">{step.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}