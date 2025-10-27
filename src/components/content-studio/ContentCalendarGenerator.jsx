
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Sparkles, Download } from 'lucide-react';
import { toast } from "sonner";
import { InvokeLLM } from '@/api/integrations';
import { format, startOfMonth, eachDayOfInterval, endOfMonth } from 'date-fns';

const cleanAIResponse = (response) => {
  return response
    .replace(/\[Source:.*?\]/g, '')
    .replace(/Source:.*$/gm, '')
    .replace(/\(Source:.*?\)/g, '')
    .replace(/According to.*?:/g, '')
    .replace(/Based on.*?:/g, '')
    .trim();
};

export default function ContentCalendarGenerator({ user, marketConfig, userCredits, onGenerationComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCalendar, setGeneratedCalendar] = useState(null);
  const [focus, setFocus] = useState('balanced');

  const creditsCost = 3;

  const handleGenerate = async () => {
    if (userCredits.creditsRemaining < creditsCost) {
      toast.error("Insufficient credits.");
      return;
    }

    setIsLoading(true);
    setGeneratedCalendar(null);
    
    const systemPrompt = `You are a professional real estate content strategist specializing in comprehensive content calendars.

CRITICAL RULES:
- Generate clean, ready-to-use content with NO source citations or references
- Do not include "According to", "Based on", "Source:", or any attribution
- Create original, specific content ideas that are immediately actionable
- Focus on diverse, engaging content that drives results
- Consider seasonal events and local market timing`;
    
    const prompt = `Generate a 30-day real estate content calendar for next month.
Agent's Market: ${marketConfig?.primaryTerritory || 'their local area'}.
Content Focus: ${focus}. A ${focus} mix of promotional, educational, community, and personal brand posts.

For each day of the month, provide specific content ideas with:
- Compelling topic titles (not generic templates)
- Content type recommendations
- Brief descriptions that are immediately actionable
- Consider holidays and seasonal events for next month`;

    try {
      const response = await InvokeLLM({
        prompt: systemPrompt + '\n\n' + prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            calendar: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'number' },
                  topic: { type: 'string' },
                  content_type: { type: 'string' },
                  description: { type: 'string' }
                },
                required: ['day', 'topic', 'content_type', 'description']
              }
            }
          },
          required: ['calendar']
        }
      });

      // Clean all text content
      const cleanedCalendar = (response.calendar || []).map(day => ({
        ...day,
        topic: cleanAIResponse(day.topic || ''),
        content_type: cleanAIResponse(day.content_type || ''),
        description: cleanAIResponse(day.description || '')
      }));

      setGeneratedCalendar(cleanedCalendar);
      onGenerationComplete(creditsCost, 'content_calendar', `Content Calendar for Next Month`, { calendar: cleanedCalendar });
    } catch (error) {
      console.error("Error generating calendar:", error);
      toast.error("Failed to generate calendar.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!generatedCalendar) return;
    const headers = 'Day,Date,Topic,ContentType,Description\n';
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const rows = generatedCalendar.map(day => {
      const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day.day);
      return [
        day.day,
        format(date, 'yyyy-MM-dd'),
        `"${day.topic.replace(/"/g, '""')}"`,
        `"${day.content_type.replace(/"/g, '""')}"`,
        `"${day.description.replace(/"/g, '""')}"`
      ].join(',');
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'content_calendar.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" /> Content Calendar Generator</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-semibold">Content Focus</Label>
            <RadioGroup value={focus} onValueChange={setFocus} className="mt-2">
              <div className="flex items-center space-x-2"><RadioGroupItem value="balanced" id="bal" /><Label htmlFor="bal">Balanced Mix</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="lead_generation" id="lead_gen" /><Label htmlFor="lead_gen">Lead Generation</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="brand_building" id="brand" /><Label htmlFor="brand">Brand Building</Label></div>
            </RadioGroup>
          </div>
          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Generate Calendar (${creditsCost} Credits)`}
          </Button>
        </CardContent>
      </Card>
      <div>
        {isLoading && <div className="flex items-center justify-center h-full rounded-lg bg-slate-100"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}
        {generatedCalendar && (
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Generated Calendar</span>
                <Button variant="outline" size="sm" onClick={downloadCSV}><Download className="w-4 h-4 mr-2"/> Download CSV</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 h-96 overflow-y-auto">
              {generatedCalendar.map((day, index) => (
                <div key={index} className="p-2 rounded-lg bg-slate-50 text-sm">
                  <p className="font-bold text-slate-800">Day {day.day}: {day.topic}</p>
                  <p className="text-slate-600">{day.description}</p>
                  <p className="text-xs text-purple-600 font-semibold mt-1">{day.content_type}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
