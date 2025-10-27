
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ProgressBar = ({ title, value, max, colorClass, isCurrency = false }) => {
  const percentage = max > 0 ? value / max * 100 : 0;
  const displayValue = isCurrency ? `$${Math.round(value / 1000)}k` : value;
  const displayMax = isCurrency ? `$${Math.round(max / 1000)}k` : max;

  return (
    <div>
            <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-slate-700">{title}</p>
                <p className="text-sm font-semibold text-slate-500">{isCurrency ? `${Math.round(percentage)}%` : `${displayValue} / ${displayMax}`}</p>
            </div>
            <Progress value={percentage} indicatorClassName={colorClass} />
        </div>);

};

export default function PerformanceProgress({ goals }) {
  const { gci, conversations, closedDeals, appointmentsSet } = goals;

  return (
    <Card className="border text-card-foreground shadow-s rounded-2xl h-full p-6 bg-white">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Annual Performance Progress</h3>
            <div className="space-y-5">
                <ProgressBar
          title="Gross Commission Income"
          value={gci.currentValue}
          max={gci.targetValue}
          colorClass="bg-pink-500"
          isCurrency={true} />

                <ProgressBar
          title="Total Conversations"
          value={conversations.currentValue}
          max={conversations.targetValue}
          colorClass="bg-cyan-500" />

                <ProgressBar
          title="Total Closed Deals"
          value={closedDeals.currentValue}
          max={closedDeals.targetValue}
          colorClass="bg-purple-600" />

                <ProgressBar
          title="Appointments Set"
          value={appointmentsSet.currentValue}
          max={appointmentsSet.targetValue}
          colorClass="bg-amber-500" />

            </div>
            <div className="text-center mt-6">
                <Link to={createPageUrl('Goals')}>
                    <span className="text-purple-900 text-sm font-semibold hover:underline">View All</span>
                </Link>
            </div>
        </Card>);

}
