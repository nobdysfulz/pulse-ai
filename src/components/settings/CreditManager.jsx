import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Minus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function CreditManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('adminOperations', {
        body: { operation: 'getAllUsers' }
      });
      const allUsers = data?.users || [];
      
      const { data: creditData } = await supabase.functions.invoke('adminOperations', {
        body: { operation: 'getUserCredits' }
      });
      const userCredits = creditData?.credits || [];
      
      const usersWithCredits = allUsers.map(user => {
        const credit = userCredits.find(c => c.userId === user.id);
        return {
          ...user,
          creditsRemaining: credit?.creditsRemaining || 0
        };
      });
      
      setUsers(usersWithCredits);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustCredits = async (userId, adjustment) => {
    setAdjusting(true);
    try {
      await supabase.functions.invoke('adminOperations', {
        body: {
          operation: 'adjustCredits',
          userId,
          adjustment
        }
      });
      toast.success(`Credits ${adjustment > 0 ? 'added' : 'removed'} successfully`);
      await loadUsers();
      setSelectedUser(null);
      setCreditAmount(0);
    } catch (error) {
      console.error('Error adjusting credits:', error);
      toast.error('Failed to adjust credits');
    } finally {
      setAdjusting(false);
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
            <h3 className="text-lg font-semibold text-[#1E293B]">Credit Management</h3>
            <p className="text-sm text-[#475569] mt-1">Adjust user credits</p>
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
                  <p className="text-2xl font-bold text-[#7C3AED]">{user.creditsRemaining}</p>
                  <p className="text-xs text-[#64748B]">credits</p>
                </div>
              </div>

              {selectedUser === user.id ? (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`credits-${user.id}`}>Adjustment Amount</Label>
                    <Input
                      id={`credits-${user.id}`}
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                      placeholder="Enter amount"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={() => handleAdjustCredits(user.id, creditAmount)}
                    disabled={adjusting || creditAmount === 0}
                    className="bg-[#22C55E] hover:bg-[#16A34A]"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                  <Button
                    onClick={() => handleAdjustCredits(user.id, -creditAmount)}
                    disabled={adjusting || creditAmount === 0}
                    variant="destructive"
                  >
                    <Minus className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null);
                      setCreditAmount(0);
                    }}
                  >
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
                  Adjust Credits
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}