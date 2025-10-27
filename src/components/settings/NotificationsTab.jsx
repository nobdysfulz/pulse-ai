
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { UserPreferences } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react'; // Loader2 is removed as per instruction
import { toast } from 'sonner';
import LoadingIndicator, { InlineLoadingIndicator } from '../ui/LoadingIndicator'; // Added new imports

export default function NotificationsTab() {
    const { preferences, loading, refreshUserData, user } = useContext(UserContext);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        emailNotifications: true,
        dailyReminders: true,
        weeklyReports: true,
        marketUpdates: true
    });

    useEffect(() => {
        if (preferences) {
            setFormData({
                emailNotifications: preferences.emailNotifications ?? true,
                dailyReminders: preferences.dailyReminders ?? true,
                weeklyReports: preferences.weeklyReports ?? true,
                marketUpdates: preferences.marketUpdates ?? true
            });
        }
    }, [preferences]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (preferences?.id) {
                await UserPreferences.update(preferences.id, formData);
            } else {
                await UserPreferences.create({ ...formData, userId: user.id });
            }
            toast.success('Notification preferences saved!');
            await refreshUserData();
        } catch (error) {
            console.error('Error saving notification preferences:', error);
            toast.error('Failed to save notification preferences.');
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return <div className="flex justify-center p-12"><LoadingIndicator text="Loading notification preferences..." size="md" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Notifications</h2>
                    <p className="text-sm text-[#475569]">Manage how you receive updates from PULSE.</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <InlineLoadingIndicator text="Saving..." /> : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
            
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                        <div>
                            <Label htmlFor="emailNotifications">Email Notifications</Label>
                            <p className="text-xs text-slate-500">Receive important updates via email.</p>
                        </div>
                        <Switch id="emailNotifications" checked={formData.emailNotifications} onCheckedChange={(checked) => setFormData({...formData, emailNotifications: checked})} />
                    </div>
                     <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                        <div>
                            <Label htmlFor="dailyReminders">Daily Reminders</Label>
                            <p className="text-xs text-slate-500">Receive daily recaps (Mon-Fri).</p>
                        </div>
                        <Switch id="dailyReminders" checked={formData.dailyReminders} onCheckedChange={(checked) => setFormData({...formData, dailyReminders: checked})} />
                    </div>
                     <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                        <div>
                            <Label htmlFor="weeklyReports">Weekly Reports</Label>
                            <p className="text-xs text-slate-500">Receive weekly summaries.</p>
                        </div>
                        <Switch id="weeklyReports" checked={formData.weeklyReports} onCheckedChange={(checked) => setFormData({...formData, weeklyReports: checked})} />
                    </div>
                     <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                        <div>
                            <Label htmlFor="marketUpdates">Market Updates</Label>
                            <p className="text-xs text-slate-500">Receive reminders for new market reports.</p>
                        </div>
                        <Switch id="marketUpdates" checked={formData.marketUpdates} onCheckedChange={(checked) => setFormData({...formData, marketUpdates: checked})} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
