
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Sparkles, Copy, Download } from 'lucide-react';
import { toast } from "sonner";
import { InvokeLLM } from '@/api/integrations';
import ReactMarkdown from 'react-markdown';

const cleanAIResponse = (response) => {
  return response
    .replace(/\[Source:.*?\]/g, '')
    .replace(/Source:.*$/gm, '')
    .replace(/\(Source:.*?\)/g, '')
    .replace(/According to.*?:/g, '')
    .replace(/Based on.*?:/g, '')
    .trim();
};

export default function MarketReportGenerator({ user, marketConfig, userCredits, onGenerationComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [reportType, setReportType] = useState('neighborhood_analysis');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');

  const creditsCost = 5;

  const handleGenerate = async () => {
    if (!marketConfig?.primaryTerritory) {
      toast.error("Please set your primary market territory in settings first.");
      return;
    }
    if (userCredits.creditsRemaining < creditsCost) {
      toast.error("Insufficient credits to generate a market report.");
      return;
    }

    setIsLoading(true);
    setGeneratedReport(null);

    const systemPrompt = `You are a professional real estate market analysis expert specializing in comprehensive market reports.

CRITICAL RULES:
- Generate clean, ready-to-use content with NO source citations or references
- Do not include "According to", "Based on", "Source:", or any attribution
- Create original content that sounds natural and professional
- Focus on actionable market insights and data-driven analysis
- Use professional report formatting with clear sections`;

    const prompt = `Generate a comprehensive real estate ${reportType.replace('_', ' ')} for ${marketConfig.primaryTerritory}.
Tone: ${tone}
Length: ${length}

Create a well-structured report with:
1. Executive Summary
2. Market Overview with key statistics
3. Trends Analysis
4. Opportunities and Recommendations
5. Market Outlook

Use markdown formatting for professional presentation. Include specific data points and actionable insights that would be valuable for real estate professionals and their clients.`;

    try {
      const response = await InvokeLLM({
        prompt: systemPrompt + '\n\n' + prompt,
        add_context_from_internet: true,
      });
      
      const cleanedResponse = cleanAIResponse(response);
      setGeneratedReport(cleanedResponse);
      onGenerationComplete(creditsCost, 'market_report', `Market Report: ${marketConfig.primaryTerritory}`, cleanedResponse);
    } catch (error) {
      console.error("Error generating market report:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text).then(() => toast.success("Report copied!"));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" /> Market Report Generator</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-semibold">Report Type</Label>
            <RadioGroup value={reportType} onValueChange={setReportType} className="mt-2">
              <div className="flex items-center space-x-2"><RadioGroupItem value="neighborhood_analysis" id="neighborhood" /><Label htmlFor="neighborhood">Neighborhood Analysis</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="market_trends" id="trends" /><Label htmlFor="trends">Market Trends</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="investment_opportunities" id="investment" /><Label htmlFor="investment">Investment Opportunities</Label></div>
            </RadioGroup>
          </div>
          <div>
            <Label className="font-semibold">Tone</Label>
            <RadioGroup value={tone} onValueChange={setTone} className="mt-2">
              <div className="flex items-center space-x-2"><RadioGroupItem value="professional" id="prof" /><Label htmlFor="prof">Professional</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="casual" id="cas" /><Label htmlFor="cas">Casual</Label></div>
            </RadioGroup>
          </div>
          <div>
            <Label className="font-semibold">Length</Label>
            <RadioGroup value={length} onValueChange={setLength} className="mt-2">
              <div className="flex items-center space-x-2"><RadioGroupItem value="short" id="short" /><Label htmlFor="short">Short (Summary)</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="medium" id="medium" /><Label htmlFor="medium">Medium (Standard)</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="long" id="long" /><Label htmlFor="long">Long (In-Depth)</Label></div>
            </RadioGroup>
          </div>
          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Generate Report (${creditsCost} Credits)`}
          </Button>
        </CardContent>
      </Card>
      <div>
        {isLoading && <div className="flex items-center justify-center h-full rounded-lg bg-slate-100"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}
        {generatedReport && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Report</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedReport)}><Copy className="w-4 h-4 mr-1"/> Copy</Button>
              </div>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-full rounded-lg bg-slate-50 p-4 h-96 overflow-y-auto">
              <ReactMarkdown>{generatedReport}</ReactMarkdown>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
