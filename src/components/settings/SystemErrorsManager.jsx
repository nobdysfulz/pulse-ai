
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { AlertCircle, AlertTriangle, Info, Search, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import LoadingIndicator from '../ui/LoadingIndicator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function SystemErrorsManager() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedError, setSelectedError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadErrors();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadErrors, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadErrors = async () => {
    setLoading(true);
    try {
      // This would fetch from a SystemError entity (you'll need to create this)
      // For now, we'll use a placeholder
      const response = await base44.functions.invoke('getSystemErrors');
      setErrors(response.data?.errors || []); // Updated to access 'errors' property
    } catch (error) {
      console.error('Error loading system errors:', error);
      toast.error('Failed to load system errors');
      setErrors([]); // Clear errors on failure
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-100 text-blue-800',
    };
    return (
      <Badge className={colors[severity] || 'bg-slate-100 text-slate-800'}>
        {severity}
      </Badge>
    );
  };

  const filteredErrors = errors.filter(error => {
    const matchesSearch = !searchTerm || 
      error.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.functionName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || error.severity === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingIndicator text="Loading system errors..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1E293B]">System Errors</h3>
          <p className="text-sm text-[#64748B]">Monitor and troubleshoot system errors</p>
        </div>
        <Button onClick={loadErrors} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94A3B8] w-4 h-4" />
          <Input
            placeholder="Search errors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Errors List */}
      <div className="space-y-2">
        {filteredErrors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1E293B] mb-2">No Errors Found</h3>
              <p className="text-sm text-[#64748B]">
                {searchTerm || severityFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'System is running smoothly! 🎉'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredErrors.map((error) => (
            <Card key={error.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(error.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-[#1E293B] truncate">
                          {error.functionName || 'Unknown Function'}
                        </h4>
                        {getSeverityBadge(error.severity)}
                      </div>
                      <p className="text-sm text-[#64748B] mb-2 line-clamp-2">
                        {error.message}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-[#94A3B8]">
                        <span>{format(new Date(error.created_date), 'MMM d, yyyy HH:mm')}</span>
                        {error.userId && <span>• User: {error.userId}</span>}
                        {error.count > 1 && <span>• Occurred {error.count} times</span>}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedError(error);
                      setShowDetails(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Error Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
          </DialogHeader>
          {selectedError && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-[#64748B]">Function</Label>
                <p className="font-medium text-[#1E293B]">{selectedError.functionName}</p>
              </div>
              <div>
                <Label className="text-xs text-[#64748B]">Message</Label>
                <p className="text-sm text-[#1E293B]">{selectedError.message}</p>
              </div>
              <div>
                <Label className="text-xs text-[#64748B]">Stack Trace</Label>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {selectedError.stackTrace || 'No stack trace available'}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#64748B]">Timestamp</Label>
                  <p className="text-sm text-[#1E293B]">
                    {format(new Date(selectedError.created_date), 'MMM d, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-[#64748B]">Severity</Label>
                  <div className="mt-1">{getSeverityBadge(selectedError.severity)}</div>
                </div>
              </div>
              {selectedError.metadata && (
                <div>
                  <Label className="text-xs text-[#64748B]">Additional Data</Label>
                  <pre className="bg-slate-50 p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedError.metadata), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Label = ({ children, className }) => (
  <label className={`block font-medium mb-1 ${className}`}>{children}</label>
);
