
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react'; // Sparkles import removed
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { AiPromptConfig } from '@/api/entities';
import ContentGeneratingIndicator from '../ui/ContentGeneratingIndicator';
import { InlineLoadingIndicator } from '../ui/LoadingIndicator';

export default function AIContentGenerator({ userCredits, isSubscriber, marketConfig, onContentGenerated, onCreditError, marketIntelligence, promptConfigs, preferences }) {
  const [contentType, setContentType] = useState('social_post');
  const [platform, setPlatform] = useState('instagram');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Prompt configs are now passed as a prop, removing internal state and loading.
  const loadingPrompts = !promptConfigs || promptConfigs.length === 0;

  const contentTypes = [
    { value: 'social_post', label: 'Social Media Post', promptMap: 'content_studio_social_post' },
    { value: 'video_script', label: 'Video Script', promptMap: 'content_studio_video_script' },
    { value: 'ad_campaign', label: 'Ad Campaign Copy', promptMap: 'content_studio_ad_campaign' },
    { value: 'market_report', label: 'Market Report', promptMap: 'content_studio_market_report' },
    { value: 'blog_article', label: 'Blog Article', promptMap: 'content_studio_blog_article' },
    { value: 'property_description', label: 'Property Description', promptMap: 'content_studio_property_description' },
    { value: 'lead_follow_up', label: 'Lead Follow Up Email', promptMap: 'content_studio_lead_follow_up' },
    { value: 'client_email', label: 'Client Email', promptMap: 'content_studio_client_email' },
    { value: 'presentation_text', label: 'Presentation Text', promptMap: 'content_studio_presentation_text' },
  ];

  const platforms = {
    'social_post': ['Instagram', 'Facebook', 'LinkedIn', 'TikTok'],
    'video_script': ['Instagram Reels', 'TikTok', 'YouTube Shorts', 'YouTube Long-Form'],
    'ad_campaign': ['Meta Ads', 'Google Ads'],
    'market_report': ['Email', 'Blog', 'Social Media Post'],
    'blog_article': ['WordPress', 'Blogger', 'Medium', 'Company Website'],
    'property_description': ['MLS Listing', 'Zillow', 'Realtor.com', 'Property Flyer'],
    'lead_follow_up': ['Email', 'CRM'],
    'client_email': ['Email'],
    'presentation_text': ['Listing Presentation', 'Buyer Presentation', 'Marketing Brochure', 'Agent Bio']
  };

  const selectedPromptConfig = promptConfigs && promptConfigs.find(
    (p) => p.promptId === contentTypes.find((ct) => ct.value === contentType)?.promptMap
  );
  const currentCredits = selectedPromptConfig?.creditsCost || 2;
  const creditsRemaining = userCredits?.creditsRemaining || 0;

  const getAIParams = (contentType) => {
    const baseParams = {
      model: 'gpt-4o',
      temperature: 0.7
    };
    
    const tokenConfig = {
      'social_post': 800,
      'video_script': 1000,
      'ad_campaign': 800,
      'market_report': 1500,
      'blog_article': 2500,
      'property_description': 1200,
      'lead_follow_up': 800,
      'client_email': 800,
      'presentation_text': 1000
    };
    
    return {
      ...baseParams,
      maxTokens: tokenConfig[contentType] || 1500
    };
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic for your content.');
      return;
    }
    if (!isSubscriber && (!userCredits || creditsRemaining < currentCredits)) {
      if (onCreditError) onCreditError(currentCredits);
      return;
    }
    if (!selectedPromptConfig) {
      toast.error("The configuration for this content type is missing. Please contact support.");
      return;
    }

    setIsGenerating(true);
    
    // Construct a market context string. This will be provided if available, 
    // and the system message will guide the AI on whether to use it.
    const marketArea = marketConfig?.primaryTerritory || 'the local market';
    const marketContext = marketIntelligence?.rawResponse 
      ? `\n\nUse the following market analysis for data-driven insights if relevant to the topic:\n---BEGIN MARKET DATA---\n${marketIntelligence.rawResponse}\n---END MARKET DATA---`
      : '';

    // Properly format the user message using the template from AiPromptConfig
    let finalUserPrompt = selectedPromptConfig.userMessageTemplate
      .replace(/\(\(platform\)\)/gi, platform)
      .replace(/\(\(topic\)\)/gi, topic)
      .replace(/\(\(marketArea\)\)/gi, marketArea);

    finalUserPrompt += `\n\nImportant: Use double line breaks (press Enter twice) to create paragraph breaks for proper spacing in the output.`;
    // Append the market context for the AI to potentially use.
    finalUserPrompt += marketContext;
    
    // Retrieve the system message and enhance it with user preferences
    let finalSystemPrompt = selectedPromptConfig.systemMessage;
    if (preferences) {
      finalSystemPrompt += `\n\n--- AGENT INSTRUCTIONS ---\n- Adopt a ${preferences.defaultTone || 'professional'} tone.\n- Ensure the content length is ${preferences.defaultLength || 'medium'}.`;
    }

    const aiParams = getAIParams(contentType);

    try {
      const { data } = await base44.functions.invoke('openaiChat', {
        messages: [{ role: 'user', content: finalUserPrompt }],
        systemPrompt: finalSystemPrompt,
        ...aiParams
      });

      if (data?.message) {
        onContentGenerated({
          title: topic,
          body: data.message,
          type: contentType,
          credits: currentCredits
        });
        setTopic('');
        toast.success('Content generated successfully!');
      } else {
        throw new Error("Received an empty response from AI.");
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedContentTypeLabel = contentTypes.find(t => t.value === contentType)?.label || 'Select type';
  const selectedPlatformLabel = (platforms[contentType] || []).find(p => p.toLowerCase().replace(/ /g, '_') === platform) || 'Select platform';

  return (
    <div className="space-y-6">
        <div className="text-center">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/af4da936f_PULSEaiicon.png"
              alt="PULSE AI"
              className="w-8 h-8 mx-auto mb-2 object-contain"
            />
            <h4 className="text-lg font-semibold text-[#1E293B]">Create Custom Content Using AI</h4>
        </div>
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="content-type" className="text-sm font-medium text-[#1E293B]">Content Type</Label>
                <Select value={contentType} onValueChange={(val) => {
                  setContentType(val);
                  // Set the first available platform as default when content type changes
                  const availablePlatforms = platforms[val] || [];
                  setPlatform(availablePlatforms[0]?.toLowerCase().replace(/ /g, '_') || '');
                }}>
                <SelectTrigger id="content-type">
                    <SelectValue placeholder={selectedContentTypeLabel}>{selectedContentTypeLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {contentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                        {type.label}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="platform" className="text-sm font-medium text-[#1E293B]">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform">
                    <SelectValue placeholder={selectedPlatformLabel}>{selectedPlatformLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {(platforms[contentType] || []).map((p) => (
                    <SelectItem key={p} value={p.toLowerCase().replace(/ /g, '_')}>{p}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="topic" className="text-sm font-medium text-[#1E293B]">What do you want to talk about?</Label>
                <Textarea
                id="topic"
                placeholder="e.g., 'The benefits of getting pre-approved for a mortgage' or '3 common mistakes first-time home sellers make'"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="min-h-[120px] resize-none"
                />
            </div>

            <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || loadingPrompts || !topic.trim() || (!isSubscriber && !userCredits)} 
                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold h-11"
            >
                {isGenerating ? (
                    <InlineLoadingIndicator text="Generating..." />
                ) : (
                <>
                    <img
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/af4da936f_PULSEaiicon.png"
                      alt="PULSE AI"
                      className="w-4 h-4 mr-2 object-contain"
                    />
                    Create Content ({currentCredits} {currentCredits === 1 ? 'Credit' : 'Credits'})
                </>
                )}
            </Button>
            {isGenerating && (
                <ContentGeneratingIndicator />
            )}
        </div>
    </div>
  );
}
