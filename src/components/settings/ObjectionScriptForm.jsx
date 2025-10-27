import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";

const ObjectionScriptForm = ({ isOpen, onClose, onSave, script, setScript }) => {
    if (!isOpen || !script) return null;

    const handleFieldChange = (field, value) => {
        setScript(prev => ({ ...prev, [field]: value }));
    };

    const handleTipChange = (index, value) => {
        const newTips = [...script.tips];
        newTips[index] = value;
        handleFieldChange('tips', newTips);
    };

    const addTip = () => {
        handleFieldChange('tips', [...script.tips, '']);
    };

    const removeTip = (index) => {
        const newTips = script.tips.filter((_, i) => i !== index);
        handleFieldChange('tips', newTips);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{script?.id ? 'Edit' : 'Create'} Objection Script</DialogTitle>
                    <DialogDescription>
                        Create or modify an objection handling script for the Skills Practice section.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input 
                            id="title" 
                            value={script.title || ''} 
                            onChange={(e) => handleFieldChange('title', e.target.value)} 
                            placeholder="e.g., Your Price is Too High"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={script.category} onValueChange={(v) => handleFieldChange('category', v)}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="price_objections">Price Objections</SelectItem>
                                    <SelectItem value="timing_concerns">Timing Concerns</SelectItem>
                                    <SelectItem value="agent_brokerage_concerns">Agent & Brokerage</SelectItem>
                                    <SelectItem value="decision_delays">Decision Delays</SelectItem>
                                    <SelectItem value="general_objections">General Objections</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select value={script.difficulty} onValueChange={(v) => handleFieldChange('difficulty', v)}>
                                <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="situation">Situation</Label>
                        <Textarea 
                            id="situation" 
                            value={script.situation || ''} 
                            onChange={(e) => handleFieldChange('situation', e.target.value)}
                            placeholder="Describe when this objection typically occurs..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="response">Recommended Response</Label>
                        <Textarea 
                            id="response" 
                            value={script.response || ''} 
                            onChange={(e) => handleFieldChange('response', e.target.value)}
                            placeholder="Provide the recommended response script..."
                            className="h-32"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Key Tips</Label>
                            <Button type="button" onClick={addTip} size="sm" variant="outline">
                                <Plus className="w-4 h-4 mr-1" />
                                Add Tip
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {script.tips?.map((tip, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={tip}
                                        onChange={(e) => handleTipChange(index, e.target.value)}
                                        placeholder={`Tip ${index + 1}...`}
                                    />
                                    {script.tips.length > 1 && (
                                        <Button
                                            type="button"
                                            onClick={() => removeTip(index)}
                                            size="icon"
                                            variant="outline"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sortOrder">Sort Order</Label>
                            <Input 
                                id="sortOrder" 
                                type="number" 
                                value={script.sortOrder || 0} 
                                onChange={(e) => handleFieldChange('sortOrder', parseInt(e.target.value) || 0)} 
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id="isActive" 
                                checked={script.isActive} 
                                onCheckedChange={(c) => handleFieldChange('isActive', c)} 
                            />
                            <Label htmlFor="isActive">Active (visible to users)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id="isPopular" 
                                checked={script.isPopular} 
                                onCheckedChange={(c) => handleFieldChange('isPopular', c)} 
                            />
                            <Label htmlFor="isPopular">Popular (featured on main page)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id="isFree" 
                                checked={script.isFree} 
                                onCheckedChange={(c) => handleFieldChange('isFree', c)} 
                            />
                            <Label htmlFor="isFree">Free access (available to all users)</Label>
                        </div>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onSave}>Save Script</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ObjectionScriptForm;