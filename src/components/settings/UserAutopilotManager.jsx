import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Settings } from 'lucide-react';

export default function UserAutopilotManager({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [permissions, setPermissions] = useState({
    'copilot.send_email': false,
    'copilot.schedule_appointment': false,
    'copilot.research': false,
    'copilot.create_document': false,
    'copilot.analyze_performance': false,
    'executive_assistant.send_email': false,
    'executive_assistant.schedule_appointment': false,
    'executive_assistant.create_task': false,
    'content_agent.generate_content': false,
    'content_agent.schedule_content': false,
    'transaction_coordinator.create_task': false,
    'transaction_coordinator.send_reminder': false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadPermissions();
    }
  }, [isOpen, user]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      if (user.autopilotPermissions) {
        const userPerms = JSON.parse(user.autopilotPermissions);
        setPermissions({ ...permissions, ...userPerms });
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Failed to load user permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (permission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('updateUserPermissions', {
        userId: user.id,
        permissions: permissions
      });
      
      toast.success('Permissions updated successfully');
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const permissionGroups = {
    'Copilot': [
      { key: 'copilot.send_email', label: 'Send Email' },
      { key: 'copilot.schedule_appointment', label: 'Schedule Appointment' },
      { key: 'copilot.research', label: 'Research & Summarize' },
      { key: 'copilot.create_document', label: 'Create Document' },
      { key: 'copilot.analyze_performance', label: 'Analyze Performance' }
    ],
    'Executive Assistant': [
      { key: 'executive_assistant.send_email', label: 'Send Email' },
      { key: 'executive_assistant.schedule_appointment', label: 'Schedule Appointment' },
      { key: 'executive_assistant.create_task', label: 'Create Task' }
    ],
    'Content Agent': [
      { key: 'content_agent.generate_content', label: 'Generate Content' },
      { key: 'content_agent.schedule_content', label: 'Schedule Content' }
    ],
    'Transaction Coordinator': [
      { key: 'transaction_coordinator.create_task', label: 'Create Task' },
      { key: 'transaction_coordinator.send_reminder', label: 'Send Reminder' }
    ]
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        <Settings className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Autopilot Permissions</DialogTitle>
            <p className="text-sm text-[#64748B]">
              Control what actions AI agents can perform on behalf of {user?.firstName} {user?.lastName}
            </p>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-[#64748B]">Loading permissions...</div>
          ) : (
            <div className="space-y-6 py-4">
              {Object.entries(permissionGroups).map(([groupName, groupPermissions]) => (
                <div key={groupName} className="space-y-3">
                  <h4 className="font-semibold text-[#1E293B]">{groupName}</h4>
                  <div className="space-y-2 pl-4">
                    {groupPermissions.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100">
                        <Label htmlFor={key} className="text-sm cursor-pointer flex-1">
                          {label}
                        </Label>
                        <Switch
                          id={key}
                          checked={permissions[key] || false}
                          onCheckedChange={() => handleToggle(key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}