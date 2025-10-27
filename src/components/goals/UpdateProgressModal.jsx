import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, X } from "lucide-react";

export default function UpdateProgressModal({ isOpen, onClose, goal, onUpdateProgress }) {
  const [newCurrentValue, setNewCurrentValue] = useState(goal?.currentValue || 0);

  useEffect(() => {
    if (goal) {
      setNewCurrentValue(goal.currentValue || 0);
    }
  }, [goal]);

  if (!goal || !isOpen) return null;

  const newProgressPercentage = Math.min(100, newCurrentValue / goal.targetValue * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const progressUpdate = {
      currentValue: parseFloat(newCurrentValue),
      progressPercentage: newProgressPercentage
    };

    await onUpdateProgress(goal.id, progressUpdate);
    onClose();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full border border-[#E2E8F0]">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="text-xl font-semibold text-[#1E293B]">Update Progress</h2>
          </div>
          <button onClick={onClose} className="text-[#475569] hover:text-[#1E293B]">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="font-semibold text-[#1E293B]">{goal.title}</p>

          <div className="space-y-2">
            <Label htmlFor="newCurrentValue">New Current Value</Label>
            <div className="flex items-center gap-2">
              <Input
                id="newCurrentValue"
                type="number"
                value={newCurrentValue}
                onChange={(e) => setNewCurrentValue(e.target.value)}
                min="0"
                max={goal.targetValue}
                className="flex-1"
              />
              <span className="text-sm text-[#64748B]">
                of {goal.targetUnit === 'USD' ? formatCurrency(goal.targetValue) : goal.targetValue} {goal.targetUnit !== 'USD' && goal.targetUnit}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>New Progress</Label>
            <Progress
              value={newProgressPercentage}
              indicatorClassName="bg-[#7C3AED]"
              className="h-3"
            />
            <p className="text-sm font-medium text-[#1E293B]">{Math.round(newProgressPercentage)}%</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Progress
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}