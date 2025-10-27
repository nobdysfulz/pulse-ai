import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EmailStyleStep({ guidelines, onUpdate }) {
  const styles = {
    tone: [
      { value: "professional", label: "Professional & formal" },
      { value: "friendly", label: "Friendly & approachable" },
      { value: "direct", label: "Direct & to-the-point" },
      { value: "conversational", label: "Conversational & casual" },
      { value: "other", label: "Other..." }
    ],
    format: [
      { value: "brief_actionable", label: "Brief & actionable" },
      { value: "detailed_explanations", label: "Detailed explanations" },
      { value: "bullet_points", label: "Bullet points & lists" },
      { value: "other", label: "Other..." }
    ],
    length: [
      { value: "one_liners", label: "One-liners" },
      { value: "short_paragraphs", label: "Short paragraphs" },
      { value: "comprehensive", label: "Comprehensive details" },
      { value: "other", label: "Other..." }
    ]
  };

  const [customInputs, setCustomInputs] = useState({});
  const [customValues, setCustomValues] = useState({});

  const handleStyleSelect = (category, value, customText = "") => {
    const guidelineText = value === "other" ? customText : value;
    
    onUpdate([
      ...guidelines.filter(g => !g.guidelineCategory.includes(`email_style_${category}`)),
      {
        agentType: 'executive_assistant',
        guidelineCategory: `email_style_${category}`,
        guidelineText: guidelineText,
        guidelineType: value === "other" ? "custom" : "preset"
      }
    ]);
  };

  const getSelectedValue = (category) => {
    const guideline = guidelines.find(g => g.guidelineCategory === `email_style_${category}`);
    return guideline?.guidelineText || "";
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-2xl font-semibold text-[#1E293B] mb-2">How should I write your emails?</h3>
      <p className="text-sm text-[#64748B] mb-6">Define your preferred email writing style</p>

      {Object.entries(styles).map(([category, options]) => (
        <div key={category} className="mb-6">
          <Label className="block font-medium mb-3 capitalize text-[#1E293B]">
            {category.replace('_', ' ')}
          </Label>
          <div className="space-y-2">
            {options.map(option => (
              <div key={option.value}>
                <label className="flex items-center p-3 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] cursor-pointer">
                  <input
                    type="radio"
                    name={category}
                    value={option.value}
                    checked={getSelectedValue(category) === option.value || (option.value === "other" && customInputs[category])}
                    onChange={(e) => {
                      if (option.value === "other") {
                        setCustomInputs(prev => ({...prev, [category]: true}));
                      } else {
                        handleStyleSelect(category, option.value);
                        setCustomInputs(prev => ({...prev, [category]: false}));
                      }
                    }}
                    className="mr-3"
                  />
                  <span className="text-[#475569]">{option.label}</span>
                </label>
                {option.value === "other" && customInputs[category] && (
                  <Input
                    type="text"
                    placeholder={`Describe your preferred ${category}...`}
                    value={customValues[category] || ""}
                    onChange={(e) => {
                      setCustomValues(prev => ({...prev, [category]: e.target.value}));
                      handleStyleSelect(category, "other", e.target.value);
                    }}
                    className="ml-6 mt-2"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}