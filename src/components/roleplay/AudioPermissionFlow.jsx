import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AudioPermissionFlow({ onPermissionGranted, onPermissionDenied }) {
  const [permissionState, setPermissionState] = useState('initial');

  const requestPermission = async () => {
    setPermissionState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      onPermissionGranted();
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissionState('denied');
      onPermissionDenied();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <Card className="max-w-md w-full bg-white border border-[#E2E8F0]">
        <CardContent className="p-12 text-center">
          {permissionState === 'initial' && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-6">
                <Mic className="w-8 h-8 text-[#7C3AED]" />
              </div>
              <h2 className="text-2xl font-bold text-[#1E293B] mb-3">Microphone Access Required</h2>
              <p className="text-base text-[#475569] mb-8">
                To practice with the AI agent, we need access to your microphone.
              </p>
              <Button onClick={requestPermission} size="lg">
                Grant Permission
              </Button>
            </>
          )}

          {permissionState === 'requesting' && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-6">
                <Mic className="w-8 h-8 text-[#7C3AED] animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-[#1E293B] mb-3">Requesting Permission</h2>
              <p className="text-base text-[#475569]">
                Please allow microphone access in your browser...
              </p>
            </>
          )}

          {permissionState === 'granted' && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-[#22C55E]" />
              </div>
              <h2 className="text-2xl font-bold text-[#1E293B] mb-3">Permission Granted</h2>
              <p className="text-base text-[#475569]">
                Starting your practice session...
              </p>
            </>
          )}

          {permissionState === 'denied' && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-[#EF4444]" />
              </div>
              <h2 className="text-2xl font-bold text-[#1E293B] mb-3">Permission Denied</h2>
              <p className="text-base text-[#475569] mb-8">
                Please enable microphone access in your browser settings to continue.
              </p>
              <Button onClick={requestPermission} variant="outline">
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}