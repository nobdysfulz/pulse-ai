import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { UserAgentSubscription } from '@/api/entities';

export default function ManualSubscriptionManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [planType, setPlanType] = useState('Starter');
  const [saving, setSaving] = useState(false);

  const planConfigs = {
    'Starter': { minutes: 100, overage: 0.25 },
    'Professional': { minutes: 300, overage: 0.20 },
    'Enterprise': { minutes: null, overage: 0 }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const subscriptions = await base44.asServiceRole.entities.UserAgentSubscription.list();
      
      const usersWithSubs = allUsers.map(user => {
        const sub = subscriptions.find(s => s.userId === user.id);
        return { ...user, subscription: sub };
      });
      
      setUsers(usersWithSubs);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const config = planConfigs[planType];
      const cycleStart = new Date();
      const cycleEnd = new Date(cycleStart);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);

      const user = users.find(u => u.id === selectedUser);
      
      if (user.subscription) {
        await UserAgentSubscription.update(user.subscription.id, {
          planType,
          minutesAllocated: config.minutes,
          overageRate: config.overage,
          billingCycleStartDate: cycleStart.toISOString(),
          billingCycleEndDate: cycleEnd.toISOString(),
          status: 'active'
        });
      } else {
        await UserAgentSubscription.create({
          userId: selectedUser,
          planType,
          minutesAllocated: config.minutes,
          overageRate: config.overage,
          billingCycleStartDate: cycleStart.toISOString(),
          billingCycleEndDate: cycleEnd.toISOString(),
          status: 'active'
        });
      }

      toast.success('Subscription assigned successfully');
      await loadUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error assigning subscription:', error);
      toast.error('Failed to assign subscription');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <Card className="bg-white border border-[#E2E8F0]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#1E293B]">Manual Subscription Assignment</h3>
            <p className="text-sm text-[#475569] mt-1">Assign AI Agent plans to users</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-[#1E293B]">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-[#64748B]">{user.email}</p>
                </div>
                <div className="text-right">
                  {user.subscription ? (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-[#7C3AED] text-white text-sm rounded-full">
                      {user.subscription.planType}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-[#E2E8F0] text-[#475569] text-sm rounded-full">
                      No Plan
                    </div>
                  )}
                </div>
              </div>

              {selectedUser === user.id ? (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`plan-${user.id}`}>Select Plan</Label>
                    <Select value={planType} onValueChange={setPlanType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Starter">Starter (100 min/mo)</SelectItem>
                        <SelectItem value="Professional">Professional (300 min/mo)</SelectItem>
                        <SelectItem value="Enterprise">Enterprise (Unlimited)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAssignPlan} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(user.id)}
                  className="w-full"
                >
                  Assign Plan
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}