import React from 'react';
import { cn } from '@/lib/utils';

/**
 * AI Loading Indicator with spinning and pulsing custom AI icon
 * @param {string} text - Loading text to display
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 * @param {string} className - Additional classes
 */
export default function LoadingIndicator({ text = "Loading...", size = "md", className }) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        <img
          src="/images/icons/pulse-ai-icon.png"
          alt="PULSE AI"
          className={cn(
            sizeClasses[size],
            "animate-spin-slow object-contain"
          )}
        />
        <div className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 animate-pulse",
          sizeClasses[size]
        )} />
      </div>
      {text && (
        <p className={cn(
          "font-medium text-[#475569] animate-pulse",
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * Inline AI Loading Indicator (for buttons and inline contexts)
 */
export function InlineLoadingIndicator({ text = "", className }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative w-5 h-5">
        <img
          src="/images/icons/pulse-ai-icon.png"
          alt="PULSE AI"
          className="w-5 h-5 animate-spin-slow object-contain"
        />
        <div className="absolute inset-0 w-5 h-5 rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 animate-pulse" />
      </div>
      {text && <span className="text-sm font-medium animate-pulse">{text}</span>}
    </div>
  );
}