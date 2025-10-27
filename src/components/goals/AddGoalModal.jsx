import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from 'lucide-react';
import { toast } from "sonner";

export default function AddGoalModal({ isOpen, onClose, onAddGoal }) {
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState('closings');
  const [category, setCategory] = useState('production');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = () => {
    if (!title || !targetValue || !deadline) {
      toast.error("Please fill out all fields.");
      return;
    }

    onAddGoal({
      title,
      targetValue: Number(targetValue),
      targetUnit,
      category,
      deadline
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full border border-[#E2E8F0]">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-xl font-semibold text-[#1E293B]">Add Custom Goal</h2>
          <button onClick={onClose} className="text-[#475569] hover:text-[#1E293B]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Host 4 Open Houses" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
                <SelectItem value="lead-generation">Lead Generation</SelectItem>
                <SelectItem value="business-development">Business Development</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target</Label>
              <Input id="targetValue" type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="e.g., 4" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetUnit">Unit</Label>
              <Select value={targetUnit} onValueChange={setTargetUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="closings">Closings</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="units">Units</SelectItem>
                  <SelectItem value="contacts">Contacts</SelectItem>
                  <SelectItem value="appointments">Appointments</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-[#E2E8F0]">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Goal</Button>
        </div>
      </div>
    </div>
  );
}