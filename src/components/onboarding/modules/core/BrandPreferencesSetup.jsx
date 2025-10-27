import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const COACHING_STYLES = [
  { value: 'supportive', label: 'Supportive', description: 'Encouraging and patient guidance' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of support and accountability' },
  { value: 'direct', label: 'Direct', description: 'Straightforward and results-focused' }
];

const ACTIVITY_MODES = [
  { value: 'get_moving', label: 'Get Moving', description: '3-5 tasks daily to build momentum' },
  { value: 'building_momentum', label: 'Building Momentum', description: '5-10 tasks for steady growth' },
  { value: 'do_the_most', label: 'Do The Most', description: '10-15 tasks for aggressive goals' },
  { value: 'tried_it_all', label: "I've Tried It All", description: '15-20 tasks for maximum productivity' }
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Phoenix', label: 'Arizona Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' }
];

export default function BrandPreferencesSetup({ data, onNext, allData }) {
  const [formData, setFormData] = useState({
    coachingStyle: 'balanced',
    activityMode: 'get_moving',
    timezone: 'America/New_York',
    dailyReminders: true,
    weeklyReports: true,
    marketUpdates: true,
    emailNotifications: true,
    ...data
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSaving(true);
    try {
      const user = await base44.auth.me();
      const serviceClient = base44.asServiceRole;

      // Save User Preferences
      const preferencesData = {
        userId: user.id,
        coachingStyle: formData.coachingStyle,
        activityMode: formData.activityMode,
        timezone: formData.timezone,
        dailyReminders: formData.dailyReminders,
        weeklyReports: formData.weeklyReports,
        marketUpdates: formData.marketUpdates,
        emailNotifications: formData.emailNotifications
      };

      const existingPreferences = await serviceClient.entities.UserPreferences.filter({ userId: user.id });
      if (existingPreferences.length > 0) {
        await serviceClient.entities.UserPreferences.update(existingPreferences[0].id, preferencesData);
      } else {
        await serviceClient.entities.UserPreferences.create(preferencesData);
      }

      // Update onboarding progress
      const onboardingRecords = await serviceClient.entities.UserOnboarding.filter({ userId: user.id });
      if (onboardingRecords.length > 0) {
        await serviceClient.entities.UserOnboarding.update(onboardingRecords[0].id, {
          preferencesCompleted: true
        });
      }

      await onNext(formData);
    } catch (error) {
      console.error('[BrandPreferencesSetup] Error saving:', error);
      toast.error('Failed to save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-[#1E293B] mb-2">Personalize Your Experience</h2>
        <p className="text-[#64748B]">Customize how PULSE AI works with you</p>
      </div>

      {/* Coaching Style */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Coaching Style</h3>
        <Label htmlFor="coachingStyle">How do you want your AI coach to communicate?</Label>
        <Select value={formData.coachingStyle} onValueChange={(value) => setFormData({ ...formData, coachingStyle: value })}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COACHING_STYLES.map(style => (
              <SelectItem key={style.value} value={style.value}>
                <div>
                  <div className="font-medium">{style.label}</div>
                  <div className="text-xs text-[#64748B]">{style.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Mode */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Activity Level</h3>
        <Label htmlFor="activityMode">How many daily tasks do you want?</Label>
        <Select value={formData.activityMode} onValueChange={(value) => setFormData({ ...formData, activityMode: value })}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_MODES.map(mode => (
              <SelectItem key={mode.value} value={mode.value}>
                <div>
                  <div className="font-medium">{mode.label}</div>
                  <div className="text-xs text-[#64748B]">{mode.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timezone */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Time Settings</h3>
        <Label htmlFor="timezone">Your Timezone</Label>
        <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map(tz => (
              <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dailyReminders">Daily Action Reminders</Label>
              <p className="text-sm text-[#64748B]">Get notified about your daily tasks</p>
            </div>
            <Switch
              id="dailyReminders"
              checked={formData.dailyReminders}
              onCheckedChange={(checked) => setFormData({ ...formData, dailyReminders: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weeklyReports">Weekly Progress Reports</Label>
              <p className="text-sm text-[#64748B]">Weekly summary of your achievements</p>
            </div>
            <Switch
              id="weeklyReports"
              checked={formData.weeklyReports}
              onCheckedChange={(checked) => setFormData({ ...formData, weeklyReports: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketUpdates">Market Intelligence Updates</Label>
              <p className="text-sm text-[#64748B]">AI-powered market insights</p>
            </div>
            <Switch
              id="marketUpdates"
              checked={formData.marketUpdates}
              onCheckedChange={(checked) => setFormData({ ...formData, marketUpdates: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-[#64748B]">Receive important updates via email</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={formData.emailNotifications}
              onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8">
          {saving ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}