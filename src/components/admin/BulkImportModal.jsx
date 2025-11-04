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
  columnMapping,
  onImportComplete
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

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
      setValidationErrors([]);
      
      // Generate preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const previewLines = lines.slice(0, 6); // Header + 5 rows
        setPreview(previewLines);
      };
      reader.readAsText(selectedFile);
    } else {
      toast.error('Please select a CSV file');
      setFile(null);
      setPreview(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setValidationErrors([]);
    
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
          console.warn('Import errors:', data.errors);
          setValidationErrors(data.errors);
          toast.warning(`${data.errors.length} batches had errors. Check details below.`);
        }
        
        if (onImportComplete) {
          onImportComplete(data);
        }
        
        if (!data.errors || data.errors.length === 0) {
          onClose(true);
        }
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`Failed to import data: ${error.message}`);
    } finally {
      setUploading(false);
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

          {preview && (
            <div>
              <Label>Preview (first 5 rows)</Label>
              <div className="mt-2 bg-gray-50 p-3 rounded-md overflow-x-auto max-h-48 overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {preview.join('\n')}
                </pre>
              </div>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div>
              <Label className="text-red-600">Import Errors</Label>
              <div className="mt-2 bg-red-50 p-3 rounded-md space-y-1 max-h-32 overflow-y-auto">
                {validationErrors.map((error, idx) => (
                  <p key={idx} className="text-xs text-red-600">
                    Batch {error.batch} (rows {error.rows}): {error.error}
                  </p>
                ))}
              </div>
            </div>
          )}
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
