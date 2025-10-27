
import React, { useState } from 'react';
import { Download, Share2, Copy, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SocialMediaPack({ topic, onDownload }) {
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  if (!topic) return null;

  const fullText = `${topic.title || ''}\n\n${topic.socialFeedCaption || ''}`;
  const allHashtags = (topic.socialHashtags || '').split(',').map((h) => h.trim());

  const handleCopy = (text, message) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleShare = async () => {
    const shareData = {
      title: topic.title,
      text: `${fullText}\n\n${allHashtags.map((h) => `#${h}`).join(' ')}`
    };

    const fallbackCopy = () => handleCopy(shareData.text, "Content copied! You can now paste it into your social media app.");

    if (!navigator.share) {
      toast.info("Your browser doesn't support direct sharing. Content copied instead.");
      fallbackCopy();
      return;
    }

    try {
      let file = null;
      if (topic.socialFeedGraphicUrl) {
        try {
          const response = await fetch(topic.socialFeedGraphicUrl);
          if (!response.ok) throw new Error('Image fetch failed');
          const blob = await response.blob();
          const fileType = blob.type.split('/')[1] || 'png';
          file = new File([blob], `social_graphic.${fileType}`, { type: blob.type });
        } catch (imageFetchError) {
          console.warn("Could not fetch image for sharing, proceeding without image:", imageFetchError);
        }
      }

      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ ...shareData, files: [file] });
        toast.success("Shared successfully!");
      } else {
        await navigator.share(shareData);
        if (file) {
          toast.info("Text shared! Your browser might not support sharing images directly.");
        } else {
          toast.info("Text shared!");
        }
      }
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        toast.info("Sharing permission was denied. Content copied instead!");
        fallbackCopy();
      } else if (error.name === 'AbortError') {


        // User cancelled
      } else {console.error('Unexpected sharing error:', error);toast.error("Could not share content. It has been copied as a fallback.");
        fallbackCopy();
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 sm:p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4"></h3>
        
        {/* Thumbnail Image */}
        <div
          className="relative rounded-lg overflow-hidden mb-4 cursor-pointer hover:opacity-90 transition-opacity"
          style={{ height: '200px' }}
          onClick={() => setIsImageExpanded(true)}>

          <img
            src={topic.socialFeedGraphicUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&q=80'}
            alt={topic.title}
            className="w-full h-full object-cover" />

        </div>

        {/* Caption and details */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900">{topic.title}</h4>
          <div className="relative">
            <p className={`text-sm text-slate-700 leading-relaxed ${!captionExpanded && 'line-clamp-3'}`}>
              {topic.socialFeedCaption}
            </p>
            {topic.socialFeedCaption && topic.socialFeedCaption.length > 150 &&
            <button
              onClick={() => setCaptionExpanded(!captionExpanded)}
              className="text-sm text-slate-600 hover:text-slate-900 mt-1 flex items-center gap-1">

                {captionExpanded ? 'Show less' : 'Read more'} 
                <ChevronDown className={`w-4 h-4 transition-transform ${captionExpanded && 'rotate-180'}`} />
              </button>
            }
          </div>
          
          {/* Hashtags */}
          <div className="flex flex-wrap gap-2 bg-slate-100 p-3">
            {allHashtags.slice(0, 6).map((tag, i) =>
            <span key={i} className="text-slate-700 text-xs font-extralight">
                #{tag}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons at Bottom */}
      <div className="bg-slate-50 p-4 flex flex-wrap justify-between items-center gap-2 border-t border-slate-200">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(fullText, "Caption copied!")}
            className="text-slate-700 hover:text-slate-900 hover:bg-white">

            <Copy className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Copy</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-slate-700 hover:text-slate-900 hover:bg-white">

            <Share2 className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
        <Button
          onClick={() => onDownload('social')} className="bg-blue-600 text-white px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md hover:bg-blue-600"

          size="sm">

          <Download className="w-4 h-4 mr-1" />
          Download
        </Button>
      </div>

      <Dialog open={isImageExpanded} onOpenChange={setIsImageExpanded}>
        <DialogContent className="max-w-3xl p-0 border-0">
          <img src={topic.socialFeedGraphicUrl} alt={topic.title} className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />
        </DialogContent>
      </Dialog>
    </div>);

}