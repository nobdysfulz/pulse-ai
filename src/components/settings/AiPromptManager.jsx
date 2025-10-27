
import React, { useState, useEffect } from 'react';
import { AiPromptConfig } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

const PromptForm = ({ prompt, onSave, onCancel, isOpen, onOpenChange }) => {
  const [formData, setFormData] = useState(prompt || {
    promptId: '',
    purpose: '',
    contentType: 'social_caption',
    tier: 'free',
    systemMessage: '',
    userMessageTemplate: '',
    creditsCost: 0
  });

  useEffect(() => {
    if (prompt) {
      setFormData(prompt);
    }
  }, [prompt]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{prompt ? 'Edit AI Prompt' : 'Create New AI Prompt'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="promptId">Prompt ID*</Label>
              <Input
                id="promptId"
                value={formData.promptId}
                onChange={(e) => handleChange('promptId', e.target.value)}
                placeholder="e.g., social_caption_generic"
                required
              />
            </div>
            <div>
              <Label htmlFor="contentType">Content Type*</Label>
              <Select value={formData.contentType} onValueChange={(value) => handleChange('contentType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social_graphic_feed">Social Graphic (Feed)</SelectItem>
                  <SelectItem value="social_graphic_story">Social Graphic (Story)</SelectItem>
                  <SelectItem value="social_caption">Social Caption</SelectItem>
                  <SelectItem value="outreach_email">Outreach Email</SelectItem>
                  <SelectItem value="video_script">Video Script</SelectItem>
                  <SelectItem value="blog_post">Blog Post</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="purpose">Purpose*</Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              placeholder="What this prompt is for"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tier">Tier*</Label>
              <Select value={formData.tier} onValueChange={(value) => handleChange('tier', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="unlockable">Unlockable</SelectItem>
                  <SelectItem value="premium_market">Premium Market</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="creditsCost">Credits Cost</Label>
              <Input
                id="creditsCost"
                type="number"
                value={formData.creditsCost}
                onChange={(e) => handleChange('creditsCost', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="systemMessage">System Message</Label>
            <Textarea
              id="systemMessage"
              value={formData.systemMessage}
              onChange={(e) => handleChange('systemMessage', e.target.value)}
              placeholder="Static system instructions for the LLM"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="userMessageTemplate">User Message Template*</Label>
            <Textarea
              id="userMessageTemplate"
              value={formData.userMessageTemplate}
              onChange={(e) => handleChange('userMessageTemplate', e.target.value)}
              placeholder="Dynamic user prompt with {{placeholders}}"
              rows={6}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {"Use double curly braces for dynamic content (e.g., {{marketArea}}, {{userGoal}})"}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Save Prompt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function AiPromptManager() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const data = await AiPromptConfig.list('-created_date');
      setPrompts(data);
    } catch (error) {
      toast.error('Failed to load AI prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (promptData) => {
    try {
      if (editingPrompt) {
        await AiPromptConfig.update(editingPrompt.id, promptData);
        toast.success('AI prompt updated successfully');
      } else {
        await AiPromptConfig.create(promptData);
        toast.success('AI prompt created successfully');
      }
      setShowForm(false);
      setEditingPrompt(null);
      loadPrompts();
    } catch (error) {
      toast.error('Failed to save AI prompt');
    }
  };

  const handleDelete = async (prompt) => {
    if (!confirm('Are you sure you want to delete this AI prompt?')) return;
    
    try {
      await AiPromptConfig.delete(prompt.id);
      toast.success('AI prompt deleted successfully');
      loadPrompts();
    } catch (error) {
      toast.error('Failed to delete AI prompt');
    }
  };

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingPrompt(null);
    setShowForm(true);
  };

  const tierColors = {
    free: 'bg-green-100 text-green-800',
    unlockable: 'bg-blue-100 text-blue-800',
    premium_market: 'bg-purple-100 text-purple-800'
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading AI prompts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Prompt Configuration</h3>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Prompt
        </Button>
      </div>

      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{prompt.promptId}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{prompt.purpose}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(prompt)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(prompt)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-2">
                <Badge variant="outline">{prompt.contentType}</Badge>
                <Badge className={tierColors[prompt.tier]}>{prompt.tier}</Badge>
                {prompt.creditsCost > 0 && (
                  <Badge variant="secondary">{prompt.creditsCost} credits</Badge>
                )}
              </div>
              <p className="text-sm text-slate-700">{prompt.userMessageTemplate.substring(0, 200)}...</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <PromptForm
        prompt={editingPrompt}
        isOpen={showForm}
        onOpenChange={setShowForm}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingPrompt(null);
        }}
      />
    </div>
  );
}
