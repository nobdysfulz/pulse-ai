
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar } from 'lucide-react'; // Keep imports, as they might be used elsewhere or in future changes not specified.

export default function DailyProgress({ pulseData, goals, businessPlan }) {
  const completionRate7Days = pulseData?.completionRate7Days || 0;
  const completionRate30Days = pulseData?.completionRate30Days || 0;

  const gciGoal = goals?.find((g) => g.title === 'Total GCI') || { currentValue: 0, targetValue: 0, progressPercentage: 0 };

  const buyersClosedGoal = goals?.find((g) => g.title === 'Total Buyers Closed') || { currentValue: 0, targetValue: 0 };
  const listingsClosedGoal = goals?.find((g) => g.title === 'Total Listings Closed') || { currentValue: 0, targetValue: 0 };

  const transactionGoal = {
    currentValue: buyersClosedGoal.currentValue + listingsClosedGoal.currentValue,
    targetValue: buyersClosedGoal.targetValue + listingsClosedGoal.targetValue,
    progressPercentage: 0
  };
  if (transactionGoal.targetValue > 0) {
    transactionGoal.progressPercentage = transactionGoal.currentValue / transactionGoal.targetValue * 100;
  }

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
  };

  return (
    <Card className="border-0 shadow-sm h-full">
      <CardContent className="p-4 md:p-6">
        <h3 className="text-slate-800 mb-4 text-lg font-medium">Goal Progress</h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {/* <Target className="w-4 h-4 text-green-500" /> -- Removed as per outline */}
                <span className="text-sm font-medium text-slate-700">Daily Task Completion</span>
              </div>
              <span className="text-sm font-semibold text-slate-600">{completionRate7Days}%</span>
            </div>
            <Progress value={completionRate7Days} indicatorClassName="bg-green-500" className="h-2" />
            <p className="text-xs text-slate-500 mt-1">Last 7 days average</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {/* <Calendar className="w-4 h-4 text-blue-500" /> -- Removed as per outline */}
                <span className="text-sm font-medium text-slate-700">Monthly Task Completion</span>
              </div>
              <span className="text-sm font-semibold text-slate-600">{completionRate30Days}%</span>
            </div>
            <Progress value={completionRate30Days} indicatorClassName="bg-blue-500" className="h-2" />
            <p className="text-xs text-slate-500 mt-1">Last 30 days average</p>
          </div>

          {(gciGoal.targetValue > 0 || businessPlan) &&
          <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Annual GCI Progress</span>
                <span className="text-sm font-semibold text-slate-600">
                  {Math.round(gciGoal.progressPercentage || 0)}%
                </span>
              </div>
              <Progress
              value={gciGoal.progressPercentage || 0}
              indicatorClassName="bg-purple-500"
              className="h-2" />

              <p className="text-xs text-slate-500 mt-1">
                {formatCurrency(gciGoal.currentValue || 0)} of {formatCurrency(gciGoal.targetValue || businessPlan?.gciRequired || 0)}
              </p>
            </div>
          }

          {(transactionGoal.targetValue > 0 || businessPlan) &&
          <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Annual Transactions</span>
                <span className="text-sm font-semibold text-slate-600">
                  {Math.round(transactionGoal.progressPercentage || 0)}%
                </span>
              </div>
              <Progress
              value={transactionGoal.progressPercentage || 0}
              indicatorClassName="bg-cyan-500"
              className="h-2" />

              <p className="text-xs text-slate-500 mt-1">
                {transactionGoal.currentValue || 0} of {transactionGoal.targetValue || businessPlan?.totalDealsNeeded || 0} deals
              </p>
            </div>
          }
        </div>
      </CardContent>
    </Card>);

}