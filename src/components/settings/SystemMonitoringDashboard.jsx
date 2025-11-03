import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Users, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import LoadingIndicator from '../ui/LoadingIndicator';

const StatCard = ({ title, value, change, icon: Icon, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {Icon && <Icon className="h-4 w-4 text-slate-500" />}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change !== undefined && (
        <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
          {trend === 'up' ? (
            <TrendingUp className="w-3 h-3 text-green-600" />
          ) : trend === 'down' ? (
            <TrendingDown className="w-3 h-3 text-red-600" />
          ) : null}
          <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : ''}>
            {change}
          </span>
        </p>
      )}
    </CardContent>
  </Card>
);

const StatusIndicator = ({ status, label }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
    <span className="text-sm font-medium text-[#1E293B]">{label}</span>
    {status === 'healthy' ? (
      <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Healthy
      </Badge>
    ) : status === 'warning' ? (
      <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Warning
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Error
      </Badge>
    )}
  </div>
);

export default function SystemMonitoringDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await supabase.functions.invoke('getPlatformMetrics', { body: {} });
      if (response.data) {
        setMetrics(response.data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error loading platform metrics:', error);
      toast.error('Failed to load system metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingIndicator text="Loading system metrics..." size="lg" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1E293B] mb-2">No Metrics Available</h3>
          <p className="text-sm text-[#64748B]">System metrics are not available at the moment</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#7C3AED', '#E4018B', '#3B82F6', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1E293B]">System Monitoring</h3>
          <p className="text-sm text-[#64748B]">Real-time platform health and performance metrics</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <Clock className="w-4 h-4" />
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={metrics.totalUsers || 0}
          change={`+${metrics.newUsersToday || 0} today`}
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Active Users (7d)"
          value={metrics.activeUsers7d || 0}
          change={`${metrics.activeUserRate || 0}% of total`}
          icon={Activity}
        />
        <StatCard
          title="API Calls (24h)"
          value={metrics.apiCalls24h || 0}
          change={`${metrics.avgResponseTime || 0}ms avg`}
          icon={Zap}
        />
        <StatCard
          title="Error Rate"
          value={`${metrics.errorRate || 0}%`}
          change={`${metrics.totalErrors || 0} errors today`}
          icon={AlertCircle}
          trend={metrics.errorRate > 5 ? 'down' : 'up'}
        />
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusIndicator
            status={metrics.databaseStatus || 'healthy'}
            label="Database"
          />
          <StatusIndicator
            status={metrics.apiStatus || 'healthy'}
            label="API Services"
          />
          <StatusIndicator
            status={metrics.storageStatus || 'healthy'}
            label="Storage"
          />
          <StatusIndicator
            status={metrics.emailStatus || 'healthy'}
            label="Email Service (Resend)"
          />
        </CardContent>
      </Card>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Growth (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.userGrowthData || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="users" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subscription Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={metrics.subscriptionData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(metrics.subscriptionData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Features Used (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.featureUsage || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="#7C3AED" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}