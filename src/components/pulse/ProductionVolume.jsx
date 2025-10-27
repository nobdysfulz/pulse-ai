import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function ProductionVolume({ goals, businessPlan }) {
    const gciGoal = goals.find(g => g.title.toLowerCase().includes('annual commission'));
    
    const target = gciGoal?.targetValue || businessPlan?.gciRequired || 0;
    const current = gciGoal?.currentValue || 0;
    const progress = target > 0 ? (current / target) * 100 : 0;
    
    const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

    return (
        <Card className="p-4 shadow-sm">
            <div className="flex justify-between items-baseline mb-2">
                <h3 className="font-semibold text-slate-800">Total Production Volume</h3>
                <span className="text-sm font-bold text-slate-600">{progress.toFixed(1)}%</span>
            </div>
            <p className="text-sm text-slate-500 mb-2">
                {formatCurrency(current)} of {formatCurrency(target)}
            </p>
            <Progress value={progress} className="h-2" indicatorClassName="bg-pink-500" />
        </Card>
    );
}