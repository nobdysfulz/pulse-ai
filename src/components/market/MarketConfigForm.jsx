
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const PRICE_RANGES = [
  { label: 'No Min', value: 0 },
  { label: '$50,000', value: 50000 },
  { label: '$100,000', value: 100000 },
  { label: '$150,000', value: 150000 },
  { label: '$200,000', value: 200000 },
  { label: '$250,000', value: 250000 },
  { label: '$300,000', value: 300000 },
  { label: '$350,000', value: 350000 },
  { label: '$400,000', value: 400000 },
  { label: '$450,000', value: 450000 },
  { label: '$500,000', value: 500000 },
  { label: '$600,000', value: 600000 },
  { label: '$700,000', value: 700000 },
  { label: '$800,000', value: 800000 },
  { label: '$900,000', value: 900000 },
  { label: '$1,000,000', value: 1000000 },
  { label: '$1,500,000', value: 1500000 },
  { label: '$2,000,000', value: 2000000 },
  { label: '$2,500,000', value: 2500000 },
  { label: '$3,000,000', value: 3000000 },
  { label: '$4,000,000', value: 4000000 },
  { label: '$5,000,000', value: 5000000 },
  { label: 'No Max', value: 999999999 }
];

const PROPERTY_TYPES = [
  'Single Family',
  'Condo',
  'Townhouse',
  'Multi-Family',
  'Land',
  'Mobile/Manufactured',
  'Farm/Ranch',
  'Commercial'
];

const CLIENT_TYPES = [
  'First-Time Buyers',
  'Move-Up Buyers',
  'Luxury Buyers',
  'Investors',
  'Sellers',
  'Luxury Sellers',
  'Downsizers',
  'Relocating Families',
  'Retirees',
  'Veterans'
];

