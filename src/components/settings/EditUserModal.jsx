import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function EditUserModal({ isOpen, onClose, user, onSave }) {
    const [userData, setUserData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setUserData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                subscriptionTier: user.subscriptionTier || 'Free',
                role: user.role || 'user',
                subscriptionStatus: user.subscriptionStatus || 'active'
            });
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        // We only pass the changed data to the onSave function
        const payload = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          subscriptionTier: userData.subscriptionTier,
          role: userData.role,
          subscriptionStatus: userData.subscriptionStatus
        };
        await onSave(user.id, payload);
        setIsSaving(false);
        onClose();
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User: {user.firstName} {user.lastName}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="firstName" className="text-right">First Name</Label>
                        <Input id="firstName" value={userData.firstName} onChange={(e) => setUserData({ ...userData, firstName: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lastName" className="text-right">Last Name</Label>
                        <Input id="lastName" value={userData.lastName} onChange={(e) => setUserData({ ...userData, lastName: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <Select value={userData.role} onValueChange={(value) => setUserData({ ...userData, role: value })}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subscriptionTier" className="text-right">Tier</Label>
                        <Select value={userData.subscriptionTier} onValueChange={(value) => setUserData({ ...userData, subscriptionTier: value })}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a tier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Free">Free</SelectItem>
                                <SelectItem value="Subscriber">Subscriber</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subscriptionStatus" className="text-right">Sub Status</Label>
                        <Select value={userData.subscriptionStatus} onValueChange={(value) => setUserData({ ...userData, subscriptionStatus: value })}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="past_due">Past Due</SelectItem>
                                <SelectItem value="locked_out">Locked Out</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin mr-2" /> : null}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}