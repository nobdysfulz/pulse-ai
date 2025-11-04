import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PageLoader = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

export const InlineLoader = ({ message, className }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <Loader2 className="w-4 h-4 animate-spin text-primary" />
    {message && <span className="text-sm text-muted-foreground">{message}</span>}
  </div>
);

export const CardLoader = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
);

export const ButtonLoader = ({ text = "Processing..." }) => (
  <div className="flex items-center gap-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>{text}</span>
  </div>
);
