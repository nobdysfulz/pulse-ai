import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

export default function ContentThemesStep({ guidelines, onUpdate }) {
  const presetThemes = [
    "Local Market Updates",
    "Home Buying Tips",
    "Neighborhood Spotlights",
    "Client Success Stories",
    "Real Estate Education",
    "Home Improvement Tips",
    "Mortgage & Financing",
    "Home Staging Advice",
    "Market Trends Analysis"
  ];

  const [customTheme, setCustomTheme] = useState("");

  const toggleTheme = (theme) => {
    const exists = guidelines.some(g => g.guidelineText === theme);
    if (exists) {
      onUpdate(guidelines.filter(g => g.guidelineText !== theme));
    } else {
      onUpdate([...guidelines, {
        agentType: 'content_agent',
        guidelineCategory: 'content_themes',
        guidelineText: theme,
        guidelineType: 'preset'
      }]);
    }
  };

  const addCustomTheme = () => {
    if (customTheme.trim()) {
      onUpdate([...guidelines, {
        agentType: 'content_agent',
        guidelineCategory: 'content_themes',
        guidelineText: customTheme.trim(),
        guidelineType: 'custom'
      }]);
      setCustomTheme("");
    }
  };

  const isSelected = (theme) => guidelines.some(g => g.guidelineText === theme);

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-2xl font-semibold text-[#1E293B] mb-2">What themes should your content focus on?</h3>
      <p className="text-sm text-[#64748B] mb-6">Select content themes that align with your business</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {presetThemes.map(theme => (
          <button
            key={theme}
            onClick={() => toggleTheme(theme)}
            className={`p-3 border rounded-lg text-left transition-colors ${
              isSelected(theme)
                ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#7C3AED]'
            }`}
          >
            <span className="flex items-center justify-between">
              {theme}
              {isSelected(theme) && <X className="w-4 h-4" />}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          value={customTheme}
          onChange={(e) => setCustomTheme(e.target.value)}
          placeholder="Add custom theme..."
          onKeyPress={(e) => e.key === 'Enter' && addCustomTheme()}
        />
        <Button onClick={addCustomTheme} variant="outline">
          Add
        </Button>
      </div>
    </div>
  );
}