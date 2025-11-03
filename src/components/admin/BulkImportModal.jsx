import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function BulkImportModal({ 
  isOpen, 
  onClose, 
  entityType, 
  entityLabel,
  sampleCsvData,
  columnMapping 
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityType}_template.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
    } else {
      toast.error('Please select a CSV file');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const csvText = await file.text();

      const { data, error } = await supabase.functions.invoke('bulkImportData', {
        body: {
          entityType,
          csvData: csvText,
          columnMapping
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Successfully imported ${data.imported} of ${data.total} ${entityLabel}`);
        if (data.errors && data.errors.length > 0) {
          console.error('Import errors:', data.errors);
          toast.warning(`${data.errors.length} batch(es) had errors - check console for details`);
        }
        onClose(true); // Pass true to indicate refresh needed
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`Failed to import data: ${error.message}`);
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import {entityLabel} from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Step 1: Download Template</Label>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="w-full mt-2"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV Template
            </Button>
          </div>

          <div>
            <Label>Step 2: Upload Completed CSV</Label>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-2"
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || uploading}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
