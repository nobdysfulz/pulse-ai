
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from '../components/context/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MetricCard = ({ title, value, subtitle, trend }) => (
    <Card className="border shadow-sm">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-slate-900">{value}</div>
                {trend && (
                    <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                        {trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : trend < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : <Minus className="w-4 h-4 mr-1" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </CardContent>
    </Card>
);

export default function PlatformMetrics() {
    const { user, loading: contextLoading } = useContext(UserContext);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        searchUser: '',
        region: 'all'
    });

    const loadMetrics = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.searchUser) params.append('searchUser', filters.searchUser);
            if (filters.region) params.append('region', filters.region);

            const { data: response, error } = await supabase.functions.invoke('getPlatformMetrics', {
                body: Object.fromEntries(params)
            });
            
            if (error) throw error;
            
            if (response?.data) {
                setMetrics(response.data);
            }
        } catch (error) {
            console.error('Failed to load platform metrics:', error);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate, filters.searchUser, filters.region]);

    useEffect(() => {
        if (user && (user.isAdmin || user.subscriptionTier === 'Admin')) {
            loadMetrics();
        }
    }, [user, loadMetrics]);

    if (contextLoading || !user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (user.isAdmin || user.subscriptionTier === 'Admin') {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-slate-600">Access Denied</p>
            </div>
        );
    }

    const formatCallTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const regionChartData = metrics?.analytics?.regionBreakdown 
        ? Object.entries(metrics.analytics.regionBreakdown).map(([name, value]) => ({ name, value }))
        : [];

    const userAcquisitionData = metrics?.analytics?.userAcquisitionData || [];

    const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Platform Metrics</h1>
                        <p className="text-slate-600 mt-1">Comprehensive KPI dashboard across all users</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">Start Date</label>
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">End Date</label>
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">Search User</label>
                                <Input
                                    placeholder="Name or email..."
                                    value={filters.searchUser}
                                    onChange={(e) => setFilters({ ...filters, searchUser: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">Region</label>
                                <Select value={filters.region} onValueChange={(value) => setFilters({ ...filters, region: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Regions</SelectItem>
                                        <SelectItem value="Northeast">Northeast</SelectItem>
                                        <SelectItem value="Southeast">Southeast</SelectItem>
                                        <SelectItem value="Midwest">Midwest</SelectItem>
                                        <SelectItem value="Southwest">Southwest</SelectItem>
                                        <SelectItem value="West">West</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={loadMetrics} disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Apply Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                ) : metrics ? (
                    <>
                        {/* AI Agent KPIs */}
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">AI Agent Performance</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <MetricCard 
                                    title="Calls Made" 
                                    value={metrics.aiAgent.callsMade.toLocaleString()} 
                                    subtitle="Total outbound calls"
                                />
                                <MetricCard 
                                    title="Calls Completed" 
                                    value={metrics.aiAgent.callsCompleted.toLocaleString()} 
                                    subtitle="Successfully connected"
                                />
                                <MetricCard 
                                    title="Conversion Rate" 
                                    value={`${metrics.aiAgent.conversionRatio}%`} 
                                    subtitle="Calls to appointments"
                                />
                                <MetricCard 
                                    title="Appointments Set" 
                                    value={metrics.aiAgent.appointmentsSet.toLocaleString()} 
                                    subtitle="Total scheduled"
                                />
                                <MetricCard 
                                    title="Total Call Time" 
                                    value={formatCallTime(metrics.aiAgent.totalCallTime)} 
                                    subtitle="Across all calls"
                                />
                                <MetricCard 
                                    title="Failed Calls" 
                                    value={metrics.aiAgent.callsFailed.toLocaleString()} 
                                    subtitle="Invalid or failed"
                                />
                            </div>
                        </div>

                        {/* Task KPIs */}
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">Task Management</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <MetricCard 
                                    title="Tasks Generated" 
                                    value={metrics.tasks.tasksGenerated.toLocaleString()} 
                                    subtitle="AI-generated tasks"
                                />
                                <MetricCard 
                                    title="Tasks Completed" 
                                    value={metrics.tasks.tasksCompleted.toLocaleString()} 
                                    subtitle="All tasks completed"
                                />
                                <MetricCard 
                                    title="Tasks Overdue" 
                                    value={metrics.tasks.tasksOverdue.toLocaleString()} 
                                    subtitle="Past due date"
                                />
                                <MetricCard 
                                    title="Avg PULSE Score" 
                                    value={metrics.tasks.avgPulseScore} 
                                    subtitle="Platform average"
                                />
                                <MetricCard 
                                    title="Completion Rate" 
                                    value={`${metrics.tasks.completionRatio}%`} 
                                    subtitle="Generated tasks completed"
                                />
                            </div>
                        </div>

                        {/* Performance KPIs */}
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">Platform Performance</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricCard 
                                    title="Total GCI" 
                                    value={`$${(metrics.performance.totalGCI / 1000).toFixed(0)}K`} 
                                    subtitle="Gross commission income"
                                />
                                <MetricCard 
                                    title="Listings Closed" 
                                    value={metrics.performance.totalListingsClosed.toLocaleString()} 
                                    subtitle="Total listing sides"
                                />
                                <MetricCard 
                                    title="Buyers Closed" 
                                    value={metrics.performance.totalBuyersClosed.toLocaleString()} 
                                    subtitle="Total buyer sides"
                                />
                                <MetricCard 
                                    title="Sales Volume" 
                                    value={`$${(metrics.performance.totalSalesVolume / 1000000).toFixed(1)}M`} 
                                    subtitle="Estimated total volume"
                                />
                            </div>
                        </div>

                        {/* Analytics KPIs */}
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">Platform Analytics</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <MetricCard 
                                        title="Total Accounts" 
                                        value={metrics.analytics.totalAccounts.toLocaleString()} 
                                        subtitle="Active users"
                                    />
                                    <MetricCard 
                                        title="Admin Accounts" 
                                        value={metrics.analytics.adminAccounts.toLocaleString()} 
                                        subtitle="Admin users"
                                    />
                                </div>

                                <Card className="border shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold">Accounts by Region</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={regionChartData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                                >
                                                    {regionChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* NEW: User Acquisition Chart */}
                            <Card className="border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">User Acquisition</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {userAcquisitionData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={userAcquisitionData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis 
                                                    dataKey="date" 
                                                    tickFormatter={(date) => {
                                                        const d = new Date(date);
                                                        return `${d.getMonth() + 1}/${d.getDate()}`;
                                                    }}
                                                />
                                                <YAxis />
                                                <Tooltip 
                                                    labelFormatter={(date) => {
                                                        const d = new Date(date);
                                                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                    }}
                                                    formatter={(value) => [`${value} new users`, 'Count']}
                                                />
                                                <Legend />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="count" 
                                                    stroke="#8b5cf6" 
                                                    strokeWidth={2}
                                                    name="New Users"
                                                    dot={{ fill: '#8b5cf6', r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            No user acquisition data available for the selected date range.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 text-slate-600">
                        No data available for the selected filters.
                    </div>
                )}
            </div>
        </div>
    );
}
