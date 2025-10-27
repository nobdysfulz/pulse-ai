import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

export default function EmailCategoriesStep({ guidelines, onUpdate }) {
  const presetCategories = ["To-Do", "Urgent", "Follow-up", "FYI", "Marketing", "Client Communication"];
  const [customCategory, setCustomCategory] = useState("");

  const addCategory = (category) => {
    const exists = guidelines.some(g => g.guidelineText === category);
    if (!exists) {
      onUpdate([...guidelines, {
        agentType: 'executive_assistant',
        guidelineCategory: 'email_categories',
        guidelineText: category,
        guidelineType: 'preset'
      }]);
    }
  };

  const removeCategory = (category) => {
    onUpdate(guidelines.filter(g => g.guidelineText !== category));
  };

  const addCustomCategory = () => {
    if (customCategory.trim()) {
      onUpdate([...guidelines, {
        agentType: 'executive_assistant',
        guidelineCategory: 'email_categories',
        guidelineText: customCategory.trim(),
        guidelineType: 'custom'
      }]);
      setCustomCategory("");
    }
  };

  const isSelected = (category) => guidelines.some(g => g.guidelineText === category);

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-2xl font-semibold text-[#1E293B] mb-2">How should I categorize your emails?</h3>
      <p className="text-sm text-[#64748B] mb-6">Select categories for automatic email organization</p>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {presetCategories.map(category => (
          <button
            key={category}
            onClick={() => isSelected(category) ? removeCategory(category) : addCategory(category)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isSelected(category) 
                ? 'bg-[#7C3AED] text-white border-[#7C3AED]' 
                : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#7C3AED]'
            }`}
          >
            {category}
            {isSelected(category) && <X className="w-4 h-4 inline ml-2" />}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
          placeholder="Add custom category..."
          onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
        />
        <Button onClick={addCustomCategory} variant="outline">
          Add
        </Button>
      </div>
    </div>
  );
}