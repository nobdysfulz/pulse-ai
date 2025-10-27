import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Brain, Lightbulb, X } from 'lucide-react';

export default function ScriptDetailModal({ script, isOpen, onClose }) {
  if (!script) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-8">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
                 <DialogTitle className="text-2xl font-bold text-slate-900">{script.title}</DialogTitle>
                 <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">{script.category.replace(/_/g, ' ')}</Badge>
                    <Badge variant="secondary" className="capitalize">{script.difficulty}</Badge>
                 </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <DialogDescription className="text-slate-600 pt-4 text-base">
            {script.situation}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
            <div>
                <h3 className="flex items-center gap-2 font-semibold text-lg text-slate-800 mb-2">
                    <ThumbsUp className="w-5 h-5 text-purple-600" />
                    Recommended Response
                </h3>
                <div className="p-4 bg-slate-50 rounded-lg border">
                     <p className="text-slate-700 whitespace-pre-wrap font-mono text-sm">{script.response}</p>
                </div>
            </div>
             <div>
                <h3 className="flex items-center gap-2 font-semibold text-lg text-slate-800 mb-2">
                    <Lightbulb className="w-5 h-5 text-pink-500" />
                    Key Tips
                </h3>
                <ul className="space-y-2 list-disc pl-5">
                    {script.tips.map((tip, index) => (
                        <li key={index} className="text-slate-600">{tip}</li>
                    ))}
                </ul>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}