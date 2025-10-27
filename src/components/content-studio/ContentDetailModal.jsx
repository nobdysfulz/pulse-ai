import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { DefaultRenderer, SocialPostRenderer, VideoScriptRenderer, AdCampaignRenderer, ContentCalendarRenderer } from './renderers';

export default function ContentDetailModal({ contentItem, isOpen, onClose }) {
  const [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    if (!isOpen) setCopyStatus(false);
  }, [isOpen]);

  if (!contentItem) return null;

  const handleCopy = () => {
    const textToCopy = typeof contentItem.contentBody === 'object' 
      ? JSON.stringify(contentItem.contentBody, null, 2)
      : contentItem.contentBody;
    navigator.clipboard.writeText(textToCopy);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
    toast.success("Content copied to clipboard!");
  };

  const renderers = {
    social_post: SocialPostRenderer,
    video_script: VideoScriptRenderer,
    ad_campaign: AdCampaignRenderer,
    content_calendar: ContentCalendarRenderer
  };

  let parsedData;
  let useDefaultRenderer = false;
  
  try {
    parsedData = JSON.parse(contentItem.contentBody);
  } catch (error) {
    parsedData = contentItem.contentBody;
    useDefaultRenderer = true;
  }

  const Renderer = useDefaultRenderer ? DefaultRenderer : (renderers[contentItem.contentType] || DefaultRenderer);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{contentItem.contentTitle || 'Generated Content'}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 py-4">
          <Renderer data={parsedData} />
        </div>
        <DialogFooter className="!justify-between items-center sm:!justify-between">
          <span className="text-xs text-slate-500">{contentItem.creditsUsed} credits used</span>
          <Button onClick={handleCopy} variant="outline" size="sm">
            {copyStatus ? '✓ Copied!' : <><Copy className="w-4 h-4 mr-2" />Copy to Clipboard</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}