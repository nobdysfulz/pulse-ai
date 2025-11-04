
import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const contentTypeColors = {
  social_post: 'bg-[#3B82F6] text-white',
  video_script: 'bg-[#22C55E] text-white',
  ad_campaign: 'bg-[#7C3AED] text-white',
  market_report: 'bg-[#EAB308] text-white'
};

const contentTypeLabels = {
  social_post: 'Social Media Post',
  video_script: 'Video Script',
  ad_campaign: 'Ad Campaign',
  market_report: 'Market Report',
  blog_article: 'Blog Article',
  property_description: 'Property Description',
  lead_follow_up: 'Lead Follow Up Email',
  client_email: 'Client Email',
  presentation_text: 'Presentation Text',
};

export default function RecentGenerated({ content, onItemClick, highlightId, onHighlightComplete }) {
  const items = content || [];
  const highlightRef = useRef(null);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const timer = setTimeout(() => {
        if (onHighlightComplete) {
          onHighlightComplete();
        }
      }, 3000); // Highlight duration
      return () => clearTimeout(timer);
    }
  }, [highlightId, onHighlightComplete]);

  return (
    <Card className="bg-white text-[#1E293B] pr-4 pb-4 pl-4 rounded-lg border border-[#E2E8F0] space-y-3 max-h-[400px] overflow-y-auto">
      {items.length === 0 ?
      <p className="text-center text-[#475569] text-sm py-8">No content generated yet</p> :

      items.map((item) => {
        const isHighlighted = item.id === highlightId;
        return (
          <div
            key={item.id}
            ref={isHighlighted ? highlightRef : null}
            onClick={() => onItemClick && onItemClick(item)}
            className={cn(
                "p-3 rounded-lg border border-[#E2E8F0] hover:border-[#7C3AED] hover:bg-[#F8FAFC] cursor-pointer transition-all group",
                isHighlighted && "bg-violet-50 border-[#7C3AED] ring-2 ring-violet-300"
            )}>

            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Badge className="bg-gray-100 text-slate-900 mb-1 px-2.5 py-0.5 text-xs font-medium rounded-md inline-flex items-center border transition-colors focus:outline-none focus:ring-0 border-transparent">
                  {contentTypeLabels[item.contentType] || item.contentType}
                </Badge>
                <p className="text-[#1E293B] text-xs font-medium line-clamp-2">
                  {item.contentTitle}
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  {formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-[#475569] group-hover:text-[#7C3AED] flex-shrink-0" />
            </div>
          </div>
        )
      })
      }
    </Card>);
}
