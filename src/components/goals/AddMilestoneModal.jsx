import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Flag } from "lucide-react";
import { format } from "date-fns";

export default function AddMilestoneModal({ isOpen, onClose, goal, onAddMilestone }) {
  const [milestoneData, setMilestoneData] = useState({
    name: '',
    description: '',
    targetDate: '',
    targetValue: 0,
    priority: 'medium',
    rewards: ''
  });

  if (!goal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newMilestone = {
      title: milestoneData.name,
      value: milestoneData.targetValue,
      targetDate: milestoneData.targetDate,
      description: milestoneData.description,
      priority: milestoneData.priority,
      completed: false,
      completedDate: null
    };

    await onAddMilestone(goal.id, newMilestone);
    
    // Reset form
    setMilestoneData({
      name: '',
      description: '',
      targetDate: '',
      targetValue: 0,
      priority: 'medium',
      rewards: ''
    });
    
    onClose();
  };

  const maxMilestoneValue = goal.targetValue - (goal.currentValue || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-orange-600" />
            Add Milestone: {goal.title}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="milestoneName">Milestone Name *</Label>
              <Input
                id="milestoneName"
                value={milestoneData.name}
                onChange={(e) => setMilestoneData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Complete first quarter target"
                maxLength={80}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={milestoneData.description}
                onChange={(e) => setMilestoneData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what needs to be accomplished..."
                maxLength={300}
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Completion Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {milestoneData.targetDate ? format(new Date(milestoneData.targetDate), 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={milestoneData.targetDate ? new Date(milestoneData.targetDate) : undefined}
                      onSelect={(date) => setMilestoneData(prev => ({ ...prev, targetDate: date }))}
                      disabled={(date) => date > new Date(goal.deadline)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetValue">Target Value</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="targetValue"
                    type="number"
                    value={milestoneData.targetValue}
                    onChange={(e) => setMilestoneData(prev => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max={maxMilestoneValue}
                    placeholder="0"
                  />
                  <span className="text-sm text-slate-600">{goal.targetUnit}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Max: {maxMilestoneValue} {goal.targetUnit} remaining
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select value={milestoneData.priority} onValueChange={(value) => setMilestoneData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rewards">Reward (Optional)</Label>
              <Input
                id="rewards"
                value={milestoneData.rewards}
                onChange={(e) => setMilestoneData(prev => ({ ...prev, rewards: e.target.value }))}
                placeholder="e.g., Dinner at favorite restaurant"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm">
              <div className="font-medium mb-2">Milestone Preview:</div>
              <div>• Complete "{milestoneData.name || 'Milestone'}" by {milestoneData.targetDate ? format(new Date(milestoneData.targetDate), 'MMM d, yyyy') : 'selected date'}</div>
              <div>• Target: {milestoneData.targetValue} {goal.targetUnit}</div>
              <div>• Priority: {milestoneData.priority}</div>
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              Add Milestone
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}