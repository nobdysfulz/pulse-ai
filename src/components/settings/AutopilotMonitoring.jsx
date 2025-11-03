import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Activity, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import LoadingIndicator from '../ui/LoadingIndicator';

export default function AutopilotMonitoring() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAutopilotActivities();
  }, []);

  const loadAutopilotActivities = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('getUserAutopilotActivity', {
        body: {
          timeRange: '7d',
          limit: 100
        }
      });

      if (response.data && response.data.activities) {
        setActivities(response.data.activities);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading autopilot activities:', error);
      toast.error('Failed to load autopilot activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAutopilotActivities();
    setRefreshing(false);
    toast.success('Activity log refreshed');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionTypeLabel = (actionType) => {
    const labels = {
      'send_email': 'Email Sent',
      'schedule_appointment': 'Appointment Scheduled',
      'create_task': 'Task Created',
      'research': 'Research Performed',
      'create_document': 'Document Created',
      'analyze_performance': 'Performance Analysis',
      'generate_content': 'Content Generated',
      'call_tool': 'Tool Executed'
    };
    return labels[actionType] || actionType;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingIndicator text="Loading autopilot activity..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-[#1E293B]">Autopilot Activity Monitor</h3>
          <p className="text-sm text-[#64748B]">Real-time log of all autopilot actions across users</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1E293B] mb-2">No Activity Yet</h3>
            <p className="text-sm text-[#64748B]">
              Autopilot actions will appear here once users start using AI agents
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(activity.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-[#1E293B]">
                          {getActionTypeLabel(activity.actionType)}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {activity.agentType?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#64748B] mb-2">
                        User: {activity.userEmail || activity.userId}
                      </p>
                      {activity.actionDetails && (
                        <div className="text-xs text-[#94A3B8] bg-slate-50 p-2 rounded">
                          {typeof activity.actionDetails === 'string' 
                            ? activity.actionDetails 
                            : JSON.stringify(JSON.parse(activity.actionDetails), null, 2)}
                        </div>
                      )}
                      {activity.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">Error: {activity.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-[#94A3B8] whitespace-nowrap">
                    {new Date(activity.created_date).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}