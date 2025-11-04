
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Database, Loader2, RefreshCw, ExternalLink, Table, AlertTriangle, Shield } from 'lucide-react'; // Added Shield import
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/nextjs'; // Assuming Clerk for user authentication; adjust if using a different auth solution

export default function AirtableSyncStatusPage() {
  const { user } = useUser(); // Get user object from the authentication hook

  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  // Helper function to create page URLs based on page name
  // This can be replaced with a more robust routing solution if available globally.
  const createPageUrl = (pageName) => {
    switch (pageName) {
      case 'Dashboard':
        return '/dashboard'; // Replace with actual dashboard path
      default:
        return '/'; // Default path
    }
  };

  useEffect(() => {
    // Only auto-check connection on page load, and only if the user is authenticated.
    // If 'user' is null (e.g., still loading auth state or not logged in), do not attempt connection.
    if (user) { 
      checkConnection();
    }
  }, [user]); // Re-run effect if user object changes (e.g., logs in/out, or finishes loading)

  const checkConnection = async () => {
    setIsLoading(true);
    setConnectionStatus('unknown');
    setAvailableTables([]); // Clear previous data
    setErrorDetails(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('airtableIntegration', {
        body: { action: 'test' }
      });
      if (error) throw error;
      
      if (data && data.success) {
        setConnectionStatus('connected');
        // Only set tables if we actually received them
        setAvailableTables(data.tables || []);
        setLastSyncTime(new Date().toLocaleString());
        toast.success(`Connected successfully! Found ${data.tables?.length || 0} tables.`);
      } else {
        setConnectionStatus('error');
        setAvailableTables([]); // Ensure no stale data
        setErrorDetails({
          error: data?.error || 'Unknown error',
          details: data?.details || 'No additional details available',
          troubleshooting: data?.troubleshooting || [],
          statusCode: data?.statusCode || null
        });
        toast.error(data?.error || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      setAvailableTables([]); // Ensure no stale data
      setErrorDetails({
        error: 'Network or Function Error',
        details: error.message || 'Unable to reach the Airtable integration function.',
        troubleshooting: [
          'Check your internet connection',
          'Verify the Airtable function is deployed',
          'Ensure environment variables are set',
          'Try again in a few minutes'
        ]
      });
      toast.error('Unable to connect to Airtable');
      console.error('Connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionBadge = () => {
    if (isLoading) {
      return (
        <Badge variant="outline">
          <Loader2 className="w-3 h-3 animate-spin mr-1" />
          Testing...
        </Badge>
      );
    }
    
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'unknown':
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" />
            Not Tested
          </Badge>
        );
    }
  };

  if (!user) {
    // If the user object is not available (e.g., not logged in), display an access denied message.
    // In a production app, you might also check a 'isLoaded' flag from the auth hook
    // to differentiate between 'loading user info' and 'user is definitively not logged in'.
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-6">
              You must be logged in to access this page.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <a href={createPageUrl('Dashboard')}>Return to Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Airtable Knowledge Base</h1>
          <p className="text-slate-600 mt-1">Connect and manage your Airtable knowledge base for AI coaching</p>
        </div>
        <Button onClick={checkConnection} disabled={isLoading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-500 mb-2">Connection Status</p>
              {getConnectionBadge()}
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-2">Last Tested</p>
              <p className="text-sm font-medium">
                {lastSyncTime || 'Never tested'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-2">Available Tables</p>
              <p className="text-sm font-medium">
                {connectionStatus === 'connected' 
                  ? `${availableTables.length} ${availableTables.length === 1 ? 'table' : 'tables'}`
                  : 'Not connected'
                }
              </p>
            </div>
          </div>

          {/* Error Details - Only shown when there's an actual error */}
          {connectionStatus === 'error' && errorDetails && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800 mb-2">{errorDetails.error}</h4>
                  {errorDetails.details && (
                    <p className="text-sm text-red-700 mb-3">{errorDetails.details}</p>
                  )}
                  {errorDetails.statusCode && (
                    <p className="text-xs text-red-600 mb-3">HTTP Status: {errorDetails.statusCode}</p>
                  )}
                  {errorDetails.troubleshooting && errorDetails.troubleshooting.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-800 mb-2">Troubleshooting Steps:</p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {errorDetails.troubleshooting.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Tables Card - Only shown when connected and tables exist */}
      {connectionStatus === 'connected' && availableTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="w-5 h-5" />
              Available Tables ({availableTables.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTables.map((table) => (
                <Card key={table.id} className="p-4 border-l-4 border-l-purple-500">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-slate-900">{table.name}</h4>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                  {table.description && table.description.trim() && (
                    <p className="text-sm text-slate-600 mb-2">{table.description}</p>
                  )}
                  <div className="text-xs text-slate-500">
                    Table ID: {table.id}
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show message when connected but no tables found */}
      {connectionStatus === 'connected' && availableTables.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Table className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Tables Found</h3>
            <p className="text-slate-600">
              Your Airtable base appears to be empty or the API key doesn't have access to view tables.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Configuration Help Card */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Required Environment Variables</h4>
            <div className="bg-slate-50 p-3 rounded-md text-sm space-y-1">
              <div><code className="text-purple-600 font-mono">AIRTABLE_API_KEY</code> - Your Airtable Personal Access Token</div>
              <div><code className="text-purple-600 font-mono">AIRTABLE_BASE_ID</code> - Your Airtable Base ID</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-slate-900 mb-2">How to Get Your Credentials</h4>
            <ol className="text-sm text-slate-600 space-y-2 ml-4 list-decimal">
              <li>
                Go to{' '}
                <a 
                  href="https://airtable.com/create/tokens" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-purple-600 hover:underline"
                >
                  airtable.com/create/tokens
                </a>
              </li>
              <li>Create a new personal access token with <strong>read permissions</strong> for your base</li>
              <li>Copy your Base ID from your Airtable base URL (starts with "app")</li>
              <li>Add both values in Settings → Integrations → Airtable</li>
            </ol>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Once connected, the AI Advisor will be able to reference information from your Airtable base when answering questions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
