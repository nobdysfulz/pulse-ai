import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Brain, Globe, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function IntelligencePage() {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGraphContext = async (fresh = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('buildGraphContext', {
        body: { userId: user.id, fresh }
      });

      if (error) throw error;
      setContext(data);
    } catch (error) {
      console.error('Error fetching graph context:', error);
      toast.error('Failed to load intelligence data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGraphContext();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGraphContext(true);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return 'Elite';
    if (score >= 70) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Critical';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!context) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No intelligence data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pulse Intelligence Core</h1>
          <p className="text-muted-foreground mt-1">
            Your business intelligence powered by PGIC
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Score Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-5 h-5 text-violet-600" />
              <span className="text-xs text-muted-foreground">PULSE</span>
            </div>
            <CardTitle className={`text-4xl font-bold ${getScoreColor(context.scores.pulse)}`}>
              {context.scores.pulse}
            </CardTitle>
            <CardDescription>
              Execution & Consistency • {getScoreStatus(context.scores.pulse)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium">
                  {context.metrics.pulse?.completionRate || 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last 7 Days</span>
                <span className="font-medium">
                  {context.metrics.pulse?.last7DaysActions || 0} actions
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Brain className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-muted-foreground">GANE</span>
            </div>
            <CardTitle className={`text-4xl font-bold ${getScoreColor(context.scores.gane)}`}>
              {context.scores.gane}
            </CardTitle>
            <CardDescription>
              Intelligence & Predictability • {getScoreStatus(context.scores.gane)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Systems Active</span>
                <span className="font-medium">
                  {context.metrics.gane?.systemsEnabled || 0}/{context.metrics.gane?.totalSystems || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guidelines</span>
                <span className="font-medium">
                  {context.metrics.gane?.guidelinesCount || 0} configured
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Globe className="w-5 h-5 text-green-600" />
              <span className="text-xs text-muted-foreground">MORO</span>
            </div>
            <CardTitle className={`text-4xl font-bold ${getScoreColor(context.scores.moro)}`}>
              {context.scores.moro}
            </CardTitle>
            <CardDescription>
              Market Opportunity • {getScoreStatus(context.scores.moro)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Trend</span>
                <span className="font-medium capitalize">
                  {context.metrics.moro?.marketTrend || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inventory</span>
                <span className="font-medium capitalize">
                  {context.metrics.moro?.inventoryLevel || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Score */}
      <Card className="border-2 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20">
        <CardHeader>
          <CardTitle>Overall Intelligence Score</CardTitle>
          <CardDescription>
            Combined performance across all dimensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-4">
            <span className={`text-6xl font-bold ${getScoreColor(context.scores.overall)}`}>
              {context.scores.overall}
            </span>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Growth Potential</p>
              <p className="text-2xl font-semibold text-primary">
                {context.forecast.growthPotential}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights & Recommendations</CardTitle>
          <CardDescription>
            Personalized guidance powered by Pulse Intelligence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm leading-relaxed">{context.insights.message}</p>
          </div>

          {context.insights.actions && context.insights.actions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recommended Actions</h4>
              {context.insights.actions.map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {action.type?.replace('_', ' ')} • {action.priority} priority
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
