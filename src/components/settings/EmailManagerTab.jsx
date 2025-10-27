import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Edit, Trash2, Save, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { EmailTemplate } from '@/api/entities';

export default function EmailManagerTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    templateName: '',
    subject: '',
    htmlContent: '',
    isActive: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await EmailTemplate.list('-created_date');
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.templateName || !formData.subject || !formData.htmlContent) {
      toast.error('All fields are required');
      return;
    }

    try {
      if (editing?.id) {
        await EmailTemplate.update(editing.id, formData);
        toast.success('Email template updated');
      } else {
        await EmailTemplate.create(formData);
        toast.success('Email template created');
      }
      await loadTemplates();
      setEditing(null);
      setFormData({
        templateName: '',
        subject: '',
        htmlContent: '',
        isActive: true
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save email template');
    }
  };

  const handleEdit = (template) => {
    setEditing(template);
    setFormData(template);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;

    try {
      await EmailTemplate.delete(id);
      toast.success('Email template deleted');
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete email template');
    }
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
            <h3 className="text-lg font-semibold text-[#1E293B]">Email Templates</h3>
            <p className="text-sm text-[#475569] mt-1">Manage automated email templates</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing({})}>
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          )}
        </div>

        {editing && (
          <div className="mb-6 p-6 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <div className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={formData.templateName}
                  onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                  placeholder="e.g., Welcome Email"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Subject Line</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Email subject"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>HTML Content</Label>
                <Textarea
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                  placeholder="HTML email content"
                  rows={12}
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-[#64748B] mt-1">
                  Use placeholders: {'{firstName}'}, {'{lastName}'}, {'{email}'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[#1E293B]">{template.templateName}</h4>
                      {template.isActive ? (
                        <span className="px-2 py-0.5 bg-[#22C55E] text-white text-xs rounded-full">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#94A3B8] text-white text-xs rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-[#64748B] mt-1">{template.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="w-4 h-4 text-[#EF4444]" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && !editing && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-base text-[#475569]">No email templates configured</p>
            <p className="text-sm text-[#64748B] mt-1">Add your first email template</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}