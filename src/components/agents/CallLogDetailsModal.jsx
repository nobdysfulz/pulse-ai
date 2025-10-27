import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Clock, Phone, User } from 'lucide-react';
import { format } from 'date-fns';

export default function CallLogDetailsModal({ isOpen, onClose, callLog }) {
  if (!isOpen || !callLog) return null;

  const statusColors = {
    completed: 'bg-[#22C55E] text-white',
    failed: 'bg-[#EF4444] text-white',
    pending_initiation: 'bg-[#EAB308] text-white',
    initiated: 'bg-[#3B82F6] text-white',
    answered: 'bg-[#3B82F6] text-white'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0]">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-[#1E293B]">Call Details</h2>
            <p className="text-sm text-[#475569] mt-1">{callLog.contactName || 'Unknown Contact'}</p>
          </div>
          <button onClick={onClose} className="text-[#475569] hover:text-[#1E293B]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Call Overview */}
          <Card className="bg-white border border-[#E2E8F0]">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Status</p>
                    <Badge className={statusColors[callLog.status] || 'bg-[#64748B] text-white'}>
                      {callLog.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Duration</p>
                    <p className="text-base font-semibold text-[#1E293B]">
                      {callLog.duration ? `${Math.floor(callLog.duration / 60)}:${(callLog.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                    <User className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Contact</p>
                    <p className="text-base font-semibold text-[#1E293B]">{callLog.contactPhone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Date</p>
                    <p className="text-base font-semibold text-[#1E293B]">
                      {callLog.created_date ? format(new Date(callLog.created_date), 'MMM d, h:mm a') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transcript */}
          {callLog.transcript && (
            <Card className="bg-white border border-[#E2E8F0]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Transcript</h3>
                <div className="bg-[#F8FAFC] rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-[#475569] whitespace-pre-wrap leading-relaxed">
                    {callLog.transcript}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis */}
          {callLog.analysis && (
            <Card className="bg-white border border-[#E2E8F0]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Analysis</h3>
                <div className="bg-[#F8FAFC] rounded-lg p-4">
                  <p className="text-sm text-[#475569] whitespace-pre-wrap leading-relaxed">
                    {typeof callLog.analysis === 'string' ? callLog.analysis : JSON.stringify(callLog.analysis, null, 2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recording */}
          {callLog.recordingUrl && (
            <Card className="bg-white border border-[#E2E8F0]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Recording</h3>
                <audio controls className="w-full">
                  <source src={callLog.recordingUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-[#E2E8F0]">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}