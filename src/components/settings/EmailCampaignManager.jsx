import React, { useState, useEffect } from 'react';
import { EmailTemplate, EmailCampaign } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Save, X, Mail, Users, Calendar } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TemplateForm = ({ template, onSave, onCancel, isOpen, onOpenChange }) => {
  const [formData, setFormData] = useState(template || {
    templateName: '',
    subject: '',
    htmlContent: '',
    isActive: true
  });

  useEffect(() => {
    if (template) {
      setFormData(template);
    }
  }, [template]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Email Template' : 'Create New Email Template'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="templateName">Template Name*</Label>
            <Input
              id="templateName"
              value={formData.templateName}
              onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
              placeholder="e.g., Welcome Email"
              required
            />
          </div>

          <div>
            <Label htmlFor="subject">Email Subject*</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Welcome to PULSE!"
              required
            />
          </div>

          <div>
            <Label htmlFor="htmlContent">Email Content*</Label>
            <ReactQuill
              theme="snow"
              value={formData.htmlContent}
              onChange={(content) => setFormData({ ...formData, htmlContent: content })}
              className="bg-white"
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  [{ 'color': [] }, { 'background': [] }],
                  ['link', 'image'],
                  ['clean']
                ]
              }}
            />
            <p className="text-xs text-slate-500 mt-2">
              Use {'{'}firstName{'}'}, {'{'}lastName{'}'}, {'{'}email{'}'} for personalization
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CampaignForm = ({ campaign, templates, onSave, onCancel, isOpen, onOpenChange }) => {
  const [formData, setFormData] = useState(campaign || {
    campaignName: '',
    campaignDescription: '',
    emails: [{ templateId: '', delayDays: 0, order: 1 }],
    targetAudience: 'all',
    status: 'draft'
  });

  useEffect(() => {
    if (campaign) {
      setFormData(campaign);
    }
  }, [campaign]);

  const handleAddEmail = () => {
    setFormData({
      ...formData,
      emails: [...formData.emails, { templateId: '', delayDays: 0, order: formData.emails.length + 1 }]
    });
  };

  const handleRemoveEmail = (index) => {
    const newEmails = formData.emails.filter((_, i) => i !== index);
    setFormData({ ...formData, emails: newEmails });
  };

  const handleEmailChange = (index, field, value) => {
    const newEmails = [...formData.emails];
    newEmails[index] = { ...newEmails[index], [field]: value };
    setFormData({ ...formData, emails: newEmails });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Email Campaign' : 'Create New Email Campaign'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="campaignName">Campaign Name*</Label>
              <Input
                id="campaignName"
                value={formData.campaignName}
                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                placeholder="e.g., Onboarding Sequence"
                required
              />
            </div>

            <div>
              <Label htmlFor="targetAudience">Target Audience*</Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="free">Free Users</SelectItem>
                  <SelectItem value="subscriber">Subscribers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="campaignDescription">Description</Label>
            <Textarea
              id="campaignDescription"
              value={formData.campaignDescription}
              onChange={(e) => setFormData({ ...formData, campaignDescription: e.target.value })}
              placeholder="Brief description of this campaign..."
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Email Sequence*</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddEmail}>
                <Plus className="w-4 h-4 mr-1" />
                Add Email
              </Button>
            </div>

            <div className="space-y-3">
              {formData.emails.map((email, index) => (
                <div key={index} className="flex gap-3 items-end p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-xs">Email Template</Label>
                    <Select
                      value={email.templateId}
                      onValueChange={(value) => handleEmailChange(index, 'templateId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.templateName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-32">
                    <Label className="text-xs">Delay (days)</Label>
                    <Input
                      type="number"
                      value={email.delayDays}
                      onChange={(e) => handleEmailChange(index, 'delayDays', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveEmail(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Save Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function EmailCampaignManager() {
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [activeView, setActiveView] = useState('templates');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, campaignsData] = await Promise.all([
        EmailTemplate.list('-created_date'),
        EmailCampaign.list('-created_date')
      ]);
      setTemplates(templatesData || []);
      setCampaigns(campaignsData || []);
    } catch (error) {
      console.error('Error loading email data:', error);
      toast.error('Failed to load email campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      if (editingTemplate) {
        await EmailTemplate.update(editingTemplate.id, templateData);
        toast.success('Template updated successfully');
      } else {
        await EmailTemplate.create(templateData);
        toast.success('Template created successfully');
      }
      setShowTemplateForm(false);
      setEditingTemplate(null);
      loadData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!confirm(`Delete template "${template.templateName}"?`)) return;
    
    try {
      await EmailTemplate.delete(template.id);
      toast.success('Template deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleSaveCampaign = async (campaignData) => {
    try {
      if (editingCampaign) {
        await EmailCampaign.update(editingCampaign.id, campaignData);
        toast.success('Campaign updated successfully');
      } else {
        await EmailCampaign.create(campaignData);
        toast.success('Campaign created successfully');
      }
      setShowCampaignForm(false);
      setEditingCampaign(null);
      loadData();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    }
  };

  const handleDeleteCampaign = async (campaign) => {
    if (!confirm(`Delete campaign "${campaign.campaignName}"?`)) return;
    
    try {
      await EmailCampaign.delete(campaign.id);
      toast.success('Campaign deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const handleToggleCampaignStatus = async (campaign) => {
    try {
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';
      await EmailCampaign.update(campaign.id, { status: newStatus });
      toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'paused'}`);
      loadData();
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast.error('Failed to update campaign status');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1E293B]">Email Campaign Management</h3>
          <p className="text-sm text-[#64748B]">Create and manage email templates and automated campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeView === 'templates' ? 'default' : 'outline'}
            onClick={() => setActiveView('templates')}
            size="sm"
          >
            <Mail className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button
            variant={activeView === 'campaigns' ? 'default' : 'outline'}
            onClick={() => setActiveView('campaigns')}
            size="sm"
          >
            <Users className="w-4 h-4 mr-2" />
            Campaigns
          </Button>
        </div>
      </div>

      {activeView === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-[#1E293B]">Email Templates</h4>
            <Button
              onClick={() => {
                setEditingTemplate(null);
                setShowTemplateForm(true);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {template.templateName}
                        {template.isActive && <Badge variant="success">Active</Badge>}
                      </CardTitle>
                      <p className="text-sm text-[#64748B] mt-1">{template.subject}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowTemplateForm(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template)}
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

          <TemplateForm
            template={editingTemplate}
            isOpen={showTemplateForm}
            onOpenChange={setShowTemplateForm}
            onSave={handleSaveTemplate}
            onCancel={() => {
              setShowTemplateForm(false);
              setEditingTemplate(null);
            }}
          />
        </div>
      )}

      {activeView === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-[#1E293B]">Email Campaigns</h4>
            <Button
              onClick={() => {
                setEditingCampaign(null);
                setShowCampaignForm(true);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>

          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {campaign.campaignName}
                        <Badge
                          variant={campaign.status === 'active' ? 'success' : 'secondary'}
                        >
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {campaign.targetAudience}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-[#64748B] mt-1">{campaign.campaignDescription}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-[#64748B]">
                        <Calendar className="w-3 h-3" />
                        {campaign.emails?.length || 0} emails in sequence
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCampaignStatus(campaign)}
                      >
                        {campaign.status === 'active' ? 'Pause' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCampaign(campaign);
                          setShowCampaignForm(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCampaign(campaign)}
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

          <CampaignForm
            campaign={editingCampaign}
            templates={templates}
            isOpen={showCampaignForm}
            onOpenChange={setShowCampaignForm}
            onSave={handleSaveCampaign}
            onCancel={() => {
              setShowCampaignForm(false);
              setEditingCampaign(null);
            }}
          />
        </div>
      )}
    </div>
  );
}