import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Sparkles, Copy } from 'lucide-react';
import { toast } from "sonner";
import { InvokeLLM } from '@/api/integrations';

// AI Response Cleaning Function
const cleanAIResponse = (response) => {
  return response
    .replace(/\[Source:.*?\]/g, '')
    .replace(/Source:.*$/gm, '')
    .replace(/\(Source:.*?\)/g, '')
    .replace(/According to.*?:/g, '')
    .replace(/Based on.*?:/g, '')
    .trim();
};

export default function LivePromptGenerator({ user, marketConfig, userCredits, onGenerationComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState(null);
  const [promptCategory, setPromptCategory] = useState('market_monday');

  const creditsCost = 1;

  const handleGenerate = async () => {
    if (userCredits.creditsRemaining < creditsCost) {
      toast.error("Insufficient credits.");
      return;
    }

    setIsLoading(true);
    setGeneratedPrompts(null);

    const systemPrompt = `You are a professional real estate marketing content creator specializing in high-converting copy. 

CRITICAL RULES:
- Generate clean, ready-to-use content with NO source citations or references
- Do not include "According to", "Based on", "Source:", or any attribution
- Create original content that sounds natural and conversational
- Focus on specific, actionable information
- Use Alex Hormozi's copywriting principles: bold claims, specific outcomes, urgency, simple language

For live video prompts:
- Create specific, engaging topics (not generic templates)
- Provide concrete talking points with local relevance
- Include strong calls to action that generate leads
- Make content immediately usable without editing`;

    const prompt = `Generate a specific live video prompt for a real estate agent in ${marketConfig?.primaryTerritory || 'their local area'}.

Category: ${promptCategory.replace('_', ' ')}.
Agent's Market: ${marketConfig?.primaryTerritory || 'their local area'}.

Provide a compelling topic title, 3-5 specific talking points with local relevance, and a strong call to action that generates leads. Make it actionable and ready to use immediately. No placeholder text or templates.

Create content that would work well for Facebook Live, Instagram Live, or YouTube Live streaming.`;

    try {
      const response = await InvokeLLM({
        prompt: systemPrompt + '\n\n' + prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            topic: { 
              type: 'string',
              description: 'A compelling, specific topic title that grabs attention'
            },
            talking_points: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Specific talking points with local relevance, not generic advice'
            },
            cta: { 
              type: 'string',
              description: 'A strong call to action that generates leads or engagement'
            },
            estimated_duration: {
              type: 'string',
              description: 'Estimated duration for the live session'
            },
            suggested_hashtags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Relevant hashtags for the live video'
            }
          },
          required: ['topic', 'talking_points', 'cta']
        }
      });

      // Clean all text responses
      const cleanedResponse = {
        topic: cleanAIResponse(response.topic || ''),
        talking_points: (response.talking_points || []).map(point => cleanAIResponse(point)),
        cta: cleanAIResponse(response.cta || ''),
        estimated_duration: response.estimated_duration || '10-15 minutes',
        suggested_hashtags: response.suggested_hashtags || []
      };

      setGeneratedPrompts(cleanedResponse);
      onGenerationComplete(creditsCost, 'live_prompt', `Live Prompt: ${cleanedResponse.topic}`, cleanedResponse);
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast.error("Failed to generate prompt.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text) => navigator.clipboard.writeText(text).then(() => toast.success("Copied!"));

  const copyFullPrompt = () => {
    if (!generatedPrompts) return;
    
    const fullText = `🎥 LIVE VIDEO TOPIC: ${generatedPrompts.topic}

📋 TALKING POINTS:
${(generatedPrompts.talking_points || []).map((point, i) => `${i + 1}. ${point}`).join('\n')}

🎯 CALL TO ACTION: ${generatedPrompts.cta}

⏱️ ESTIMATED DURATION: ${generatedPrompts.estimated_duration}

${generatedPrompts.suggested_hashtags?.length ? `\n#️⃣ HASHTAGS: ${generatedPrompts.suggested_hashtags.join(' ')}` : ''}`;
    
    copyToClipboard(fullText);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">🔴</span> 
            Live Video Prompt Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-semibold text-base mb-4 block">Prompt Category</Label>
            <RadioGroup value={promptCategory} onValueChange={setPromptCategory} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50">
                <RadioGroupItem value="market_monday" id="market_mon" />
                <Label htmlFor="market_mon" className="cursor-pointer flex-1">
                  <div className="font-medium">Market Monday Topics</div>
                  <div className="text-sm text-slate-500">Weekly market updates and insights</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50">
                <RadioGroupItem value="community_spotlights" id="comm_spot" />
                <Label htmlFor="comm_spot" className="cursor-pointer flex-1">
                  <div className="font-medium">Community Spotlights</div>
                  <div className="text-sm text-slate-500">Highlight local neighborhoods and amenities</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50">
                <RadioGroupItem value="qa_starters" id="qa" />
                <Label htmlFor="qa" className="cursor-pointer flex-1">
                  <div className="font-medium">Q&A Session Starters</div>
                  <div className="text-sm text-slate-500">Interactive content that drives engagement</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-blue-700">
              Live videos get 6x more engagement than regular posts. Use these prompts to create compelling content that your audience will love!
            </p>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || userCredits.creditsRemaining < creditsCost} 
            className="w-full text-base py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating Live Prompt...
              </>
            ) : (
              `Generate Live Prompt (${creditsCost} Credit)`
            )}
          </Button>
        </CardContent>
      </Card>

      <div>
        {isLoading && (
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-4 animate-ping"></div>
                </div>
                <p className="text-slate-600">Generating your live video ideas...</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {generatedPrompts && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🎥 Your Live Video Prompt</span>
                <div className="text-red-500">● LIVE</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-200">
                <h4 className="font-bold text-slate-800 text-xl mb-2">
                  📺 {generatedPrompts.topic}
                </h4>
                <div className="text-sm text-slate-600 flex items-center gap-4">
                  <span>⏱️ {generatedPrompts.estimated_duration}</span>
                  <span>🎯 Lead Generation Focus</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg mb-3 flex items-center gap-2">
                    📋 Talking Points:
                  </h4>
                  <div className="space-y-3">
                    {(generatedPrompts.talking_points || []).map((point, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-lg border">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </div>
                        <p className="text-slate-700 text-base leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-bold text-green-800 text-lg mb-2 flex items-center gap-2">
                    🎯 Call to Action:
                  </h4>
                  <p className="text-green-700 text-base leading-relaxed font-medium">
                    {generatedPrompts.cta}
                  </p>
                </div>

                {generatedPrompts.suggested_hashtags?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2">📱 Suggested Hashtags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedPrompts.suggested_hashtags.map((tag, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          #{tag.replace('#', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={copyFullPrompt}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy Full Prompt
                </Button>
                <Button 
                  onClick={handleGenerate}
                  variant="outline"
                  disabled={isLoading || userCredits.creditsRemaining < creditsCost}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  New Idea ({creditsCost} Credit)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}