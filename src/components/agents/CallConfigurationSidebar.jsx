import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { AgentConfig } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CallConfigurationSidebar() {
  const { user } = useContext(UserContext);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const [agentConfig] = await AgentConfig.filter({ userId: user.id });
        setConfig(agentConfig || {
          callingStartTime: '09:00',
          callingEndTime: '17:00',
          callingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          retryAttempts: 3,
          retryDelay: 5,
          retryDelayUnit: 'minutes'
        });
      } catch (error) {
        toast.error('Failed to load configuration.');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchConfig();
  }, [user]);

  const handleDayChange = (day) => {
    const newDays = config.callingDays.includes(day)
      ? config.callingDays.filter(d => d !== day)
      : [...config.callingDays, day];
    setConfig({ ...config, callingDays: newDays });
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
       const payload = { ...config, userId: user.id };
       if(config.id){
         await AgentConfig.update(config.id, payload);
       } else {
         const newConfig = await AgentConfig.create(payload);
         setConfig(newConfig);
       }
       toast.success("Configuration saved!");
    } catch(e){
       toast.error("Failed to save configuration.");
    } finally {
       setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-[#1E293B]">Calling Hours (Agent's Local Time)</h3>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <select value={config.callingStartTime} onChange={e => setConfig({...config, callingStartTime: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
          </select>
          <select value={config.callingEndTime} onChange={e => setConfig({...config, callingEndTime: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-[#1E293B]">Calling Days</h3>
        <div className="flex justify-between mt-2">
          {daysOfWeek.map(day => (
            <div key={day} className="flex flex-col items-center gap-1">
              <label className="text-sm capitalize">{day}</label>
              <Checkbox checked={config.callingDays?.includes(day)} onCheckedChange={() => handleDayChange(day)} />
            </div>
          ))}
        </div>
      </div>

       <div>
        <h3 className="text-base font-semibold text-[#1E293B]">Retry Rules</h3>
         <p className="text-xs text-gray-500 mb-2">Set max attempts and delay for no-answer/busy.</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs">Attempts</label>
            <Input type="number" value={config.retryAttempts} onChange={e => setConfig({...config, retryAttempts: parseInt(e.target.value)})} />
          </div>
          <div>
            <label className="text-xs">Delay</label>
            <Input type="number" value={config.retryDelay} onChange={e => setConfig({...config, retryDelay: parseInt(e.target.value)})} />
          </div>
          <div>
            <label className="text-xs">Unit</label>
            <select value={config.retryDelayUnit} onChange={e => setConfig({...config, retryDelayUnit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md h-10">
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
            </select>
          </div>
        </div>
      </div>
      
      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Save"}
      </Button>
    </div>
  );
}