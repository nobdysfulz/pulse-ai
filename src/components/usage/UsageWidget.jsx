import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

export default function UsageWidget() {
  const { userAgentSubscription } = useContext(UserContext);

  if (!userAgentSubscription) return null;

  const minutesUsed = userAgentSubscription.currentMinutesUsed || 0;
  const minutesAllocated = userAgentSubscription.minutesAllocated;
  const isUnlimited = !minutesAllocated;
  
  const percentageUsed = isUnlimited ? 0 : Math.min(100, (minutesUsed / minutesAllocated) * 100);

  return (
    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
      <Clock className="w-4 h-4 text-white" />
      <div className="text-xs text-white">
        {isUnlimited ? (
          <span className="font-medium">Unlimited Minutes</span>
        ) : (
          <>
            <span className="font-medium">{minutesUsed}</span>
            <span className="text-white/60"> / {minutesAllocated} min</span>
          </>
        )}
      </div>
      {!isUnlimited && percentageUsed > 80 && (
        <Badge className="bg-[#EAB308] text-white text-xs">
          {Math.round(100 - percentageUsed)}% left
        </Badge>
      )}
    </div>
  );
}