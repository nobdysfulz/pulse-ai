import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserMarketConfig, UserOnboarding, Profile } from '@/api/entities';
import { useUser, useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const EXPERIENCE_LEVELS = [
  { value: 'new', label: 'New Agent (0-2 years)' },
  { value: 'developing', label: 'Developing (2-5 years)' },
  { value: 'experienced', label: 'Experienced (5-10 years)' },
  { value: 'veteran', label: 'Veteran (10-20 years)' },
  { value: 'master', label: 'Master (20+ years)' }
];

const WORK_COMMITMENT_LEVELS = [
  { value: 'part_time', label: 'Part-Time (< 20 hours/week)' },
  { value: 'full_time', label: 'Full-Time (40+ hours/week)' },
  { value: 'intense', label: 'Intense (60+ hours/week)' }
];

const DATABASE_SIZES = [
  { value: '0-50', label: '0-50 contacts' },
  { value: '51-150', label: '51-150 contacts' },
  { value: '151-300', label: '151-300 contacts' },
  { value: '301-500', label: '301-500 contacts' },
  { value: '501-1000', label: '501-1000 contacts' },
  { value: '1000+', label: '1000+ contacts' }
];

export default function MarketBusinessSetup({ data, onNext, allData }) {
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    // Market Config
    primaryTerritory: '',
    state: '',
    city: '',
    // Agent Intelligence Profile
    experienceLevel: '',
    workCommitment: '',
    databaseSize: '',
    previousYearTransactions: 0,
    previousYearVolume: 0,
    ...data
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.primaryTerritory || !formData.state || !formData.city) {
      toast.error('Please fill in all required market fields');
      return;
    }

    if (!formData.experienceLevel || !formData.workCommitment || !formData.databaseSize) {
      toast.error('Please fill in all required profile fields');
      return;
    }

    setSaving(true);
    try {
      if (!clerkUser?.id) throw new Error('No user found');
      
      const token = await getToken();
      if (!token) throw new Error('Failed to get authentication token');

      // Save Market Config
      const marketData = {
        userId: clerkUser.id,
        marketName: formData.primaryTerritory,
        state: formData.state,
        city: formData.city
      };

      const existingMarket = await UserMarketConfig.filter({ userId: clerkUser.id }, '-created_at', token);
      if (existingMarket.length > 0) {
        await UserMarketConfig.update(existingMarket[0].id, marketData, token);
      } else {
        await UserMarketConfig.create(marketData, token);
      }

      // Update profile with experience level using entity update
      const profileData = {
        years_experience: getYearsFromExperience(formData.experienceLevel)
      };
      const existingProfile = await Profile.filter({ id: clerkUser.id }, '-created_at', token);
      if (existingProfile.length > 0) {
        await Profile.update(clerkUser.id, profileData, token);
      }

      // Progress is tracked via completed_steps in TierAwareOnboarding
      await onNext(formData);
    } catch (error) {
      console.error('[MarketBusinessSetup] Error saving:', error);
      toast.error('Failed to save your information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getYearsFromExperience = (level) => {
    const map = {
      'new': 1,
      'developing': 3,
      'experienced': 7,
      'veteran': 15,
      'master': 20
    };
    return map[level] || 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-[#1E293B] mb-2">Market & Business Profile</h2>
        <p className="text-[#64748B]">Tell us about your market and real estate business</p>
      </div>

      {/* Market Configuration */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Your Market</h3>
        
        <div>
          <Label htmlFor="primaryTerritory">Primary Territory / Market Name</Label>
          <Input
            id="primaryTerritory"
            value={formData.primaryTerritory}
            onChange={(e) => setFormData({ ...formData, primaryTerritory: e.target.value })}
            placeholder="e.g., Greater Austin Area, Downtown Seattle"
            required
          />
        </div>

        <div>
          <Label htmlFor="state">State</Label>
          <Select
            value={formData.state}
            onValueChange={(value) => setFormData({ ...formData, state: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Primary city"
            required
          />
        </div>
      </div>

      {/* Agent Intelligence Profile */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Your Business Profile</h3>
        
        <div>
          <Label htmlFor="experienceLevel">Experience Level</Label>
          <Select
            value={formData.experienceLevel}
            onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="workCommitment">Work Commitment</Label>
          <Select
            value={formData.workCommitment}
            onValueChange={(value) => setFormData({ ...formData, workCommitment: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select work commitment" />
            </SelectTrigger>
            <SelectContent>
              {WORK_COMMITMENT_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="databaseSize">Database Size</Label>
          <Select
            value={formData.databaseSize}
            onValueChange={(value) => setFormData({ ...formData, databaseSize: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select database size" />
            </SelectTrigger>
            <SelectContent>
              {DATABASE_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="previousYearTransactions">Previous Year Transactions</Label>
          <Input
            id="previousYearTransactions"
            type="number"
            value={formData.previousYearTransactions}
            onChange={(e) => setFormData({ ...formData, previousYearTransactions: parseInt(e.target.value) || 0 })}
            placeholder="0"
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="previousYearVolume">Previous Year Volume ($)</Label>
          <Input
            id="previousYearVolume"
            type="number"
            value={formData.previousYearVolume}
            onChange={(e) => setFormData({ ...formData, previousYearVolume: parseInt(e.target.value) || 0 })}
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? 'Saving...' : 'Continue'}
      </Button>
    </form>
  );
}