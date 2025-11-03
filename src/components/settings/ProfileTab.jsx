
import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/UserContext';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import LoadingIndicator, { InlineLoadingIndicator } from '../ui/LoadingIndicator';

export default function ProfileTab() {
    const { user, loading, refreshUserData } = useContext(UserContext);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        brokerage: '',
        licenseNumber: '',
        licenseState: '',
        yearsExperience: 0,
        avatar: '',
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                brokerage: user.brokerage || '',
                licenseNumber: user.licenseNumber || '',
                licenseState: user.licenseState || '',
                yearsExperience: user.yearsExperience || 0,
                avatar: user.avatar || '',
            });
        }
    }, [user]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setSaving(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData(prev => ({ ...prev, avatar: file_url }));
            toast.success("Avatar uploaded. Save changes to apply.");
        } catch (error) {
            console.error("Error uploading avatar:", error);
            toast.error("Failed to upload avatar.");
        } finally {
            setSaving(false);
        }
    };
    
    const handleSave = async () => {
        setSaving(true);
        try {
            await User.updateMyUserData({
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                brokerage: formData.brokerage,
                licenseNumber: formData.licenseNumber,
                licenseState: formData.licenseState,
                yearsExperience: Number(formData.yearsExperience),
                avatar: formData.avatar
            });
            toast.success('Profile saved successfully!');
            await refreshUserData();
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><LoadingIndicator text="Loading profile..." size="md" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Profile</h2>
                    <p className="text-sm text-[#475569]">This is how others will see you on the site.</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <InlineLoadingIndicator text="Saving..." /> : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save All Changes
                        </>
                    )}
                </Button>
            </div>
            
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-6 mb-8">
                        <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}`} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                        <div>
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                                <Upload className="mr-2 h-4 w-4" /> Upload Photo
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
                            <p className="text-xs text-slate-500 mt-2">JPG, PNG up to 2MB.</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="mt-1" /></div>
                            <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="mt-1" /></div>
                        </div>
                        <div><Label htmlFor="phone">Your Phone</Label><Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1" /></div>
                        <div><Label htmlFor="email">Email Address</Label><Input id="email" type="email" value={formData.email} disabled className="mt-1 bg-slate-100" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="licenseNumber">License Number</Label><Input id="licenseNumber" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} className="mt-1" /></div>
                            <div><Label htmlFor="licenseState">License State</Label><Input id="licenseState" value={formData.licenseState} onChange={(e) => setFormData({ ...formData, licenseState: e.target.value })} className="mt-1" /></div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="brokerage">Brokerage/Team Name</Label><Input id="brokerage" value={formData.brokerage} onChange={(e) => setFormData({ ...formData, brokerage: e.target.value })} className="mt-1" /></div>
                            <div><Label htmlFor="yearsExperience">Years of Experience</Label><Input type="number" id="yearsExperience" value={formData.yearsExperience} onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })} className="mt-1" /></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
