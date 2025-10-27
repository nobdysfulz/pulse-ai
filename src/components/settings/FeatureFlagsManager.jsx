import React, { useState, useEffect } from 'react';
import { FeatureFlag } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Flag, Users, Percent } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const FlagForm = ({ flag, onSave, onCancel, isOpen, onOpenChange }) => {
  const [formData, setFormData] = useState(flag || {
    featureKey: '',
    featureName: '',
    description: '',
    isGloballyEnabled: true,
    enabledForTiers: ['Subscriber', 'Admin'],
    rolloutPercentage: 100
  });

  useEffect(() => {
    if (flag) {
      setFormData(flag);
    }
  }, [flag]);

  const handleTierToggle = (tier) => {
    const tiers = formData.enabledForTiers || [];
    if (tiers.includes(tier)) {
      setFormData({ ...formData, enabledForTiers: tiers.filter(t => t !== tier) });
    } else {
      setFormData({ ...formData, enabledForTiers: [...tiers, tier] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{flag ? 'Edit Feature Flag' : 'Create New Feature Flag'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="featureKey">Feature Key*</Label>
              <Input
                id="featureKey"
                value={formData.featureKey}
                onChange={(e) => setFormData({ ...formData, featureKey: e.target.value })}
                placeholder="e.g., ai_agents"
                required
                disabled={!!flag}
              />
            </div>
            <div>
              <Label htmlFor="featureName">Feature Name*</Label>
              <Input
                id="featureName"
                value={formData.featureName}
                onChange={(e) => setFormData({ ...formData, featureName: e.target.value })}
                placeholder="e.g., AI Agents"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this feature do?"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label>Globally Enabled</Label>
              <p className="text-xs text-[#64748B]">Master switch for this feature</p>
            </div>
            <Switch
              checked={formData.isGloballyEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, isGloballyEnabled: checked })}
            />
          </div>

          <div>
            <Label className="mb-2 block">Enabled for Tiers</Label>
            <div className="space-y-2">
              {['Free', 'Subscriber', 'Admin'].map(tier => (
                <div key={tier} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`tier-${tier}`}
                    checked={(formData.enabledForTiers || []).includes(tier)}
                    onChange={() => handleTierToggle(tier)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`tier-${tier}`} className="cursor-pointer">{tier}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Rollout Percentage: {formData.rolloutPercentage}%</Label>
            <Slider
              value={[formData.rolloutPercentage]}
              onValueChange={([value]) => setFormData({ ...formData, rolloutPercentage: value })}
              max={100}
              step={5}
              className="mt-2"
            />
            <p className="text-xs text-[#64748B] mt-1">
              Controls what percentage of eligible users see this feature
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Save Feature Flag
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function FeatureFlagsManager() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFlag, setEditingFlag] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const data = await FeatureFlag.list('-created_date');
      setFlags(data || []);
    } catch (error) {
      console.error('Error loading feature flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (flagData) => {
    try {
      if (editingFlag) {
        await FeatureFlag.update(editingFlag.id, flagData);
        toast.success('Feature flag updated successfully');
      } else {
        await FeatureFlag.create(flagData);
        toast.success('Feature flag created successfully');
      }
      setShowForm(false);
      setEditingFlag(null);
      loadFlags();
    } catch (error) {
      console.error('Error saving feature flag:', error);
      toast.error('Failed to save feature flag');
    }
  };

  const handleDelete = async (flag) => {
    if (!confirm(`Delete feature flag "${flag.featureName}"?`)) return;
    
    try {
      await FeatureFlag.delete(flag.id);
      toast.success('Feature flag deleted successfully');
      loadFlags();
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      toast.error('Failed to delete feature flag');
    }
  };

  const handleToggleGlobal = async (flag) => {
    try {
      await FeatureFlag.update(flag.id, { isGloballyEnabled: !flag.isGloballyEnabled });
      toast.success(`Feature ${flag.isGloballyEnabled ? 'disabled' : 'enabled'}`);
      loadFlags();
    } catch (error) {
      console.error('Error toggling feature:', error);
      toast.error('Failed to toggle feature');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading feature flags...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1E293B]">Feature Flags</h3>
          <p className="text-sm text-[#64748B]">Control feature availability and rollout</p>
        </div>
        <Button
          onClick={() => {
            setEditingFlag(null);
            setShowForm(true);
          }}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Feature Flag
        </Button>
      </div>

      <div className="grid gap-4">
        {flags.map((flag) => (
          <Card key={flag.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Flag className="w-4 h-4 text-[#7C3AED]" />
                    <CardTitle className="text-base">{flag.featureName}</CardTitle>
                    <Badge variant={flag.isGloballyEnabled ? 'success' : 'secondary'}>
                      {flag.isGloballyEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {flag.featureKey}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#64748B] mb-3">{flag.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded">
                      <Users className="w-3 h-3" />
                      {flag.enabledForTiers?.join(', ') || 'No tiers'}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded">
                      <Percent className="w-3 h-3" />
                      {flag.rolloutPercentage}% rollout
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Switch
                    checked={flag.isGloballyEnabled}
                    onCheckedChange={() => handleToggleGlobal(flag)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingFlag(flag);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(flag)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <FlagForm
        flag={editingFlag}
        isOpen={showForm}
        onOpenChange={setShowForm}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingFlag(null);
        }}
      />
    </div>
  );
}