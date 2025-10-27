import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const TaskTemplateForm = ({ isOpen, onClose, onSave, template, setTemplate }) => {
  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template?.id ? 'Edit' : 'Create'} Task Template</DialogTitle>
          <DialogDescription>
            Define the content and generation rules for a daily action.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={template.title || ''} onChange={(e) => handleFieldChange('title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={template.description || ''} onChange={(e) => handleFieldChange('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={template.category} onValueChange={(v) => handleFieldChange('category', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="power_hour">Power Hour</SelectItem>
                  <SelectItem value="goals_planning">Goals & Planning</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="build_business">Build Business Drip</SelectItem>
                  <SelectItem value="initiative">Initiative</SelectItem>
                  <SelectItem value="pulse_based">PULSE Based</SelectItem>
                  <SelectItem value="build_database">Database Building</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={template.priority} onValueChange={(v) => handleFieldChange('priority', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select value={template.actionType} onValueChange={(v) => handleFieldChange('actionType', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_follow_up">Client Follow-up</SelectItem>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="lead_generation">Lead Generation</SelectItem>
                  <SelectItem value="skill_development">Skill Development</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="market_research">Market Research</SelectItem>
                  <SelectItem value="transaction_task">Transaction Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>PULSE Impact</Label>
              <Input type="number" step="0.1" value={template.pulseImpact || 0.1} onChange={(e) => handleFieldChange('pulseImpact', parseFloat(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select value={template.triggerType} onValueChange={(v) => handleFieldChange('triggerType', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day_of_week">Day of Week</SelectItem>
                  <SelectItem value="account_day_exact">Account Day (Exact)</SelectItem>
                  <SelectItem value="build_business_drip">Build Business Drip</SelectItem>
                  <SelectItem value="initiative">Initiative</SelectItem>
                  <SelectItem value="pulse_score_range">PULSE Score Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trigger Value</Label>
              <Input value={template.triggerValue || ''} onChange={(e) => handleFieldChange('triggerValue', e.target.value)} placeholder="e.g., 1 (for Monday), 1-30, 0-25" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Display Category</Label>
              <Select value={template.displayCategory} onValueChange={(v) => handleFieldChange('displayCategory', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PULSE Tasks">PULSE Tasks</SelectItem>
                  <SelectItem value="Power Hour Theme">Power Hour Theme</SelectItem>
                  <SelectItem value="Business Building">Business Building</SelectItem>
                  <SelectItem value="Initiative">Initiative</SelectItem>
                  <SelectItem value="Goals & Planning">Goals & Planning</SelectItem>
                  <SelectItem value="Database Building">Database Building</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority Weight (1-5)</Label>
              <Input type="number" min="1" max="5" value={template.priorityWeight || 3} onChange={(e) => handleFieldChange('priorityWeight', parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Impact Area</Label>
              <Select value={template.impactArea} onValueChange={(v) => handleFieldChange('impactArea', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Urgency">Urgency</SelectItem>
                  <SelectItem value="Leads">Leads</SelectItem>
                  <SelectItem value="Systems">Systems</SelectItem>
                  <SelectItem value="Execution">Execution</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sub-category (Optional)</Label>
            <Input value={template.subCategory || ''} onChange={(e) => handleFieldChange('subCategory', e.target.value)} placeholder="e.g., Marketing & Visibility, monthly, quarterly" />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="isActive" checked={template.isActive} onCheckedChange={(c) => handleFieldChange('isActive', c)} />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskTemplateForm;