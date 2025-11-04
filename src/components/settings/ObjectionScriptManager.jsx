import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Edit, Trash2, Save, X, MessageSquare, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ObjectionScript } from '@/api/entities';
import BulkImportModal from '../admin/BulkImportModal';

const OBJECTION_CSV_SAMPLE = `title,category,difficulty,situation,response,tips,is_free
"Price Too High","price_objections","beginner","Client says your commission is too high","Let me show you the value...","Focus on value|Show comparable rates|Explain services",true
"Need to think about it","timing_objections","intermediate","Client needs more time to decide","I understand...","Create urgency|Address concerns|Set follow-up",true`;

const OBJECTION_COLUMN_MAPPING = {
  title: 'title',
  category: 'category',
  difficulty: 'difficulty',
  situation: 'situation',
  response: 'response',
  tips: 'tips',
  is_free: 'is_free'
};

export default function ObjectionScriptManager() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'price_objections',
    difficulty: 'beginner',
    situation: '',
    response: '',
    tips: [],
    isFree: true,
    isPopular: false,
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    setLoading(true);
    try {
      const data = await ObjectionScript.list('sortOrder');
      setScripts(data || []);
    } catch (error) {
      console.error('Error loading scripts:', error);
      toast.error('Failed to load scripts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.situation || !formData.response) {
      toast.error('Title, situation, and response are required');
      return;
    }

    try {
      const scriptData = {
        ...formData,
        is_active: true, // Explicitly set to true for new scripts
        is_free: formData.isFree !== false, // Default to true
        sort_order: formData.sortOrder || 0
      };

      if (editing?.id) {
        await ObjectionScript.update(editing.id, scriptData);
        toast.success('Script updated successfully');
      } else {
        await ObjectionScript.create(scriptData);
        toast.success('Script created successfully');
      }
      
      await loadScripts();
      setEditing(null);
      setFormData({
        title: '',
        category: 'price_objections',
        difficulty: 'beginner',
        situation: '',
        response: '',
        tips: [],
        isFree: true,
        isPopular: false,
        isActive: true,
        sortOrder: 0
      });
    } catch (error) {
      console.error('Error saving script:', error);
      toast.error(`Failed to save script: ${error.message}`);
    }
  };

  const handleEdit = (script) => {
    setEditing(script);
    setFormData(script);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;

    try {
      await ObjectionScript.delete(id);
      toast.success('Script deleted');
      await loadScripts();
    } catch (error) {
      console.error('Error deleting script:', error);
      toast.error('Failed to delete script');
    }
  };

  const handleTipsChange = (value) => {
    const tips = value.split('\n').filter(t => t.trim());
    setFormData({ ...formData, tips });
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
            <h3 className="text-lg font-semibold text-[#1E293B]">Objection Scripts</h3>
            <p className="text-sm text-[#475569] mt-1">Manage objection handling scripts</p>
          </div>
          <div className="flex gap-2">
            {!editing && (
              <>
                <Button variant="outline" onClick={() => setShowImportModal(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
                <Button onClick={() => setEditing({})}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Script
                </Button>
              </>
            )}
          </div>
        </div>

        {editing && (
          <div className="mb-6 p-6 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Script title"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price_objections">Price Objections</SelectItem>
                      <SelectItem value="timing_concerns">Timing Concerns</SelectItem>
                      <SelectItem value="agent_brokerage_concerns">Agent/Brokerage</SelectItem>
                      <SelectItem value="decision_delays">Decision Delays</SelectItem>
                      <SelectItem value="general_objections">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
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
                <Label>Situation</Label>
                <Textarea
                  value={formData.situation}
                  onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
                  placeholder="Describe the situation where this objection occurs"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Response Script</Label>
                <Textarea
                  value={formData.response}
                  onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                  placeholder="The recommended response script"
                  rows={5}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Tips (one per line)</Label>
                <Textarea
                  value={(formData.tips || []).join('\n')}
                  onChange={(e) => handleTipsChange(e.target.value)}
                  placeholder="Enter tips, one per line"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFree}
                    onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Free</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Popular</span>
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
                  Save Script
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {scripts.map((script) => (
            <div key={script.id} className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-[#7C3AED]" />
                    <h4 className="font-semibold text-[#1E293B]">{script.title}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-white border border-[#E2E8F0] text-[#475569] text-xs rounded-full">
                      {script.category.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-[#E2E8F0] text-[#475569] text-xs rounded-full">
                      {script.difficulty}
                    </span>
                    {script.isFree && (
                      <span className="px-2 py-0.5 bg-[#22C55E] text-white text-xs rounded-full">Free</span>
                    )}
                    {script.isPopular && (
                      <span className="px-2 py-0.5 bg-[#7C3AED] text-white text-xs rounded-full">Popular</span>
                    )}
                    {script.isActive ? (
                      <span className="px-2 py-0.5 bg-[#22C55E] text-white text-xs rounded-full">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[#94A3B8] text-white text-xs rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-[#64748B]">{script.situation}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(script)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(script.id)}>
                    <Trash2 className="w-4 h-4 text-[#EF4444]" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {scripts.length === 0 && !editing && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-base text-[#475569]">No scripts configured</p>
            <p className="text-sm text-[#64748B] mt-1">Add your first objection script</p>
          </div>
        )}
      </CardContent>

      <BulkImportModal
        isOpen={showImportModal}
        onClose={(shouldRefresh) => {
          setShowImportModal(false);
          if (shouldRefresh) loadScripts();
        }}
        entityType="objection_scripts"
        entityLabel="Objection Scripts"
        sampleCsvData={OBJECTION_CSV_SAMPLE}
        columnMapping={OBJECTION_COLUMN_MAPPING}
      />
    </Card>
  );
}