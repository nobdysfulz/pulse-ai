import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Edit, Trash2, Save, X, Package } from 'lucide-react';
import { toast } from 'sonner';
import { FeaturedContentPack } from '@/api/entities';

export default function FeaturedContentPackManager() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'link',
    url: '',
    thumbnailUrl: '',
    socialNetworks: [],
    isPremium: false,
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    setLoading(true);
    try {
      const data = await FeaturedContentPack.list('sortOrder');
      setPacks(data || []);
    } catch (error) {
      console.error('Error loading packs:', error);
      toast.error('Failed to load content packs');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.url) {
      toast.error('Title and URL are required');
      return;
    }

    try {
      if (editing?.id) {
        await FeaturedContentPack.update(editing.id, formData);
        toast.success('Content pack updated');
      } else {
        await FeaturedContentPack.create(formData);
        toast.success('Content pack created');
      }
      await loadPacks();
      setEditing(null);
      setFormData({
        title: '',
        description: '',
        type: 'link',
        url: '',
        thumbnailUrl: '',
        socialNetworks: [],
        isPremium: false,
        isActive: true,
        sortOrder: 0
      });
    } catch (error) {
      console.error('Error saving pack:', error);
      toast.error('Failed to save content pack');
    }
  };

  const handleEdit = (pack) => {
    setEditing(pack);
    setFormData(pack);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;

    try {
      await FeaturedContentPack.delete(id);
      toast.success('Content pack deleted');
      await loadPacks();
    } catch (error) {
      console.error('Error deleting pack:', error);
      toast.error('Failed to delete content pack');
    }
  };

  const handleNetworksChange = (value) => {
    const networks = value.split(',').map(n => n.trim()).filter(n => n);
    setFormData({ ...formData, socialNetworks: networks });
  };

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
            <h3 className="text-lg font-semibold text-[#1E293B]">Featured Content Packs</h3>
            <p className="text-sm text-[#475569] mt-1">Manage featured content in Content Studio</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing({})}>
              <Plus className="w-4 h-4 mr-2" />
              Add Pack
            </Button>
          )}
        </div>

        {editing && (
          <div className="mb-6 p-6 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Content pack title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">File Download</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>URL</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Thumbnail URL</Label>
                <Input
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Social Networks (comma-separated)</Label>
                <Input
                  value={(formData.socialNetworks || []).join(', ')}
                  onChange={(e) => handleNetworksChange(e.target.value)}
                  placeholder="Instagram, Facebook, LinkedIn"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPremium}
                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Premium</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Pack
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packs.map((pack) => (
            <div key={pack.id} className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-[#1E293B]">{pack.title}</h4>
                      {pack.isPremium && (
                        <span className="px-2 py-0.5 bg-[#7C3AED] text-white text-xs rounded-full">Premium</span>
                      )}
                      {pack.isActive ? (
                        <span className="px-2 py-0.5 bg-[#22C55E] text-white text-xs rounded-full">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#94A3B8] text-white text-xs rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-[#64748B] mt-1">{pack.type}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#475569] mb-3">{pack.description}</p>
              {pack.socialNetworks && pack.socialNetworks.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {pack.socialNetworks.map((network, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-white border border-[#E2E8F0] text-[#475569] text-xs rounded-full">
                      {network}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(pack)} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(pack.id)}>
                  <Trash2 className="w-4 h-4 text-[#EF4444]" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {packs.length === 0 && !editing && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-base text-[#475569]">No content packs configured</p>
            <p className="text-sm text-[#64748B] mt-1">Add your first featured content pack</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}