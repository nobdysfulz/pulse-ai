import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Download, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { CampaignTemplate } from '@/api/entities';
import { base44 } from '@/api/base44Client';

export default function CampaignTemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await CampaignTemplate.list('-created_date');
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploading(true);
    try {
      const { data } = await base44.integrations.Core.UploadPrivateFile({ file });
      
      await CampaignTemplate.create({
        fileName: file.name,
        fileUri: data.file_uri,
        isActive: true
      });

      toast.success('Template uploaded successfully');
      await loadTemplates();
    } catch (error) {
      console.error('Error uploading template:', error);
      toast.error('Failed to upload template');
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (template) => {
    try {
      // Set all to inactive first
      for (const t of templates) {
        if (t.isActive) {
          await CampaignTemplate.update(t.id, { isActive: false });
        }
      }
      
      // Set selected to active
      await CampaignTemplate.update(template.id, { isActive: true });
      
      toast.success('Active template updated');
      await loadTemplates();
    } catch (error) {
      console.error('Error updating active template:', error);
      toast.error('Failed to update active template');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await CampaignTemplate.delete(id);
      toast.success('Template deleted');
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDownload = async (template) => {
    try {
      const { data } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: template.fileUri,
        expires_in: 300
      });

      const link = document.createElement('a');
      link.href = data.signed_url;
      link.download = template.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
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
            <h3 className="text-lg font-semibold text-[#1E293B]">Campaign Templates</h3>
            <p className="text-sm text-[#475569] mt-1">Manage CSV templates for contact uploads</p>
          </div>
          <div>
            <Label htmlFor="template-upload" className="cursor-pointer">
              <Button as="span" disabled={uploading}>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Template'}
              </Button>
            </Label>
            <Input
              id="template-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#7C3AED]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#1E293B]">{template.fileName}</p>
                    {template.isActive && (
                      <span className="px-2 py-0.5 bg-[#22C55E] text-white text-xs rounded-full">Active</span>
                    )}
                  </div>
                  <p className="text-sm text-[#64748B] mt-0.5">
                    Uploaded {new Date(template.created_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(template)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                {!template.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetActive(template)}
                  >
                    Set Active
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="w-4 h-4 text-[#EF4444]" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-base text-[#475569]">No templates uploaded</p>
            <p className="text-sm text-[#64748B] mt-1">Upload your first campaign template</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}