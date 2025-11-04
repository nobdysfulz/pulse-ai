import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { importConfigs, getEntityOptions } from '@/config/importConfigs';
import BulkImportModal from '@/components/admin/BulkImportModal';

const DataImportManager = () => {
  const [selectedEntity, setSelectedEntity] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const entityOptions = getEntityOptions();
  const currentConfig = selectedEntity ? importConfigs[selectedEntity] : null;

  const handleDownloadTemplate = () => {
    if (!currentConfig) return;

    const csvContent = currentConfig.sampleCsvData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEntity}_import_template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportComplete = (results) => {
    setImportResults(results);
    setShowImportModal(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Data Import Manager</h2>
        <p className="text-muted-foreground mt-2">
          Bulk import data from your Base44 exports or other sources
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Data Type</CardTitle>
          <CardDescription>
            Choose which type of data you want to import
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type</label>
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type to import..." />
                </SelectTrigger>
                <SelectContent>
                  {entityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentConfig && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>{currentConfig.description}</AlertDescription>
              </Alert>
            )}
          </div>

          {selectedEntity && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download CSV Template
                </Button>
                <Button
                  onClick={() => setShowImportModal(true)}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import Data
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Import Instructions:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Download the CSV template above</li>
                  <li>Fill in your data following the template structure</li>
                  <li>Save your file as CSV format</li>
                  <li>Click "Import Data" and select your file</li>
                  <li>Review the preview and confirm the import</li>
                </ol>
                {currentConfig.requiredFields.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    <strong>Required fields:</strong> {currentConfig.requiredFields.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResults.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Import Completed
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Import Issues
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{importResults.total || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Imported</p>
                <p className="text-2xl font-bold text-green-600">{importResults.imported || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-destructive">
                  {importResults.errors?.length || 0}
                </p>
              </div>
            </div>

            {importResults.errors && importResults.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Errors encountered:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {importResults.errors.map((error, idx) => (
                        <li key={idx} className="text-sm">
                          Batch {error.batch} (rows {error.rows}): {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {showImportModal && currentConfig && (
        <BulkImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          entityType={currentConfig.tableName}
          entityLabel={currentConfig.label}
          sampleCsvData={currentConfig.sampleCsvData}
          columnMapping={currentConfig.columnMapping}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
};

export default DataImportManager;
