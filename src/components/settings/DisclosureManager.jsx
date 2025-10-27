import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { LegalDocument } from '@/api/entities';

export default function DisclosureManager() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    documentType: '',
    title: '',
    content: ''
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await LegalDocument.list('-lastUpdated');
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await LegalDocument.update(editing.id, {
          ...formData,
          lastUpdated: new Date().toISOString()
        });
        toast.success('Document updated successfully');
      } else {
        await LegalDocument.create({
          ...formData,
          lastUpdated: new Date().toISOString()
        });
        toast.success('Document created successfully');
      }
      await loadDocuments();
      setEditing(null);
      setFormData({ documentType: '', title: '', content: '' });
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    }
  };

  const handleEdit = (doc) => {
    setEditing(doc);
    setFormData({
      documentType: doc.documentType,
      title: doc.title,
      content: doc.content
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await LegalDocument.delete(id);
      toast.success('Document deleted successfully');
      await loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
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
            <h3 className="text-lg font-semibold text-[#1E293B]">Legal Documents</h3>
            <p className="text-sm text-[#475569] mt-1">Manage terms and disclosures</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing({})}>
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          )}
        </div>

        {editing && (
          <div className="mb-6 p-6 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <div className="space-y-4">
              <div>
                <Label htmlFor="documentType">Document Type (Key)</Label>
                <Input
                  id="documentType"
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  placeholder="e.g., agent_onboarding_terms"
                  disabled={!!editing?.id}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Display title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Document content (HTML supported)"
                  rows={12}
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setFormData({ documentType: '', title: '', content: '' });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Document
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#1E293B]">{doc.title}</h4>
                  <p className="text-sm text-[#64748B] mt-1">Type: {doc.documentType}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Last updated: {new Date(doc.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(doc)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="w-4 h-4 text-[#EF4444]" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {documents.length === 0 && !editing && (
          <div className="text-center py-12">
            <p className="text-base text-[#475569]">No legal documents configured</p>
            <p className="text-sm text-[#64748B] mt-1">Add your first document</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}