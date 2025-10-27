import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { GeneratedContent } from '@/api/entities';
import { Loader2, FileText, Calendar, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const getContentIcon = (type) => {
  switch (type) {
    case 'social_post': return MessageSquare;
    case 'video_script': return FileText;
    case 'market_report': return Calendar;
    default: return FileText;
  }
};

const getContentTypeLabel = (type) => {
  const labels = {
    social_post: 'Social Post',
    video_script: 'Video Script',
    market_report: 'Market Report',
    ad_campaign: 'Ad Campaign',
    content_calendar: 'Content Calendar'
  };
  return labels[type] || type;
};

export default function PastContentPanel() {
  const { user } = useContext(UserContext);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadContent();
    }
  }, [user]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const items = await GeneratedContent.filter(
        { userId: user.id },
        '-created_date',
        10
      );
      setContent(items || []);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#1E293B] mb-1">Recent Content</h3>
        <p className="text-xs text-[#64748B] mb-4">
          Your recently generated content
        </p>
      </div>

      {content.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-[#64748B]">No content generated yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {content.map((item) => {
            const Icon = getContentIcon(item.contentType);
            return (
              <div key={item.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-white border border-[#E2E8F0] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#7C3AED]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-[#1E293B] truncate">
                      {item.contentTitle || getContentTypeLabel(item.contentType)}
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      {format(new Date(item.created_date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-[#475569] mt-2 line-clamp-2">
                      {item.contentBody?.substring(0, 100)}...
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}