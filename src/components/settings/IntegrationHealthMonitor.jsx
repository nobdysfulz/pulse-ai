import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle, Clock, RefreshCw, Activity } from 'lucide-react';
import { toast } from 'sonner';
import LoadingIndicator from '../ui/LoadingIndicator';

const IntegrationCard = ({ name, status, lastChecked, responseTime, errorMessage }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {status === 'healthy' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : status === 'degraded' ? (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <h4 className="font-semibold text-[#1E293B]">{name}</h4>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#64748B] mb-2">
            {responseTime && (
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {responseTime}ms
              </div>
            )}
            {lastChecked && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(lastChecked).toLocaleTimeString()}
              </div>
            )}
          </div>
          {errorMessage && (
            <p className="text-xs text-red-600 mt-2">{errorMessage}</p>
          )}
        </div>
        <Badge
          className={
            status === 'healthy'
              ? 'bg-green-100 text-green-800'
              : status === 'degraded'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }
        >
          {status}
        </Badge>
      </div>
    </CardContent>
  </Card>
);

export default function IntegrationHealthMonitor() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealthStatus();
    const interval = setInterval(loadHealthStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const loadHealthStatus = async () => {
    const isInitialLoad = !healthStatus;
    if (isInitialLoad) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await base44.functions.invoke('checkIntegrationStatus');
      if (response.data) {
        setHealthStatus(response.data);
      }
    } catch (error) {
      console.error('Error checking integration health:', error);
      if (isInitialLoad) {
        toast.error('Failed to load integration health status');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingIndicator text="Checking integrations..." size="lg" />
      </div>
    );
  }

  if (!healthStatus) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1E293B] mb-2">No Health Data Available</h3>
          <p className="text-sm text-[#64748B]">Unable to fetch integration health status</p>
        </CardContent>
      </Card>
    );
  }

  const overallHealthy = healthStatus.integrations?.every(i => i.status === 'healthy');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1E293B]">Integration Health Monitor</h3>
          <p className="text-sm text-[#64748B]">Real-time status of external service connections</p>
        </div>
        <Button onClick={loadHealthStatus} variant="outline" size="sm" disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={overallHealthy ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {overallHealthy ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            )}
            <div>
              <h4 className="font-semibold text-[#1E293B]">
                {overallHealthy ? 'All Systems Operational' : 'Some Systems Degraded'}
              </h4>
              <p className="text-sm text-[#64748B]">
                Last checked: {new Date(healthStatus.lastChecked).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthStatus.integrations?.map((integration, index) => (
          <IntegrationCard key={index} {...integration} />
        ))}
      </div>
    </div>
  );
}