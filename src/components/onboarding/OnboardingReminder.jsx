import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, X, ArrowRight } from "lucide-react";

export default function OnboardingReminder({ onboardingStatus, onContinue, onDismiss }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || !onboardingStatus?.onboardingRequired) {
    return null;
  }

  const completedSteps = onboardingStatus.completedSteps || [];
  const totalSteps = 4;
  const progress = (completedSteps.length / totalSteps) * 100;
  const remainingSteps = totalSteps - completedSteps.length;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const stepLabels = {
    profile: "Profile",
    market: "Territory", 
    pulse: "Experience",
    preferences: "Settings"
  };

  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg mx-6 mt-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 text-lg">Complete Your Setup</h3>
              <p className="text-orange-700 mb-4">
                {remainingSteps === 1 
                  ? "Just one more step to unlock all PWRU features!" 
                  : `${remainingSteps} steps remaining to unlock all PWRU features.`
                }
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700">Progress</span>
                  <span className="text-orange-700 font-medium">{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex gap-2 mt-3">
                  {Object.entries(stepLabels).map(([key, label]) => (
                    <div
                      key={key}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        completedSteps.includes(key)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {completedSteps.includes(key) ? '✓' : '○'} {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onContinue} className="bg-orange-600 hover:bg-orange-700 text-white">
              Continue Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDismiss}
              className="text-orange-600 hover:bg-orange-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}