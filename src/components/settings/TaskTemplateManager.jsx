import React, { useState, useEffect } from 'react';
import { TaskTemplate } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskTemplateForm from '../admin/TaskTemplateForm';
import { Badge } from '@/components/ui/badge';

export default function TaskTemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await TaskTemplate.list('-created_date');
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading task templates:', error);
      toast.error('Failed to load task templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = async (templateId) => {
    if (!confirm('Are you sure you want to delete this task template?')) return;
    
    try {
      await TaskTemplate.delete(templateId);
      toast.success('Task template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting task template:', error);
      toast.error('Failed to delete task template');
    }
  };

  const handleSave = async (templateData) => {
    try {
      if (editingTemplate) {
        await TaskTemplate.update(editingTemplate.id, templateData);
        toast.success('Task template updated successfully');
      } else {
        await TaskTemplate.create(templateData);
        toast.success('Task template created successfully');
      }
      setShowForm(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Error saving task template:', error);
      toast.error('Failed to save task template');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-[#1E293B]">Task Templates</h3>
          <p className="text-sm text-[#64748B]">Manage daily action templates and generation rules</p>
        </div>
        <Button onClick={() => { setEditingTemplate(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold text-[#1E293B] mb-2">No Task Templates</h3>
            <p className="text-sm text-[#64748B] mb-4">
              Create your first task template to start generating daily actions for users
            </p>
            <Button onClick={() => { setEditingTemplate(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{template.category}</Badge>
                  <Badge variant="outline">{template.actionType}</Badge>
                  <Badge className={template.priority === 'high' ? 'bg-red-100 text-red-800' : template.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>
                    {template.priority}
                  </Badge>
                  {template.displayCategory && (
                    <Badge variant="secondary">{template.displayCategory}</Badge>
                  )}
                  {!template.isActive && (
                    <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  <span>Trigger: {template.triggerType} = {template.triggerValue}</span>
                  {template.impactArea && <span className="ml-3">Impact: {template.impactArea}</span>}
                  <span className="ml-3">Priority Weight: {template.priorityWeight || 3}/5</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TaskTemplateForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingTemplate(null); }}
        template={editingTemplate}
        setTemplate={setEditingTemplate}
        onSave={handleSave}
        onCancel={() => { setShowForm(false); setEditingTemplate(null); }}
      />
    </div>
  );
}