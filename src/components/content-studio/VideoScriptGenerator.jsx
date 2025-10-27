
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Copy, Download } from 'lucide-react';
import { toast } from "sonner";
import { InvokeLLM } from '@/api/integrations';

const cleanAIResponse = (response) => {
  return response
    .replace(/\[Source:.*?\]/g, '')
    .replace(/Source:.*$/gm, '')
    .replace(/\(Source:.*?\)/g, '')
    .replace(/According to.*?:/g, '')
    .replace(/Based on.*?:/g, '')
    .trim();
};

export default function VideoScriptGenerator({ user, marketConfig, userCredits, onGenerationComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState(null);
  const [scriptType, setScriptType] = useState('property_tour');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyHighlights, setPropertyHighlights] = useState('');
  
  const creditsCost = 3;

  const handleGenerate = async () => {
    if (userCredits.creditsRemaining < creditsCost) {
      toast.error("Insufficient credits.");
      return;
    }

    if (scriptType === 'property_tour' && !propertyAddress) {
      toast.error("Property address is required for tour scripts.");
      return;
    }

    setIsLoading(true);
    setGeneratedScript(null);

    const systemPrompt = `You are a professional real estate video script writer specializing in engaging, conversion-focused content.

CRITICAL RULES:
- Generate clean, ready-to-use content with NO source citations or references
- Do not include "According to", "Based on", "Source:", or any attribution
- Create original content that flows naturally for video presentation
- Focus on engaging storytelling and clear visual direction
- Structure content for maximum viewer engagement`;
    
    const prompt = `Generate a real estate video script.
Script Type: ${scriptType.replace('_', ' ')}.
Agent's Market: ${marketConfig?.primaryTerritory || 'their local area'}.
${scriptType === 'property_tour' ? `Property Address: ${propertyAddress}` : ''}
${scriptType === 'property_tour' ? `Property Highlights: ${propertyHighlights}` : ''}

Create a structured script with sections for "Opening Hook," "Main Content," and "Call to Action." 
For each section, provide the narration and visual direction.`;

    try {
      const response = await InvokeLLM({
        prompt: systemPrompt + '\n\n' + prompt,
        add_context_from_internet: scriptType !== 'property_tour',
        response_json_schema: {
          type: 'object',
          properties: {
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  duration: { type: 'string', description: "e.g., '10-15 seconds'" },
                  content: { type: 'string', description: "The narration/what to say." },
                  shot_suggestion: { type: 'string', description: "Visual shot idea." }
                },
                required: ['title', 'duration', 'content', 'shot_suggestion']
              }
            }
          }
        }
      });

      // Clean all text content
      const cleanedResponse = {
        sections: (response.sections || []).map(section => ({
          ...section,
          title: cleanAIResponse(section.title || ''),
          content: cleanAIResponse(section.content || ''),
          shot_suggestion: cleanAIResponse(section.shot_suggestion || ''),
          duration: section.duration || '10-15 seconds' // Ensure duration is always set
        }))
      };

      setGeneratedScript(cleanedResponse);
      onGenerationComplete(creditsCost, 'video_script', `Video Script: ${scriptType}`, cleanedResponse);
    } catch (error) {
      console.error("Error generating script:", error);
      toast.error("Failed to generate script.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" /> Video Script Generator</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-semibold">Script Type</Label>
            <RadioGroup value={scriptType} onValueChange={setScriptType} className="mt-2">
              <div className="flex items-center space-x-2"><RadioGroupItem value="property_tour" id="tour" /><Label htmlFor="tour">Property Tour</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="market_update" id="market" /><Label htmlFor="market">Market Update</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="educational" id="edu" /><Label htmlFor="edu">Educational</Label></div>
            </RadioGroup>
          </div>

          {scriptType === 'property_tour' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Property Address</Label>
                <Input id="address" value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)} placeholder="123 Main St, Anytown" />
              </div>
              <div>
                <Label htmlFor="highlights">Property Highlights</Label>
                <Textarea id="highlights" value={propertyHighlights} onChange={e => setPropertyHighlights(e.target.value)} placeholder="e.g., renovated kitchen, large backyard" />
              </div>
            </div>
          )}

          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Generate Script (${creditsCost} Credits)`}
          </Button>
        </CardContent>
      </Card>
      <div>
        {isLoading && <div className="flex items-center justify-center h-full rounded-lg bg-slate-100"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}
        {generatedScript && (
          <Card>
            <CardHeader><CardTitle>Generated Script</CardTitle></CardHeader>
            <CardContent className="space-y-4 h-96 overflow-y-auto">
              {generatedScript.sections?.map((section, index) => (
                <div key={index} className="p-4 rounded-lg bg-slate-50">
                  <h4 className="font-bold text-slate-800">{section.title} ({section.duration})</h4>
                  <p className="text-sm text-slate-700 mt-1"><strong>Narration:</strong> {section.content}</p>
                  <p className="text-sm text-purple-700 mt-1"><strong>Shot:</strong> {section.shot_suggestion}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
