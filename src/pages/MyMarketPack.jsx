import React, { useState, useEffect, useCallback } from 'react';
import { User, UserMarketConfig, UserPreferences, BrandColorPalette, GeneratedContent } from '@/api/entities';
import { GenerateImage, InvokeLLM } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Image as ImageIcon, Video, FileText, Sparkles, AlertTriangle } from 'lucide-react';
import { ImageResult, ScriptResult, BlogResult } from '../components/content-studio/renderers';

const GenerationCard = ({ title, icon: Icon, isLoading, error, children }) => (
  <Card className="shadow-lg border-0 bg-white">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Icon className="w-5 h-5 text-purple-600" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="min-h-[200px]">
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p>Generating...</p>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center h-full text-red-600">
          <AlertTriangle className="w-8 h-8 mb-3" />
          <p>Generation Failed</p>
          <p className="text-xs text-center mt-1">{error}</p>
        </div>
      )}
      {!isLoading && !error && children}
    </CardContent>
  </Card>
);

export default function MyMarketPackPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [generatedContent, setGeneratedContent] = useState({ graphic: null, script: null, blog: null });
  const [errors, setErrors] = useState({ graphic: null, script: null, blog: null });
  const [generationStatus, setGenerationStatus] = useState({ graphic: true, script: true, blog: true });

  const generatePackContent = useCallback(async () => {
    setIsLoading(true);

    try {
      // 1. Fetch all necessary data concurrently
      const [user, marketConfigs, preferencesList] = await Promise.all([
        User.me(),
        UserMarketConfig.list(),
        UserPreferences.list(),
      ]);

      const marketConfig = marketConfigs[0];
      const preferences = preferencesList[0];

      if (!marketConfig) {
        toast.error("Market configuration not found. Please set it up in your settings.");
        throw new Error("Market configuration missing.");
      }

      let brandColors = { primary: '#EC4899', secondary: '#38BDF8', accent: '#8B5CF6' }; // Default colors
      if (preferences?.selectedPaletteId) {
        const palettes = await BrandColorPalette.filter({ id: preferences.selectedPaletteId });
        if (palettes.length > 0) {
          brandColors = {
            primary: palettes[0].primaryColorHex,
            secondary: palettes[0].secondaryColorHex,
            accent: palettes[0].accentColorHex1,
          };
        }
      }

      // 2. Construct all prompts with fetched data
      const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

      const imagePrompt = `Professional real estate marketing image for Instagram. A beautiful, photorealistic scene of a desirable neighborhood in ${marketConfig.city}, ${marketConfig.state}. The image should feature charming homes, green lawns, and a clear sky. The composition must have a clear, open area (e.g., sky, a blurred green field, a light-colored wall) where text can be cleanly overlaid later. The color palette should subtly incorporate these brand colors: ${brandColors.primary}, ${brandColors.secondary}, ${brandColors.accent}. The mood is optimistic, trustworthy, and community-focused. Do not include any text, people, or logos.`;
      
      const videoScriptPrompt = `You are a real estate agent in ${marketConfig.city}, ${marketConfig.state}. Write a script for a 30-second Instagram Reel video where you are speaking directly to potential home buyer and seller clients in your local market.\n\n**GOAL:** Generate leads by providing value and establishing yourself as the local expert.\n\n**TONE:** Authentic, helpful, and confident. Speak like a knowledgeable neighbor.\n\n**SCRIPT REQUIREMENTS:**\n1. **Hook:** Start with a strong, curiosity-driven hook based on a current, specific trend in the ${marketConfig.city} market. (Use internet data for accuracy).\n2. **Value:** Explain what that trend means for someone looking to buy or sell a home right now. Keep it simple and avoid jargon.\n3. **Advice:** Give one specific, free piece of advice they can use immediately.\n4. **CTA:** End with a clear, low-barrier call to action that encourages a comment, DM, or link click.\n\nStructure the output exactly as per the provided JSON schema. Every word must be designed to be spoken aloud comfortably.`;

      const blogPostPrompt = `You are a successful real estate agent in ${marketConfig.city}, ${marketConfig.state} with ${marketConfig.yearsExperience || 1} years of experience. Write a blog post for your website aimed at attracting potential home buyer and seller clients in your local market.\n\n**BLOG POST TITLE:** "What's Really Happening in the ${marketConfig.city} Real Estate Market? ${currentMonthName} ${new Date().getFullYear()} Update"\n\n**OBJECTIVE:** Provide genuine value to establish trust and expertise, encouraging readers to contact you for more information.\n\n**POST STRUCTURE:**\n1. **Introduction:** Connect with the reader. Acknowledge that the market can be confusing and that you're cutting through the noise with clear, local insights.\n2. **Data-Driven Market Snapshot:** Provide a brief, easy-to-scan overview of the most important ${marketConfig.city} market stats (e.g., median sold price, months of inventory, average days on market). Use specific, recent numbers.\n3. **What This Means for You:** This is the core value. Have two sub-sections:\n    * **For Home Buyers:** Practical advice for navigating the current market conditions. How can they be competitive? What should they be aware of?\n    * **For Home Sellers:** Strategic advice on pricing, preparation, and marketing their home effectively in today's environment.\n4. **Hyperlocal Spotlight:** Briefly highlight a specific neighborhood or area within ${marketConfig.primaryTerritory}. Mention what makes it desirable (e.g., parks, schools, community vibe) to demonstrate deep local knowledge.\n5. **Conclusion and CTA:** Summarize the key takeaway. End by inviting them to reach out for a no-obligation, hyper-specific report on their home's value or a particular neighborhood they're interested in.\n\n**TONE:** Expert, helpful, and approachable—like a trusted local advisor. Write in the first person ("I," "my"). Weave in your ${marketConfig.yearsExperience || 1} years of experience naturally. The post should be approximately 800 words and optimized for local SEO keywords like "${marketConfig.city} real estate market."`;
      
      const videoScriptSchema = {
        type: "object",
        properties: {
          video_title: { type: "string" },
          intro_hook: { type: "string", description: "A compelling 5-7 second hook spoken directly to the camera to grab the attention of home buyers/sellers." },
          key_trend: { type: "string", description: "The single most important data point about the local market (e.g., 'Inventory is down 20% from last year')." },
          what_it_means: { type: "string", description: "A simple, client-focused explanation of how this trend affects them." },
          actionable_advice: { type: "string", description: "One specific, free piece of advice for viewers (e.g., 'If you're thinking of selling, now is the time to get a free valuation')." },
          call_to_action: { type: "string", description: "A clear, direct CTA telling them exactly what to do next (e.g., 'DM me the word VALUE for a free report', 'Comment your neighborhood below for specific stats')." }
        },
        required: ["video_title", "intro_hook", "key_trend", "what_it_means", "actionable_advice", "call_to_action"]
      };

      // 3. Make API calls concurrently
      const results = await Promise.allSettled([
        GenerateImage({ prompt: imagePrompt, style: "vibrant", aspect_ratio: "1:1" }),
        InvokeLLM({ prompt: videoScriptPrompt, add_context_from_internet: true, response_json_schema: videoScriptSchema }),
        InvokeLLM({ prompt: blogPostPrompt, add_context_from_internet: true, max_tokens: 2000 })
      ]);

      const [graphicResult, scriptResult, blogResult] = results;

      // 4. Process results and update state
      const finalContent = {};
      if (graphicResult.status === 'fulfilled' && graphicResult.value?.url) {
        finalContent.graphic = graphicResult.value.url;
        setGenerationStatus(prev => ({...prev, graphic: false}));
      } else {
        setErrors(prev => ({...prev, graphic: graphicResult.reason?.message || "Failed to generate image"}));
        setGenerationStatus(prev => ({...prev, graphic: false}));
      }

      if (scriptResult.status === 'fulfilled' && scriptResult.value) {
        finalContent.script = scriptResult.value;
        setGenerationStatus(prev => ({...prev, script: false}));
      } else {
        setErrors(prev => ({...prev, script: scriptResult.reason?.message || "Failed to generate script"}));
        setGenerationStatus(prev => ({...prev, script: false}));
      }

      if (blogResult.status === 'fulfilled' && blogResult.value) {
        finalContent.blog = blogResult.value;
        setGenerationStatus(prev => ({...prev, blog: false}));
      } else {
        setErrors(prev => ({...prev, blog: blogResult.reason?.message || "Failed to generate blog post"}));
        setGenerationStatus(prev => ({...prev, blog: false}));
      }
      
      setGeneratedContent(finalContent);
      
      // Save generated content to history
      await GeneratedContent.create({
        contentType: 'market_pack_unlock',
        contentTitle: `Market Pack for ${marketConfig.primaryTerritory}`,
        contentBody: JSON.stringify(finalContent),
        creditsUsed: 10,
        userId: user.id
      });
      
      toast.success("Your market pack has been generated!");

    } catch (error) {
      console.error("Failed to generate market pack:", error);
      toast.error(error.message || "An unexpected error occurred during generation.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    generatePackContent();
  }, [generatePackContent]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Sparkles className="w-16 h-16 text-purple-600 animate-pulse mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Generating Your Market Pack</h1>
        <p className="text-slate-600">This may take a moment. We're crafting your personalized content...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Your Generated Market Pack</h1>
        <p className="text-slate-600 mt-1">Here is your custom content, ready to use!</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <GenerationCard title="Graphic" icon={ImageIcon} isLoading={generationStatus.graphic} error={errors.graphic}>
          {generatedContent.graphic && <ImageResult imageUrl={generatedContent.graphic} />}
        </GenerationCard>

        <GenerationCard title="Video Script" icon={Video} isLoading={generationStatus.script} error={errors.script}>
          {generatedContent.script && <ScriptResult script={generatedContent.script} />}
        </GenerationCard>

        <GenerationCard title="Blog Post" icon={FileText} isLoading={generationStatus.blog} error={errors.blog}>
          {generatedContent.blog && <BlogResult content={generatedContent.blog} />}
        </GenerationCard>
      </div>
    </div>
  );
}