
import React from 'react';
import { Card } from '@/components/ui/card';
import BrainIcon from '@/components/ui/BrainIcon'; // New import

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
    <Card className="p-4 shadow-sm">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm text-slate-500">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                {subtext && (
                  <p className="text-xs text-slate-500">
                    {typeof subtext === 'string' ? subtext : 
                     React.isValidElement(subtext) && subtext.props.children?.[1]?.type?.name === 'Brain' ? 
                     <span className='flex items-center gap-1'><BrainIcon className='w-3 h-3'/> AI Confidence</span> : 
                     subtext}
                  </p>
                )}
            </div>
            {Icon && (
                <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            )}
        </div>
    </Card>
);

export default StatCard;
