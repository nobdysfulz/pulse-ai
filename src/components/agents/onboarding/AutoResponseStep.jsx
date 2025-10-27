import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AutoResponseStep({ guidelines, onUpdate }) {
  const responseTypes = [
    { type: "meeting_confirmations", label: "Meeting confirmations" },
    { type: "client_followups", label: "Client follow-ups" },
    { type: "general_inquiries", label: "General inquiries" },
    { type: "time_sensitive", label: "Time-sensitive emails" }
  ];

  const [customType, setCustomType] = useState("");

  const updateResponseSetting = (type, action) => {
    const actualType = type === "custom" ? customType : type;
    if (!actualType) return;

    onUpdate([
      ...guidelines.filter(g => !g.guidelineText.startsWith(actualType)),
      {
        agentType: 'executive_assistant',
        guidelineCategory: 'auto_responses',
        guidelineText: `${actualType}:${action}`,
        guidelineType: type === "custom" ? "custom" : "preset"
      }
    ]);

    if (type === "custom") {
      setCustomType("");
    }
  };

  const getCurrentAction = (type) => {
    const guideline = guidelines.find(g => g.guidelineText.startsWith(type));
    return guideline?.guidelineText.split(':')[1] || null;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-2xl font-semibold text-[#1E293B] mb-2">Which emails should I automatically respond to?</h3>
      <p className="text-sm text-[#64748B] mb-6">Set your auto-response preferences</p>

      <div className="space-y-3">
        {responseTypes.map(response => (
          <div key={response.type} className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg bg-white">
            <span className="text-[#475569]">{response.label}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={getCurrentAction(response.type) === "send" ? "default" : "outline"}
                onClick={() => updateResponseSetting(response.type, "send")}
                className={getCurrentAction(response.type) === "send" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Auto-send
              </Button>
              <Button
                size="sm"
                variant={getCurrentAction(response.type) === "draft" ? "default" : "outline"}
                onClick={() => updateResponseSetting(response.type, "draft")}
                className={getCurrentAction(response.type) === "draft" ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                Draft only
              </Button>
              <Button
                size="sm"
                variant={getCurrentAction(response.type) === "ignore" ? "default" : "outline"}
                onClick={() => updateResponseSetting(response.type, "ignore")}
                className={getCurrentAction(response.type) === "ignore" ? "bg-gray-600 hover:bg-gray-700" : ""}
              >
                Don't handle
              </Button>
            </div>
          </div>
        ))}

        <div className="flex gap-2 mt-4 pt-4 border-t border-[#E2E8F0]">
          <Input
            type="text"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="Add other email type..."
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateResponseSetting("custom", "send")}
            disabled={!customType.trim()}
          >
            Auto
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateResponseSetting("custom", "draft")}
            disabled={!customType.trim()}
          >
            Draft
          </Button>
        </div>
      </div>
    </div>
  );
}