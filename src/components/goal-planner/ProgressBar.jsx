import React from 'react';
import { Progress } from '@/components/ui/progress';

export default function ProgressBar({ currentStep, totalSteps }) {
  const steps = Array.from({ length: totalSteps }, (_, i) => ({
    id: i + 1,
    name: `Step ${i + 1}`,
    completed: i + 1 < currentStep,
    current: i + 1 === currentStep
  }));

  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="space-y-4">
      <Progress value={progressPercentage} className="h-2" />
      <div className="flex justify-between text-sm">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center ${
              step.completed || step.current ? 'text-purple-600 font-medium' : 'text-slate-400'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 ${
              step.completed 
                ? 'bg-purple-600 text-white' 
                : step.current 
                ? 'bg-purple-100 text-purple-600 border-2 border-purple-600' 
                : 'bg-slate-200 text-slate-500'
            }`}>
              {step.id}
            </span>
            <span className="hidden sm:inline">{step.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}