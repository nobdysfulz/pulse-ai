import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function CallConfigModal({ isOpen, onClose, onSave, initialConfig }) {
  const [config, setConfig] = useState({
    callingDays: [],
    callingStartTime: '09:00',
    callingEndTime: '17:00',
    retryAttempts: 3,
    retryDelay: 5,
    retryDelayUnit: 'minutes'
  });

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleSave = () => {
    onSave(config);
  };

  const toggleDay = (day) => {
    const days = config.callingDays || [];
    if (days.includes(day)) {
      setConfig({ ...config, callingDays: days.filter(d => d !== day) });
    } else {
      setConfig({ ...config, callingDays: [...days, day] });
    }
  };

  const weekDays = [
    { value: 'mon', label: 'Monday' },
    { value: 'tue', label: 'Tuesday' },
    { value: 'wed', label: 'Wednesday' },
    { value: 'thu', label: 'Thursday' },
    { value: 'fri', label: 'Friday' },
    { value: 'sat', label: 'Saturday' },
    { value: 'sun', label: 'Sunday' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0]">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-[#1E293B]">Call Configuration</h2>
          <button onClick={onClose} className="text-[#475569] hover:text-[#1E293B]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <Label className="mb-3 block">Calling Days</Label>
            <div className="space-y-2">
              {weekDays.map((day) => (
                <div key={day.value} className="flex items-center gap-3">
                  <Checkbox
                    id={day.value}
                    checked={(config.callingDays || []).includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <Label htmlFor={day.value} className="cursor-pointer">{day.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={config.callingStartTime}
                onChange={(e) => setConfig({ ...config, callingStartTime: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={config.callingEndTime}
                onChange={(e) => setConfig({ ...config, callingEndTime: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="retryAttempts">Retry Attempts</Label>
            <Input
              id="retryAttempts"
              type="number"
              min="0"
              max="10"
              value={config.retryAttempts}
              onChange={(e) => setConfig({ ...config, retryAttempts: parseInt(e.target.value) })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="retryDelay">Retry Delay</Label>
              <Input
                id="retryDelay"
                type="number"
                min="1"
                value={config.retryDelay}
                onChange={(e) => setConfig({ ...config, retryDelay: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="retryDelayUnit">Unit</Label>
              <Select
                value={config.retryDelayUnit}
                onValueChange={(value) => setConfig({ ...config, retryDelayUnit: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-[#E2E8F0]">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </div>
    </div>
  );
}