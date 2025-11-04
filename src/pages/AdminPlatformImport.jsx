import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminPlatformImport() {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState(null);

  const handleImport = async () => {
    setImporting(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('importPlatformData', {
        body: {}
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Successfully imported ${data.totalImported} records!`);
        setResults(data.results);
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`Failed to import data: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExternalSync = async (dryRun = false) => {
    setSyncing(true);
    setSyncResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('syncExternalPlatformData', {
        body: { dryRun }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(dryRun ? 'Preview loaded successfully!' : `Successfully synced platform data!`);
        setSyncResults(data);
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`Failed to sync data: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>External Database Sync</CardTitle>
          <CardDescription>
            Replace local platform data with production data from your external Supabase instance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>Info:</strong> This will sync data from your production database for:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Task Templates (~159 records)</li>
                <li>Client Personas (~13 records)</li>
                <li>Agent Voices (~5 records)</li>
                <li>Call Logs (~30 records)</li>
                <li>Featured Content Packs (~3 records)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={() => handleExternalSync(true)}
              disabled={syncing}
              variant="outline"
              size="lg"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading Preview...
                </>
              ) : (
                'Preview Counts'
              )}
            </Button>
            <Button
              onClick={() => handleExternalSync(false)}
              disabled={syncing}
              size="lg"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync Now'
              )}
            </Button>
          </div>

          {syncResults && (
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-lg">
                {syncResults.dryRun ? 'Preview Results' : 'Sync Results'}
              </h3>
              
              {Object.entries(syncResults.results).map(([table, result]) => (
                <Card key={table}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.errors && result.errors.length > 0 ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        <span className="font-medium capitalize">
                          {table.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {syncResults.dryRun 
                          ? `${result.count} records found`
                          : `${result.imported} records imported`
                        }
                      </span>
                    </div>
                    
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2 text-sm text-red-600">
                        <p className="font-medium">Errors:</p>
                        <ul className="list-disc list-inside">
                          {result.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSV Import (Legacy)</CardTitle>
          <CardDescription>
            Import platform data from CSV files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>Warning:</strong> This will replace all existing data in the following tables:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Task Templates (159 records)</li>
                <li>Client Personas (13 records)</li>
                <li>Agent Voices (5 records)</li>
                <li>Call Logs (30 records)</li>
                <li>Featured Content Packs (3 records)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleImport}
            disabled={importing}
            size="lg"
            className="w-full"
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Importing Platform Data...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Start Import
              </>
            )}
          </Button>

          {results && (
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-lg">Import Results</h3>
              
              {Object.entries(results).map(([table, result]) => (
                <Card key={table}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium capitalize">
                          {table.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {result.imported} records imported
                      </span>
                    </div>
                    
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2 text-sm text-red-600">
                        <p className="font-medium">Errors:</p>
                        <ul className="list-disc list-inside">
                          {result.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
