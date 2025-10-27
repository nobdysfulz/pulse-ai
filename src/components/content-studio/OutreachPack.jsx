import React, { useState } from 'react';
import { Download, Mail, Phone, MessageSquare, Copy, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const OutreachItemCard = ({ icon: Icon, title, subject, content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowReadMore = content && content.length > 150;

  const handleCopy = () => {
    const textToCopy = subject ? `Subject: ${subject}\n\n${content}` : content;
    navigator.clipboard.writeText(textToCopy);
    toast.success(`${title} content copied!`);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-2.5">
                    <Icon className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                        <h4 className="text-slate-800 text-sm font-semibold">{title}</h4>
                        {subject && <p className="text-slate-600 mt-1 text-sm font-medium">Subject: {subject}</p>}
                    </div>
                </div>
                <button onClick={handleCopy} className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"><Copy className="w-4 h-4" /></button>
            </div>
            <div className="relative">
                <p className={`text-sm text-slate-700 leading-relaxed mt-2 ${!isExpanded && shouldShowReadMore && 'line-clamp-3'}`}>
                    {content}
                </p>
                {shouldShowReadMore &&
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-slate-600 hover:text-slate-900 mt-1 flex items-center gap-1">

                        {isExpanded ? 'Show less' : 'Read more'}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded && 'rotate-180'}`} />
                    </button>
        }
            </div>
        </div>);

};

export default function OutreachPack({ topic, onDownload }) {
  if (!topic) return null;

  const subjectLine = topic.outreachEmailSubject || "No Subject";
  const emailBody = topic.outreachEmail || '';

  return (
    <div className="flex flex-col gap-4">
            <OutreachItemCard icon={Mail} title="Email" subject={subjectLine} content={emailBody} />
            <OutreachItemCard icon={Phone} title="Phone Script" content={topic.outreachCallScript} />
            <OutreachItemCard icon={MessageSquare} title="Text/DM" content={topic.outreachDmTemplate} />
            
            <Button
        onClick={() => onDownload('outreach')} className="bg-blue-600 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-slate-800 w-full">


                <Download className="w-4 h-4 mr-2" />
                Download Outreach Pack
            </Button>
        </div>);

}