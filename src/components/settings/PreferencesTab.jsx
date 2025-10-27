
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { UserPreferences, BrandColorPalette } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import LoadingIndicator, { InlineLoadingIndicator } from '../ui/LoadingIndicator';

const timezones = [
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu"
];

export default function PreferencesTab() {
    const { preferences, loading, refreshUserData, user } = useContext(UserContext);
    const [saving, setSaving] = useState(false);
    const [palettes, setPalettes] = useState([]);
    const [formData, setFormData] = useState({
        coachingStyle: 'balanced',
        activityMode: 'get_moving',
        timezone: 'America/New_York',
        selectedPaletteId: ''
    });

    useEffect(() => {
        async function loadPalettes() {
            try {
                const data = await BrandColorPalette.filter({ isActive: true });
                setPalettes(data || []);
            } catch (error) {
                console.error("Failed to load color palettes:", error);
            }
        }
        loadPalettes();
    }, []);

    useEffect(() => {
        if (preferences) {
            setFormData({
                coachingStyle: preferences.coachingStyle || 'balanced',
                activityMode: preferences.activityMode || 'get_moving',
                timezone: preferences.timezone || 'America/New_York',
                selectedPaletteId: preferences.selectedPaletteId || ''
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
            toast.success('Preferences saved successfully!');
            await refreshUserData();
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error('Failed to save preferences.');
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return <div className="flex justify-center p-12"><LoadingIndicator text="Loading preferences..." size="md" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Preferences</h2>
                    <p className="text-sm text-[#475569]">Customize your PULSE experience.</p>
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
                <CardHeader><CardTitle>Application Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="coachingStyle">Coaching Style</Label>
                            <Select value={formData.coachingStyle} onValueChange={(value) => setFormData({ ...formData, coachingStyle: value })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="supportive">Supportive</SelectItem>
                                    <SelectItem value="balanced">Balanced</SelectItem>
                                    <SelectItem value="direct">Direct</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="timezone">Timezone</Label>
                             <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz.replace('America/', '').replace('_', ' ')}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="activityMode">Activity Mode</Label>
                        <Select value={formData.activityMode} onValueChange={(value) => setFormData({ ...formData, activityMode: value })}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="get_moving">Get Moving</SelectItem>
                                <SelectItem value="building_momentum">Building Momentum</SelectItem>
                                <SelectItem value="do_the_most">Do The Most</SelectItem>
                                <SelectItem value="tried_it_all">Tried It All</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Brand & Style</CardTitle></CardHeader>
                <CardContent>
                    <Label htmlFor="brandColors">Your Brand Colors</Label>
                    <p className="text-xs text-slate-500 mb-2">Select a palette that best matches your brand for AI-generated graphics.</p>
                     <Select value={formData.selectedPaletteId} onValueChange={(value) => setFormData({ ...formData, selectedPaletteId: value })}>
                        <SelectTrigger><SelectValue placeholder="Select a color palette..."/></SelectTrigger>
                        <SelectContent>
                            {palettes.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primaryColorHex }}></div>
                                        <span>{p.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        </div>
    );
}
