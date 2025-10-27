import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Content Generation Loading Indicator
 * Used specifically for AI content generation in Content Studio
 */
export default function ContentGeneratingIndicator({ className }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-8", className)}>
      <div className="relative">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/3ac877de1_PULSEaiicon.png"
          alt="PULSE AI"
          className="w-12 h-12 animate-spin-slow object-contain"
          style={{ animationDuration: '3s' }}
        />
        <div className="absolute inset-0 w-12 h-12 rounded-full bg-violet-500/20 animate-pulse" />
      </div>
      <div className="flex flex-col">
        <p className="text-base font-semibold text-[#1E293B] animate-pulse">
          Content Generating...
        </p>
        <p className="text-xs text-[#64748B]">
          This may take a few moments
        </p>
      </div>
    </div>
  );
}