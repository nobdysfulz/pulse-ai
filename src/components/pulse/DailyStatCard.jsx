import React from 'react';
import { Card } from '@/components/ui/card';

const colorClasses = {
  purple: { bg: 'bg-purple-100' },
  green: { bg: 'bg-green-100' },
  red: { bg: 'bg-red-100' }
};

export default function DailyStatCard({ title, value, icon: Icon, color }) {
  const classes = colorClasses[color] || colorClasses.purple;

  return (
    <Card className="p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-slate-500 text-xs">{title}</p>
                    <p className="text-3xl font-bold text-slate-800">{value}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-full">
                    <Icon className="w-6 h-6 text-slate-400" />
                </div>
            </div>
        </Card>);

}