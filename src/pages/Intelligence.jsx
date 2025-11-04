import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Brain, Globe, RefreshCw, CheckCircle, Plus, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

const cleanJsonText = (value) =>
  typeof value === 'string' ? value.replace(/```json\s*|```/gi, '').trim() : value;

const normalizeInsights = (insights) => {
  if (!insights) {
    return { message: null, highlights: [], actions: [] };
  }

  let parsed = insights;

  // Handle string insights (parse JSON if needed)
  if (typeof insights === 'string') {
    try {
      parsed = JSON.parse(cleanJsonText(insights));
    } catch (error) {
      // If it's not JSON, treat as plain text
      return { message: insights, highlights: [], actions: [] };
    }
  }

  // Ensure parsed is an object
  if (!parsed || typeof parsed !== 'object') {
    return { message: null, highlights: [], actions: [] };
  }

  // Extract message - check both 'message' and 'summary' fields
  const messageParts = [];
  if (typeof parsed.message === 'string') messageParts.push(parsed.message);
  if (typeof parsed.summary === 'string') messageParts.push(parsed.summary);
  if (Array.isArray(parsed.summary)) {
    parsed.summary.forEach(item => {
      if (typeof item === 'string') messageParts.push(item);
    });
  }

  // Extract highlights from various possible keys
  const highlightSources = ['insights', 'highlights', 'key_findings', 'opportunities', 'risks'];
  const highlights = [];
  highlightSources.forEach((key) => {
    const value = parsed[key];
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === 'string') {
          highlights.push(item);
        } else if (item && typeof item === 'object' && item.text) {
          highlights.push(item.text);
        }
      });
    } else if (typeof value === 'string') {
      highlights.push(value);
    }
  });

  // Extract actions array
  const actions = Array.isArray(parsed.actions)
    ? parsed.actions.filter(action => action && typeof action === 'object')
    : [];

  return {
    message: messageParts.filter(Boolean).join('\n\n') || null,
    highlights: [...new Set(highlights)], // Remove duplicates
    actions
  };
};

