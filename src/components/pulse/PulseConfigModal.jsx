import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, BrainCircuit, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function PulseConfigModal({ isOpen, onClose, onSave, existingConfig }) {
    const [formData, setFormData] = useState({
        visionStatement: existingConfig?.visionStatement || '',
        missionStatement: existingConfig?.missionStatement || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(formData);
        } catch (error) {
            toast.error("Failed to save configuration.");
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Configure Your Experience</DialogTitle>
                    <DialogDescription>
                        Fine-tune how PULSE understands your business. Your monthly goals are automatically populated from your Annual Goal Planner.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
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
                <CardFooter className="flex justify-end gap-2 p-0 pt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </DialogContent>
        </Dialog>
    );
}