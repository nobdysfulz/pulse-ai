import React from 'react';
import { Users, List } from 'lucide-react';

const ActivityDisplay = ({ title, values }) => (
    <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2"><List /> {title}</h4>
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            {Object.entries(values).map(([key, value]) => (
                 <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').replace('conversions', 'conversations').replace('under Contract', 'under contract')}</span>
                    <span className="font-bold">{value}</span>
                </div>
            ))}
        </div>
    </div>
);

export default function Step4Activities({ planData }) {

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Your Activity Plan</h2>
                <p className="text-gray-500">Based on your goals, here is the reverse-engineered activity you need to hit your numbers.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ActivityDisplay title="Buyer Activities" values={planData.buyerActivities} />
                <ActivityDisplay title="Listing Activities" values={planData.listingActivities} />
            </div>
        </div>
    );
}