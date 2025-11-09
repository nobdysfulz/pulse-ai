
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function AddActionModal({ isOpen, onClose, onCreateAction }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    actionType: 'lead_generation',
    priority: 'medium',
    category: 'power_hour',
    dueDate: new Date().toISOString().split('T')[0],
    frequency: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || formData.title.trim() === '') {
      toast.error('Please enter a task title');
      return;
    }
    
    try {
      await onCreateAction(formData);
      // Reset form after successful creation
      setFormData({
        title: '',
        description: '',
        actionType: 'lead_generation',
        priority: 'medium',
        category: 'power_hour',
        dueDate: new Date().toISOString().split('T')[0],
        frequency: ''
      });
      onClose(); // Close modal after reset
    } catch (error) {
      console.error('Error creating action:', error);
      // Error message already shown by parent component
      if (!error.message?.includes('User data not available')) {
        toast.error('Failed to create task. Please try again.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full border border-[#E2E8F0]">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-xl font-semibold text-[#1E293B]">Add New Task</h2>
          <button onClick={onClose} className="text-[#475569] hover:text-[#1E293B]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Call 5 leads from yesterday"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details about this task..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="power_hour">Power Hour</SelectItem>
                  <SelectItem value="build_business">Build Business</SelectItem>
                  <SelectItem value="initiative">Initiative</SelectItem>
                  <SelectItem value="pulse_based">PULSE Based</SelectItem>
                  <SelectItem value="goals_planning">Goals & Planning</SelectItem>
                  <SelectItem value="build_database">Database Building</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="actionType">Type</Label>
              <Select value={formData.actionType} onValueChange={(value) => setFormData({ ...formData, actionType: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_generation">Lead Generation</SelectItem>
                  <SelectItem value="client_follow_up">Client Follow-up</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="market_research">Market Research</SelectItem>
                  <SelectItem value="skill_development">Skill Development</SelectItem>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="transaction_task">Transaction Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate">Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="frequency">Recurrence (Optional)</Label>
            <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Does not repeat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Does not repeat</SelectItem>
                <SelectItem value="FREQ=DAILY">Daily</SelectItem>
                <SelectItem value="FREQ=WEEKLY">Weekly</SelectItem>
                <SelectItem value="FREQ=MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
