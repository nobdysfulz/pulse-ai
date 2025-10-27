import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function StepNavigation({ currentStep, totalSteps, onNext, onBack, canProceed = true }) {
  const handleNext = () => {
    if (onNext && canProceed && currentStep < totalSteps) {
      onNext();
    }
  };

  const handleBack = () => {
    if (onBack && currentStep > 1) {
      onBack();
    }
  };

  return (
    <div className="flex justify-between items-center pt-6 border-t border-slate-200">
      <Button 
        variant="outline" 
        onClick={handleBack}
        disabled={currentStep === 1}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      
      <div className="text-sm text-slate-500">
        Step {currentStep} of {totalSteps}
      </div>
      
      <Button 
        onClick={handleNext}
        disabled={!canProceed} // FIX: Removed the second part of the condition which was redundant
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400"
      >
        Next
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}