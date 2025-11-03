import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Brain, Globe, RefreshCw, CheckCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function IntelligencePage() {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingActions, setProcessingActions] = useState(new Set());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const previousScores = useRef(null);
  const debounceTimer = useRef(null);

  const fetchGraphContext = useCallback(async (fresh = false, retryAttempt = 0) => {
    try {
      if (fresh) {
        setRefreshing(true);
        toast.info('Refreshing intelligence scores...');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('buildGraphContext', {
        body: { userId: user.id, fresh }
      });

      if (error) throw error;
      
      if (data) {
        setContext(data);
        setLastUpdated(new Date());
        setRetryCount(0); // Reset retry count on success
        
        if (fresh) {
          toast.success('Intelligence scores updated successfully!');
        }
      }
    } catch (error) {
      console.error('[Intelligence] Error fetching graph context:', error);
      
      // Retry logic for transient failures
      if (retryAttempt < 2 && !fresh) {
        console.log(`[Intelligence] Retrying fetch (attempt ${retryAttempt + 1})...`);
        setTimeout(() => {
          fetchGraphContext(fresh, retryAttempt + 1);
        }, 2000 * (retryAttempt + 1)); // Exponential backoff
      } else {
        // Show cached data if available
        const currentContext = context;
        if (currentContext) {
          toast.error('Failed to refresh. Showing cached data.');
        } else {
          toast.error('Failed to load intelligence data. Please try again later.');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    console.log('[Intelligence] Initial mount, fetching graph context...');
    fetchGraphContext();

    // Consolidate subscriptions - only listen to graph_context_cache
    // This prevents overload from multiple table subscriptions
    const channel = supabase
      .channel('intelligence-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'graph_context_cache' },
        (payload) => {
          console.log('[Intelligence] Graph context updated:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setContext(payload.new.context);
            setLastUpdated(new Date());
            toast.success('Intelligence data refreshed');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Intelligence] Realtime subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Intelligence] Subscription error');
          toast.error('Real-time updates disconnected');
        }
      });

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      supabase.removeChannel(channel);
    };
  }, []);

  const handleScoreUpdate = useCallback((scoreType, newScore) => {
    const currentScores = previousScores.current;
    
    if (!currentScores) {
      previousScores.current = { [scoreType]: newScore };
      return;
    }

    const oldScore = currentScores[scoreType];
    if (oldScore !== undefined && oldScore !== newScore) {
      const diff = newScore - oldScore;
      const isImprovement = diff > 0;
      
      toast(
        isImprovement 
          ? `${scoreType.toUpperCase()} score improved by ${Math.abs(diff).toFixed(1)} points! 🎉`
          : `${scoreType.toUpperCase()} score decreased by ${Math.abs(diff).toFixed(1)} points`,
        { 
          description: `New score: ${newScore}`,
          duration: 5000 
        }
      );
    }

    previousScores.current = {
      ...currentScores,
      [scoreType]: newScore
    };

    // Debounce refresh to prevent rapid successive calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      fetchGraphContext();
    }, 3000); // Wait 3 seconds before refreshing
  }, [fetchGraphContext]);

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

  const handleAddActionToTodo = async (action, index) => {
    try {
      setProcessingActions(prev => new Set(prev).add(index));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Map action type to daily_actions category
      const categoryMap = {
        'database': 'data_management',
        'agent_config': 'system_improvement',
        'market_analysis': 'market_research',
        'goal_setting': 'planning',
        'system_usage': 'system_improvement'
      };

      const category = categoryMap[action.type] || 'other';

      // Insert into daily_actions
      const { error: insertError } = await supabase
        .from('daily_actions')
        .insert({
          user_id: user.id,
          title: action.title,
          description: `AI-recommended action from Intelligence Engine`,
          category: category,
          priority: action.priority || 'medium',
          due_date: new Date().toISOString().split('T')[0],
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Log to ai_actions_log
      const { error: logError } = await supabase
        .from('ai_actions_log')
        .insert({
          user_id: user.id,
          action_type: 'recommendation_accepted',
          status: 'completed',
          action_data: {
            recommendation: action.title,
            type: action.type,
            priority: action.priority,
            source: 'intelligence_engine'
          }
        });

      if (logError) console.error('Failed to log action:', logError);

      toast.success('Action added to your To-Do list', {
        description: action.title,
        action: {
          label: 'View To-Do',
          onClick: () => window.location.href = '/todo'
        }
      });
    } catch (error) {
      console.error('Error adding action to todo:', error);
      toast.error('Failed to add action to To-Do list');
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
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
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Scores
            </>
          )}
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
            Personalized guidance powered by Pulse Intelligence • Convert recommendations into actionable tasks
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddActionToTodo(action, idx)}
                    disabled={processingActions.has(idx)}
                  >
                    {processingActions.has(idx) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Add to To-Do
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
