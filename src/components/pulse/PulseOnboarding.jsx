import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, BrainCircuit, Check, Edit, Info, Loader2, Trophy } from 'lucide-react';

const steps = [
  { id: 'experience', title: 'Your Current Experience', icon: BrainCircuit },
  { id: 'goals', title: 'Monthly Goals (Optional)', icon: Trophy },
  { id: 'confirmation', title: 'Confirmation', icon: Check }
];

export default function PulseOnboarding({ user, onComplete, existingConfig }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        visionStatement: existingConfig?.visionStatement || '',
        missionStatement: existingConfig?.missionStatement || '',
    });

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onComplete(formData);
        setIsSaving(false);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Vision Statement</label>
                            <Textarea 
                                name="visionStatement"
                                value={formData.visionStatement} 
                                onChange={handleChange} 
                                placeholder="e.g., To be the most trusted real estate advisor in my community." 
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Mission Statement</label>
                            <Textarea 
                                name="missionStatement"
                                value={formData.missionStatement} 
                                onChange={handleChange} 
                                placeholder="e.g., To provide exceptional service and expert guidance for every client's real estate journey." 
                                className="mt-1"
                            />
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="text-center">
                        <Trophy className="w-12 h-12 mx-auto text-purple-500 mb-4" />
                        <h3 className="text-lg font-semibold">Ready to Go!</h3>
                        <p className="text-slate-600 mt-2">
                           Your monthly goals are automatically imported from your Annual Goal Planner. You can add or adjust goals anytime from the "My Performance" dashboard.
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    const stepId = steps[currentStep].id;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                 <CardHeader>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-800">Welcome to Pulse AI</h2>
                        <p className="text-slate-600 mt-1">Let's configure your AI to match your business.</p>
                    </div>
                    <div className="flex justify-between items-center mt-4 max-w-sm mx-auto">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index <= currentStep ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        <step.icon className="w-4 h-4" />
                                    </div>
                                    <p className={`text-xs mt-1 font-medium ${index <= currentStep ? 'text-purple-600' : 'text-slate-500'}`}>{step.title}</p>
                                </div>
                                {index < steps.length - 1 && <div className={`flex-1 h-0.5 ${index < currentStep ? 'bg-purple-600' : 'bg-slate-200'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                 </CardHeader>
                 <CardContent className="min-h-[250px] flex items-center justify-center">
                    {renderStepContent()}
                 </CardContent>
                 <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>Back</Button>
                    {currentStep < steps.length - 1 ? (
                        <Button onClick={handleNext}>Next <ArrowRight className="w-4 h-4 ml-2"/></Button>
                    ) : (
                         <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                            Complete Setup
                        </Button>
                    )}
                 </CardFooter>
            </Card>
        </div>
    );
}