export default function IntelligencePage() {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingActions, setProcessingActions] = useState(new Set());
  const [lastUpdated, setLastUpdated] = useState(null);
  const previousScores = useRef(null);
  const debounceTimer = useRef(null);

  const normalizedInsights = useMemo(() => normalizeInsights(context?.insights), [context?.insights]);

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
        }, 2000 * (retryAttempt + 1));
      } else {
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
  }, [context]);

  useEffect(() => {
    fetchGraphContext();

    const channel = supabase
      .channel('intelligence-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'graph_context_cache' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setContext(payload.new.context);
            setLastUpdated(new Date());
          }
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      supabase.removeChannel(channel);
    };
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

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return 'Strong';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'At Risk';
    return 'Critical';
  };

  const handleAddActionToTodo = async (action, index) => {
    try {
      setProcessingActions(prev => new Set(prev).add(index));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const categoryMap = {
        'database': 'data_management',
        'agent_config': 'system_improvement',
        'market_analysis': 'market_research',
        'goal_setting': 'planning',
        'system_usage': 'system_improvement',
        'learning': 'training'
      };

      const category = categoryMap[action.type] || 'other';

      const { error: insertError } = await supabase
        .from('daily_actions')
        .insert({
          user_id: user.id,
          title: action.title,
          description: `AI-recommended action from Pulse Intelligence Core`,
          category: category,
          priority: action.priority || 'medium',
          due_date: new Date().toISOString().split('T')[0],
          status: 'pending'
        });

      if (insertError) throw insertError;

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
            source: 'pgic'
          }
        });

      if (logError) console.error('Failed to log action:', logError);

      toast.success('Action added to your To-Do list', {
        description: action.title
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
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#7C3AED] mx-auto mb-4" />
          <p className="text-[#475569] font-medium">Loading Intelligence Data...</p>
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="text-center">
          <Brain className="w-16 h-16 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-[#475569] font-medium text-lg">No intelligence data available</p>
          <Button onClick={() => fetchGraphContext(true)} className="mt-4 bg-[#7C3AED] hover:bg-[#6D28D9]">
            Load Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#1E293B] mb-2">Pulse Intelligence Core</h1>
            <p className="text-[#475569] text-lg">Your business intelligence powered by PGIC</p>
            {lastUpdated && (
              <p className="text-sm text-[#64748B] mt-1">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-12 px-6"
          >
            {refreshing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh Scores
              </>
            )}
          </Button>
        </div>

        {/* Score Cards - Top Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* PULSE Card */}
          <Card className={`border shadow-sm ${getScoreBgColor(context.scores.pulse)}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <TrendingUp className="w-6 h-6 text-violet-600" />
                </div>
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">PULSE</span>
              </div>
              <CardTitle className={`text-6xl font-bold ${getScoreColor(context.scores.pulse)} mb-2`}>
                {context.scores.pulse}
              </CardTitle>
              <CardDescription className="text-base font-medium text-[#475569]">
                Execution & Consistency
              </CardDescription>
              <div className="mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  context.scores.pulse >= 70 ? 'bg-green-100 text-green-700' : 
                  context.scores.pulse >= 40 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {getScoreStatus(context.scores.pulse)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="bg-white rounded-b-lg pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748B]">Completion Rate</span>
                  <span className="text-base font-bold text-[#1E293B]">
                    {context.metrics.pulse?.completionRate || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748B]">Last 7 Days</span>
                  <span className="text-base font-bold text-[#1E293B]">
                    {context.metrics.pulse?.last7DaysActions || 0} actions
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GANE Card */}
          <Card className={`border shadow-sm ${getScoreBgColor(context.scores.gane)}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">GANE</span>
              </div>
              <CardTitle className={`text-6xl font-bold ${getScoreColor(context.scores.gane)} mb-2`}>
                {context.scores.gane}
              </CardTitle>
              <CardDescription className="text-base font-medium text-[#475569]">
                Intelligence & Predictability
              </CardDescription>
              <div className="mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  context.scores.gane >= 70 ? 'bg-green-100 text-green-700' : 
                  context.scores.gane >= 40 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {getScoreStatus(context.scores.gane)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="bg-white rounded-b-lg pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748B]">Systems Active</span>
                  <span className="text-base font-bold text-[#1E293B]">
                    {context.metrics.gane?.systemsEnabled || 0}/{context.metrics.gane?.totalSystems || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748B]">Guidelines</span>
                  <span className="text-base font-bold text-[#1E293B]">
                    {context.metrics.gane?.guidelinesCount || 0} configured
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MORO Card */}
          <Card className={`border shadow-sm ${getScoreBgColor(context.scores.moro)}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">MORO</span>
              </div>
              <CardTitle className={`text-6xl font-bold ${getScoreColor(context.scores.moro)} mb-2`}>
                {context.scores.moro}
              </CardTitle>
              <CardDescription className="text-base font-medium text-[#475569]">
                Market Opportunity
              </CardDescription>
              <div className="mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  context.scores.moro >= 70 ? 'bg-green-100 text-green-700' : 
                  context.scores.moro >= 40 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {getScoreStatus(context.scores.moro)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="bg-white rounded-b-lg pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748B]">Market Trend</span>
                  <span className="text-base font-bold text-[#1E293B] capitalize">
                    {context.metrics.moro?.marketTrend || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748B]">Inventory</span>
                  <span className="text-base font-bold text-[#1E293B] capitalize">
                    {context.metrics.moro?.inventoryLevel || 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Intelligence Score */}
        <Card className="border shadow-sm bg-gradient-to-br from-violet-50 to-indigo-50">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl text-[#1E293B]">Overall Intelligence Score</CardTitle>
            <CardDescription className="text-base text-[#475569]">
              Combined performance across all three dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-6">
                <span className={`text-8xl font-bold ${getScoreColor(context.scores.overall)}`}>
                  {context.scores.overall}
                </span>
                <div className="space-y-2">
                  <p className="text-sm text-[#64748B] font-medium uppercase tracking-wider">Status</p>
                  <p className="text-3xl font-bold text-[#1E293B]">
                    {getScoreStatus(context.scores.overall)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#64748B] font-medium uppercase tracking-wider mb-2">Growth Potential</p>
                <div className="flex items-center gap-2">
                  {(context.forecast?.growthPotential || 0) >= 0 ? (
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  )}
                  <p className={`text-5xl font-bold ${
                    (context.forecast?.growthPotential || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {context.forecast?.growthPotential || 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights & Recommendations */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-2xl text-[#1E293B]">AI Insights & Recommendations</CardTitle>
            <CardDescription className="text-base text-[#475569]">
              Personalized guidance powered by Pulse Intelligence
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="p-6 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-200 space-y-4">
              {normalizedInsights.message ? (
                normalizedInsights.message.split(/\n\s*\n/).map((paragraph, idx) => (
                  <p key={idx} className="text-[#1E293B] leading-relaxed text-base">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-[#1E293B] leading-relaxed text-base">No insights available at this time.</p>
              )}

              {normalizedInsights.highlights.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-[#4338CA] tracking-wide uppercase">Key Highlights</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[#1E293B]">
                    {normalizedInsights.highlights.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {normalizedInsights.actions.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-[#1E293B]">Recommended Actions</h4>
                <div className="grid gap-4">
                  {normalizedInsights.actions.map((action, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-5 bg-white border-2 border-[#E2E8F0] rounded-xl hover:border-violet-300 hover:shadow-md transition-all"
                    >
                      <div className="p-2 bg-violet-100 rounded-lg flex-shrink-0 mt-1">
                        <CheckCircle className="w-6 h-6 text-violet-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-base text-[#1E293B] mb-1">{action.title}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-medium text-[#64748B] bg-[#F1F5F9] px-3 py-1 rounded-full capitalize">
                            {action.type?.replace('_', ' ')}
                          </span>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            action.priority === 'high' ? 'bg-red-100 text-red-700' :
                            action.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {action.priority} priority
                          </span>
                        </div>
                      </div>
                      <Button
                        size="lg"
                        className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex-shrink-0"
                        onClick={() => handleAddActionToTodo(action, idx)}
                        disabled={processingActions.has(idx)}
                      >
                        {processingActions.has(idx) ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-5 h-5 mr-2" />
                            Add to To-Do
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}