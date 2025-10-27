import React from 'react';
import { cn } from '@/lib/utils';

export default function ContextualSidebar({ title, children, className }) {
  // Check if title contains "Copilot" to change the display text
  const showCopilotText = title?.toLowerCase().includes('copilot');

  return (
    <aside className={cn("w-[420px] bg-white border-l border-[#E2E8F0] flex-shrink-0 flex flex-col", className)}>
      <div className="bg-neutral-700 pt-3 pr-6 pb-3 pl-6 border-b border-[#E2E8F0]">
        <h3 className="text-[#f0f0f0] text-sm font-medium flex items-center gap-2">
          {showCopilotText ? 'PULSE ai' : title}
        </h3>
      </div>
      <div className="pt-4 pr-6 pb-6 pl-6 flex-1 overflow-y-auto">
        {children}
      </div>
    </aside>);

}