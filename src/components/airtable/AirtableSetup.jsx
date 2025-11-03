import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function AirtableSetup({ onSetupComplete }) {
  const [step, setStep] = useState('testing'); // testing, selecting, fetching, complete
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [sampleData, setSampleData] = useState([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setIsLoading(true);
    setConnectionStatus(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('airtableIntegration', {
        body: { action: 'test' }
      });
      if (error) throw error;
      
      if (data.success) {
        setConnectionStatus('success');
        setAvailableTables(data.tables);
        setStep('selecting');
        toast.success('Successfully connected to Airtable!');
      } else {
        setConnectionStatus('error');
        toast.error('Failed to connect to Airtable');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Connection test failed');
      console.error('Airtable connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableData = async () => {
    if (!selectedTable) return;
    
    setIsLoading(true);
    setStep('fetching');
    
    try {
      const { data, error } = await supabase.functions.invoke('airtableIntegration', {
        body: { 
          action: 'fetch', 
          tableName: selectedTable 
        }
      });
      if (error) throw error;
      
      if (data.records) {
        setSampleData(data.records.slice(0, 5)); // Show first 5 records
        setStep('complete');
        toast.success(`Fetched ${data.records.length} records from ${selectedTable}`);
        
        if (onSetupComplete) {
          onSetupComplete({
            tableName: selectedTable,
            recordCount: data.records.length,
            sampleData: data.records.slice(0, 3)
          });
        }
      } else {
        toast.error('No data found in selected table');
      }
    } catch (error) {
      toast.error('Failed to fetch table data');
      console.error('Fetch error:', error);
      setStep('selecting');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'testing':
        return (
          <div className="text-center py-8">
            <Database className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h3 className="text-lg font-semibold mb-2">Testing Airtable Connection</h3>
            <p className="text-slate-600 mb-4">Checking your Airtable credentials and available tables...</p>
            {isLoading && <Loader2 className="w-6 h-6 animate-spin mx-auto" />}
            
            {connectionStatus === 'error' && (
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2 text-red-600 mb-4">
                  <AlertCircle className="w-5 h-5" />
                  <span>Connection Failed</span>
                </div>
                <Button onClick={testConnection} variant="outline">
                  Retry Connection
                </Button>
              </div>
            )}
          </div>
        );

      case 'selecting':
        return (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-600 font-medium">Connected Successfully</span>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Select Knowledge Base Table</h3>
            <p className="text-slate-600 mb-4">
              Choose the Airtable table that contains your knowledge base content:
            </p>
            
            <div className="space-y-4">
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.name}>
                      <div>
                        <div className="font-medium">{table.name}</div>
                        {table.description && (
                          <div className="text-xs text-slate-500">{table.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={fetchTableData} 
                disabled={!selectedTable || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Fetching Data...
                  </>
                ) : (
                  'Fetch Sample Data'
                )}
              </Button>
            </div>
          </div>
        );

      case 'fetching':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
            <h3 className="text-lg font-semibold mb-2">Fetching Data</h3>
            <p className="text-slate-600">Loading sample data from {selectedTable}...</p>
          </div>
        );

      case 'complete':
        return (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-600 font-medium">Setup Complete</span>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Sample Data from {selectedTable}</h3>
            
            <div className="space-y-3">
              {sampleData.map((record, index) => (
                <Card key={record.id} className="p-3">
                  <div className="text-sm">
                    <Badge variant="outline" className="mb-2">Record {index + 1}</Badge>
                    <div className="space-y-1">
                      {Object.entries(record).filter(([key]) => key !== 'id').map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium text-slate-700 min-w-[100px]">{key}:</span>
                          <span className="text-slate-600">{String(value).slice(0, 100)}{String(value).length > 100 ? '...' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Airtable Knowledge Base Setup</CardTitle>
      </CardHeader>
      <CardContent>
        {renderStep()}
      </CardContent>
    </Card>
  );
}