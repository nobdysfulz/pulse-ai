import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function RecentActivityFeed({ callLogs, onCallClick }) {
  const statusColors = {
    completed: 'bg-[#22C55E] text-white',
    failed: 'bg-[#EF4444] text-white',
    pending_initiation: 'bg-[#EAB308] text-white',
    initiated: 'bg-[#3B82F6] text-white',
    answered: 'bg-[#3B82F6] text-white'
  };

  if (!callLogs || callLogs.length === 0) {
    return (
      <Card className="bg-white border border-[#E2E8F0]">
        <CardContent className="p-12 text-center">
          <Phone className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
          <p className="text-base text-[#475569]">No recent activity</p>
          <p className="text-sm text-[#64748B] mt-1">Your call logs will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {callLogs.map((log) => (
        <button
          key={log.id}
          onClick={() => onCallClick?.(log)}
          className="w-full text-left"
        >
          <Card className="bg-white border border-[#E2E8F0] hover:border-[#7C3AED] transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-[#1E293B]">{log.contactName || 'Unknown Contact'}</p>
                    <Badge className={statusColors[log.status] || 'bg-[#64748B] text-white'}>
                      {log.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#475569]">{log.contactPhone || 'No phone'}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#64748B]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.duration ? `${Math.floor(log.duration / 60)}:${(log.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                    </div>
                    <div>
                      {log.created_date ? format(new Date(log.created_date), 'MMM d, h:mm a') : 'N/A'}
                    </div>
                  </div>
                </div>
                <Phone className="w-5 h-5 text-[#7C3AED] flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}