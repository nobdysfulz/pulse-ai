import React from 'react';
import { cn } from '@/lib/utils';

/**
 * AI Agent Typing Indicator
 * @param {string} agentName - Name of the AI agent
 * @param {string} avatarUrl - URL to agent's avatar (optional)
 */
export default function AITypingIndicator({ agentName = "PULSE AI", avatarUrl, className }) {
  return (
    <div className={cn("flex items-start gap-3 py-2", className)}>
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={agentName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/3ac877de1_PULSEaiicon.png"
              alt="PULSE AI"
              className="w-5 h-5 object-contain"
            />
          </div>
        )}
      </div>
      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#475569]">{agentName} is typing</span>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}