export default function MarketConfigForm({ onSaveComplete, compact = false }) {
  const { marketConfig, user, refreshUserData } = useContext(UserContext);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingConfigId, setExistingConfigId] = useState(null);
  const [zipCodeInput, setZipCodeInput] = useState('');
  const [formData, setFormData] = useState({
    primaryTerritory: '',
    state: '',
    city: '',
    zipCodes: [],
    priceRangeMin: 0,
    priceRangeMax: 999999999,
    propertyTypes: [],
    clientTypes: []
  });

  // Load existing market config on mount
  useEffect(() => {
    loadMarketConfig();
  }, [user]);

  // Update form when marketConfig from context changes
  useEffect(() => {
    if (marketConfig) {
      console.log('[MarketConfigForm] Loading marketConfig from context:', marketConfig);
      setExistingConfigId(marketConfig.id);
      setFormData({
        primaryTerritory: marketConfig.primaryTerritory || '',
        state: marketConfig.state || '',
        city: marketConfig.city || '',
        zipCodes: marketConfig.zipCodes || [],
        priceRangeMin: marketConfig.priceRangeMin ?? 0,
        priceRangeMax: marketConfig.priceRangeMax ?? 999999999,
        propertyTypes: marketConfig.propertyTypes || [],
        clientTypes: marketConfig.clientTypes || []
      });
    }
  }, [marketConfig]);

  // Auto-populate Primary Market Territory when City or State changes
  useEffect(() => {
    if (formData.city && formData.state) {
      const autoTerritory = `${formData.city}, ${formData.state}`;
      if (formData.primaryTerritory !== autoTerritory) {
        setFormData(prev => ({
          ...prev,
          primaryTerritory: autoTerritory
        }));
      }
    }
  }, [formData.city, formData.state]);

  const loadMarketConfig = async () => {
    if (!user?.id) {
      console.log('[MarketConfigForm] No user ID, skipping load');
      setLoading(false);
      return;
    }

    try {
      console.log('[MarketConfigForm] Loading market config for user:', user.id);
      // Get ALL configs for this user
      const allConfigs = await base44.entities.UserMarketConfig.filter({ userId: user.id });
      console.log('[MarketConfigForm] Found', allConfigs.length, 'total configs');

      if (allConfigs && allConfigs.length > 0) {
        // Sort by created_date descending to get the most recent
        const sortedConfigs = allConfigs.sort((a, b) =>
          new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
        );
        const config = sortedConfigs[0];

        console.log('[MarketConfigForm] Using most recent config:', {
          id: config.id,
          created: config.created_date,
          territory: config.primaryTerritory
        });

        setExistingConfigId(config.id);
        setFormData({
          primaryTerritory: config.primaryTerritory || '',
          state: config.state || '',
          city: config.city || '',
          zipCodes: config.zipCodes || [],
          priceRangeMin: config.priceRangeMin ?? 0,
          priceRangeMax: config.priceRangeMax ?? 999999999,
          propertyTypes: config.propertyTypes || [],
          clientTypes: config.clientTypes || []
        });

        // Clean up old duplicate configs (keep only the most recent one)
        if (sortedConfigs.length > 1) {
          console.log('[MarketConfigForm] Cleaning up', sortedConfigs.length - 1, 'old configs');
          for (let i = 1; i < sortedConfigs.length; i++) {
            try {
              await base44.entities.UserMarketConfig.delete(sortedConfigs[i].id);
              console.log('[MarketConfigForm] Deleted old config:', sortedConfigs[i].id);
            } catch (deleteError) {
              console.error('[MarketConfigForm] Failed to delete old config:', deleteError);
            }
          }
        }
      } else {
        console.log('[MarketConfigForm] No existing config found');
        setExistingConfigId(null);
      }
    } catch (error) {
      console.error('[MarketConfigForm] Error loading market config:', error);
      toast.error('Failed to load market configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleAddZipCode = () => {
    const trimmedZip = zipCodeInput.trim();
    if (trimmedZip && !formData.zipCodes.includes(trimmedZip)) {
      setFormData(prev => ({
        ...prev,
        zipCodes: [...prev.zipCodes, trimmedZip]
      }));
      setZipCodeInput('');
    }
  };

  const handleRemoveZipCode = (zipToRemove) => {
    setFormData(prev => ({
      ...prev,
      zipCodes: prev.zipCodes.filter(zip => zip !== zipToRemove)
    }));
  };

  const handlePropertyTypeToggle = (propertyType) => {
    setFormData(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(propertyType)
        ? prev.propertyTypes.filter(t => t !== propertyType)
        : [...prev.propertyTypes, propertyType]
    }));
  };

  const handleClientTypeToggle = (clientType) => {
    setFormData(prev => ({
      ...prev,
      clientTypes: prev.clientTypes.includes(clientType)
        ? prev.clientTypes.filter(t => t !== clientType)
        : [...prev.clientTypes, clientType]
    }));
  };

  const handleSave = async () => {
    if (!formData.primaryTerritory || !formData.state || !formData.city) {
      toast.error('Please fill in Market State and Market City');
      return;
    }

    if (!user?.id) {
      toast.error('User session not found. Please refresh the page.');
      return;
    }

    setSaving(true);
    console.log('[MarketConfigForm] ========== SAVE START ==========');
    console.log('[MarketConfigForm] User ID:', user.id);
    console.log('[MarketConfigForm] Existing config ID:', existingConfigId);
    console.log('[MarketConfigForm] Form data:', formData);

    try {
      const dataToSave = {
        userId: user.id,
        primaryTerritory: formData.primaryTerritory,
        state: formData.state,
        city: formData.city,
        zipCodes: formData.zipCodes,
        priceRangeMin: Number(formData.priceRangeMin),
        priceRangeMax: Number(formData.priceRangeMax),
        propertyTypes: formData.propertyTypes,
        clientTypes: formData.clientTypes
      };

      console.log('[MarketConfigForm] Data to save:', dataToSave);

      let savedConfig;
      if (existingConfigId) {
        console.log('[MarketConfigForm] Updating existing config:', existingConfigId);
        savedConfig = await base44.entities.UserMarketConfig.update(existingConfigId, dataToSave);
        console.log('[MarketConfigForm] Update response:', savedConfig);
      } else {
        console.log('[MarketConfigForm] Creating new config');
        savedConfig = await base44.entities.UserMarketConfig.create(dataToSave);
        console.log('[MarketConfigForm] Create response:', savedConfig);
        setExistingConfigId(savedConfig.id);
      }

      // Verify the save by reading it back
      console.log('[MarketConfigForm] Verifying save by reading back...');
      const verifyConfigs = await base44.entities.UserMarketConfig.filter({ userId: user.id });
      console.log('[MarketConfigForm] Verification found', verifyConfigs.length, 'configs');

      if (verifyConfigs.length === 0) {
        throw new Error('Config was not saved - verification failed. This may be a permissions issue.');
      }

      toast.success('Market configuration saved successfully!');

      // Refresh user context
      console.log('[MarketConfigForm] Refreshing user context...');
      await refreshUserData();

      if (onSaveComplete) {
        onSaveComplete();
      }

      console.log('[MarketConfigForm] ========== SAVE END ==========');
    } catch (error) {
      console.error('[MarketConfigForm] ========== SAVE ERROR ==========');
      console.error('[MarketConfigForm] Error:', error);
      console.error('[MarketConfigForm] Error message:', error.message);
      console.error('[MarketConfigForm] Error details:', error.response?.data);

      let errorMessage = 'Failed to save market configuration';
      if (error.message.includes('permissions') || error.message.includes('403')) {
        errorMessage = 'Permission denied. Please contact support.';
      } else if (error.message) {
        errorMessage = `Failed to save: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${compact ? 'text-sm' : ''}`}>
      {/* State and City - MOVED TO TOP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="state">Market State *</Label>
          <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select state..." />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="city">Market City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="e.g., Miami"
            className="mt-1"
          />
        </div>
      </div>

      {/* Primary Territory - AUTO-POPULATED, READ-ONLY */}
      <div>
        <Label htmlFor="primaryTerritory">Primary Market Territory *</Label>
        <Input
          id="primaryTerritory"
          value={formData.primaryTerritory}
          readOnly
          disabled
          className="mt-1 bg-gray-50 cursor-not-allowed"
        />
        <p className="text-xs text-slate-500 mt-1">
          Auto-populated from City and State above
        </p>
      </div>

      {/* ZIP Codes */}
      <div>
        <Label htmlFor="zipCode">ZIP Codes (Optional)</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="zipCode"
            value={zipCodeInput}
            onChange={(e) => setZipCodeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddZipCode();
              }
            }}
            placeholder="Enter ZIP code"
          />
          <Button type="button" onClick={handleAddZipCode} variant="outline">Add</Button>
        </div>
        {formData.zipCodes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.zipCodes.map(zip => (
              <div key={zip} className="flex items-center gap-1 bg-slate-100 rounded-full px-3 py-1 text-sm">
                <span>{zip}</span>
                <button type="button" onClick={() => handleRemoveZipCode(zip)} className="text-slate-500 hover:text-slate-800 text-lg leading-none">×</button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-1">
          Add specific ZIP codes for detailed comparisons
        </p>
      </div>

      {/* Price Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priceRangeMin">Minimum Price Range</Label>
          <Select
            value={formData.priceRangeMin.toString()}
            onValueChange={(value) => setFormData({ ...formData, priceRangeMin: Number(value) })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.filter(p => p.value <= 5000000).map(price => (
                <SelectItem key={price.value} value={price.value.toString()}>{price.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priceRangeMax">Maximum Price Range</Label>
          <Select
            value={formData.priceRangeMax.toString()}
            onValueChange={(value) => setFormData({ ...formData, priceRangeMax: Number(value) })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.filter(p => p.value >= 100000 || p.value === 999999999).map(price => (
                <SelectItem key={price.value} value={price.value.toString()}>{price.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Property Types */}
      <div>
        <Label>Property Types</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {PROPERTY_TYPES.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`property-${type}`}
                checked={formData.propertyTypes.includes(type)}
                onCheckedChange={() => handlePropertyTypeToggle(type)}
              />
              <label
                htmlFor={`property-${type}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Client Types */}
      <div>
        <Label>Client Types</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {CLIENT_TYPES.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`client-${type}`}
                checked={formData.clientTypes.includes(type)}
                onCheckedChange={() => handleClientTypeToggle(type)}
              />
              <label
                htmlFor={`client-${type}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
