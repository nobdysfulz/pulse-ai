import React, { useState, useEffect } from 'react';
import { User, UserAgentSubscription, CallLog } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function UsageDetailsPage() {
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [callLogs, setCallLogs] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = await User.me();
                const [subData] = await UserAgentSubscription.filter({ userId: user.id });
                if (subData) {
                    setSubscription(subData);
                    const logs = await CallLog.filter({ userEmail: user.email }, '-created_date', 50); // Get last 50 calls
                    setCallLogs(logs);
                }
            } catch (error) {
                toast.error("Failed to load usage data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleToggleOverages = async (checked) => {
        if (!subscription) return;
        setSubscription(prev => ({...prev, allowOverages: checked}));
        try {
            await UserAgentSubscription.update(subscription.id, { allowOverages: checked });
            toast.success("Overage settings updated.");
        } catch (error) {
            toast.error("Failed to update settings.");
            setSubscription(prev => ({...prev, allowOverages: !checked}));
        }
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }
    
    if (!subscription) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
                <h2 className="mt-4 text-xl font-semibold">No AI Agent Subscription Found</h2>
                <p className="text-slate-500">Please purchase a plan to view usage details.</p>
            </div>
        );
    }
    
    const usagePercentage = (subscription.currentMinutesUsed / subscription.minutesAllocated) * 100;
    const minutesRemaining = subscription.minutesAllocated - subscription.currentMinutesUsed;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">AI Call Usage Management</h1>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Current Plan: {subscription.planType}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <p><strong>Billing Cycle:</strong> {format(new Date(subscription.billingCycleStartDate), 'PP')} - {format(new Date(subscription.billingCycleEndDate), 'PP')}</p>
                    <p><strong>Included Minutes:</strong> {subscription.minutesAllocated}</p>
                    <div>
                        <div className="flex justify-between mb-1 text-sm">
                            <span><strong>Used This Month:</strong> {subscription.currentMinutesUsed} ({Math.round(usagePercentage)}%)</span>
                            <span><strong>Remaining:</strong> {minutesRemaining > 0 ? minutesRemaining : 0}</span>
                        </div>
                        <Progress value={usagePercentage} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Usage History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Duration (min)</TableHead>
                                <TableHead>Cost</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {callLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{format(new Date(log.created_date), 'PP p')}</TableCell>
                                    <TableCell>{Math.ceil(log.duration / 60)}</TableCell>
                                    <TableCell>${(Math.max(0, (subscription.currentMinutesUsed - log.duration / 60) - subscription.minutesAllocated + (log.duration / 60)) * subscription.overageRate).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Switch id="overages-toggle" checked={subscription.allowOverages} onCheckedChange={handleToggleOverages} />
                        <Label htmlFor="overages-toggle">Continue calls and bill overages (${subscription.overageRate.toFixed(2)}/min)</Label>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">If disabled, calls will be paused when you reach your monthly limit.</p>
                </CardContent>
            </Card>

        </div>
    );
}