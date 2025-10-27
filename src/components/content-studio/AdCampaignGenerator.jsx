import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Copy, Target, TrendingUp } from 'lucide-react';
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

export default function AdCampaignGenerator({ user, marketConfig, userCredits, onGenerationComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState(null);
  const [campaignType, setCampaignType] = useState('lead_magnet');
  const [targetAudience, setTargetAudience] = useState('first_time_buyers');
  const [adPlatform, setAdPlatform] = useState('facebook');

  const creditsCost = 4;

  const handleGenerate = async () => {
    if (userCredits.creditsRemaining < creditsCost) {
      toast.error("Insufficient credits.");
      return;
    }

    setIsLoading(true);
    setGeneratedCampaign(null);

    const systemPrompt = `You are a professional real estate marketing content creator specializing in high-converting copy using Alex Hormozi's copywriting principles.

CRITICAL RULES:
- Generate clean, ready-to-use content with NO source citations or references
- Do not include "According to", "Based on", "Source:", or any attribution
- Create original content that sounds natural and conversational
- Use Alex Hormozi's copywriting principles: bold claims, specific outcomes, urgency, simple language

Use Alex Hormozi's copywriting principles:
1. Lead with a bold, attention-grabbing statement
2. Identify a specific pain point or desire
3. Present a clear, valuable offer
4. Create urgency or scarcity
5. Use simple, direct language
6. Focus on the outcome/transformation

For ad campaigns:
- Lead with attention-grabbing hooks
- Identify specific pain points
- Present clear, valuable offers
- Create urgency or scarcity
- Focus on transformation/outcomes
- Write platform-specific copy that converts`;

    const prompt = `Create a high-converting ${campaignType.replace(/_/g, ' ')} ad campaign for a real estate agent.

Campaign Type: ${campaignType.replace(/_/g, ' ')}
Target Audience: ${targetAudience.replace(/_/g, ' ')}
Ad Platform: ${adPlatform}
Agent's Market: ${marketConfig?.primaryTerritory || 'their local area'}

Generate actual ad copy using Hormozi principles, not templates. Make it specific to ${marketConfig?.primaryTerritory || 'the local market'} conditions. Create 3 variations with different angles but same core offer.

For ${adPlatform === 'facebook' ? 'Facebook/Instagram' : 'Google Ads'}, provide:
- Platform-specific formatting
- Character count considerations
- Strong headlines that grab attention
- Body copy that converts
- Clear calls to action
- Targeting recommendations`;

    try {
      const response = await InvokeLLM({
        prompt: systemPrompt + '\n\n' + prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            variations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', description: "e.g., 'Pain Point Focus', 'Outcome Focus', 'Urgency Focus'" },
                  headline: { type: 'string' },
                  body: { type: 'string' },
                  cta: { type: 'string' }
                },
                required: ['type', 'headline', 'body', 'cta']
              }
            },
            targeting: {
              type: 'array',
              items: { type: 'string' },
              description: "A list of specific targeting recommendations for the ad platform."
            },
            creative_suggestions: {
              type: 'array',
              items: { type: 'string' },
              description: "Visual/creative suggestions for the ads"
            },
            budget_guidance: {
              type: 'object',
              properties: {
                daily_budget: { type: 'string' },
                duration: { type: 'string' },
                expected_results: { type: 'string' }
              }
            }
          },
          required: ['variations', 'targeting']
        }
      });

      // Clean all text responses
      const cleanedResponse = {
        ...response,
        variations: (response.variations || []).map(variation => ({
          ...variation,
          headline: cleanAIResponse(variation.headline || ''),
          body: cleanAIResponse(variation.body || ''),
          cta: cleanAIResponse(variation.cta || ''),
          type: cleanAIResponse(variation.type || '')
        })),
        targeting: (response.targeting || []).map(target => cleanAIResponse(target)),
        creative_suggestions: (response.creative_suggestions || []).map(suggestion => cleanAIResponse(suggestion))
      };

      setGeneratedCampaign(cleanedResponse);
      onGenerationComplete(creditsCost, 'ad_campaign', `Ad Campaign: ${campaignType}`, cleanedResponse);
    } catch (error) {
      console.error("Error generating campaign:", error);
      toast.error("Failed to generate campaign.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text) => navigator.clipboard.writeText(text).then(() => toast.success("Copied!"));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="w-5 h-5 text-blue-500" /> 
            Ad Campaign Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-semibold text-base mb-4 block">Campaign Type</Label>
            <RadioGroup value={campaignType} onValueChange={setCampaignType} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50">
                <RadioGroupItem value="lead_magnet" id="lead" />
                <Label htmlFor="lead" className="cursor-pointer flex-1">
                  <div className="font-medium">Lead Magnet</div>
                  <div className="text-sm text-slate-500">Free resources to capture leads</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50">
                <RadioGroupItem value="authority_building" id="auth" />
                <Label htmlFor="auth" className="cursor-pointer flex-1">
                  <div className="font-medium">Authority Building</div>
                  <div className="text-sm text-slate-500">Establish expertise and credibility</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50">
                <RadioGroupItem value="listing_promotion" id="list" />
                <Label htmlFor="list" className="cursor-pointer flex-1">
                  <div className="font-medium">Listing Promotion</div>
                  <div className="text-sm text-slate-500">Promote specific properties</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="font-semibold text-base mb-4 block">Target Audience</Label>
            <RadioGroup value={targetAudience} onValueChange={setTargetAudience} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50">
                <RadioGroupItem value="first_time_buyers" id="ftb" />
                <Label htmlFor="ftb" className="cursor-pointer flex-1">
                  <div className="font-medium">First-Time Buyers</div>
                  <div className="text-sm text-slate-500">New to the market, need guidance</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50">
                <RadioGroupItem value="luxury_clients" id="lux" />
                <Label htmlFor="lux" className="cursor-pointer flex-1">
                  <div className="font-medium">Luxury Clients</div>
                  <div className="text-sm text-slate-500">High-end properties and services</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50">
                <RadioGroupItem value="investors" id="inv" />
                <Label htmlFor="inv" className="cursor-pointer flex-1">
                  <div className="font-medium">Real Estate Investors</div>
                  <div className="text-sm text-slate-500">Looking for ROI opportunities</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="font-semibold text-base mb-4 block">Ad Platform</Label>
            <RadioGroup value={adPlatform} onValueChange={setAdPlatform} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50">
                <RadioGroupItem value="facebook" id="fb" />
                <Label htmlFor="fb" className="cursor-pointer flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <span>📘</span> Facebook/Instagram
                  </div>
                  <div className="text-sm text-slate-500">Visual ads with social proof</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-slate-50">
                <RadioGroupItem value="google" id="gg" />
                <Label htmlFor="gg" className="cursor-pointer flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <span>🔍</span> Google Ads
                  </div>
                  <div className="text-sm text-slate-500">Search-based intent marketing</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Hormozi Method
            </h4>
            <p className="text-sm text-amber-700">
              Using proven copywriting principles: bold claims, specific pain points, clear offers, and urgent calls to action.
            </p>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || userCredits.creditsRemaining < creditsCost} 
            className="w-full text-base py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating High-Converting Ads...
              </>
            ) : (
              `Generate Campaign (${creditsCost} Credits)`
            )}
          </Button>
        </CardContent>
      </Card>

      <div>
        {isLoading && (
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-slate-600">Crafting your high-converting ad campaign...</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {generatedCampaign && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🎯 Your Ad Campaign</span>
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  High Converting
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                {generatedCampaign.variations?.map((variation, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-800 text-lg">
                        Variation {index + 1}: {variation.type}
                      </h4>
                      <Badge variant="outline">
                        {adPlatform === 'facebook' ? '📘 Facebook' : '🔍 Google'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border">
                        <div className="text-sm font-semibold text-slate-600 mb-2">HEADLINE:</div>
                        <div className="text-lg font-bold text-slate-800">{variation.headline}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {variation.headline.length} characters
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border">
                        <div className="text-sm font-semibold text-slate-600 mb-2">BODY COPY:</div>
                        <div className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {variation.body}
                        </div>
                        <div className="text-xs text-slate-500 mt-2">
                          {variation.body.length} characters
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                        <div className="text-sm font-semibold text-green-800 mb-2">CALL TO ACTION:</div>
                        <div className="text-base font-bold text-green-700">{variation.cta}</div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyToClipboard(`HEADLINE: ${variation.headline}\n\nBODY: ${variation.body}\n\nCTA: ${variation.cta}`)} 
                      className="mt-4 w-full"
                    >
                      <Copy className="w-4 h-4 mr-1" /> Copy This Variation
                    </Button>
                  </div>
                ))}
              </div>

              <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                <h4 className="font-bold text-purple-800 text-lg mb-4 flex items-center gap-2">
                  🎯 Targeting Recommendations:
                </h4>
                <div className="grid gap-2">
                  {generatedCampaign.targeting?.map((target, i) => (
                    <div key={i} className="flex items-center gap-2 text-purple-700 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      {target}
                    </div>
                  ))}
                </div>
              </div>

              {generatedCampaign.creative_suggestions?.length > 0 && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-blue-800 text-lg mb-4">🎨 Creative Suggestions:</h4>
                  <div className="grid gap-2">
                    {generatedCampaign.creative_suggestions.map((suggestion, i) => (
                      <div key={i} className="flex items-start gap-2 text-blue-700 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedCampaign.budget_guidance && (
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <h4 className="font-bold text-green-800 text-lg mb-4">💰 Budget Guidance:</h4>
                  <div className="grid gap-2 text-sm">
                    <div><strong>Daily Budget:</strong> {generatedCampaign.budget_guidance.daily_budget}</div>
                    <div><strong>Recommended Duration:</strong> {generatedCampaign.budget_guidance.duration}</div>
                    <div><strong>Expected Results:</strong> {generatedCampaign.budget_guidance.expected_results}</div>
                  </div>
                </div>
              )}

              <div className="text-center pt-4 border-t">
                <Button 
                  onClick={handleGenerate}
                  variant="outline"
                  disabled={isLoading || userCredits.creditsRemaining < creditsCost}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate New Campaign ({creditsCost} Credits)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}