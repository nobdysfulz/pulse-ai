
import React, { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Sparkles, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GeneratedContent } from '@/api/entities';
import { toast } from "sonner";
import { UserContext } from '@/context/UserContext';
import { useCredits } from '@/hooks/useCredits';

// No longer accepts props, uses useContext and useCredits
export default function SocialPostGenerator() {
  const { user } = useContext(UserContext); // Get user from context
  const { checkAndDeductCredits } = useCredits(); // Use new credit hook
  
  // New state variables
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState('facebook'); // Keep platform
  const [tone, setTone] = useState('professional');     // Keep tone
  const [includeHashtags, setIncludeHashtags] = useState(true); // New checkbox state
  const [generatedPost, setGeneratedPost] = useState(""); // Replaces generatedPosts array
  const [isGenerating, setIsGenerating] = useState(false); // Renamed from isLoading
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false); // New modal state

  // Remove old state variables: contentType, length, customPrompt, error, isLoading, generatedPosts
  // Remove creditsCost as it's hardcoded to 1 now

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic for your post");
      return;
    }

    // Check credits before generating (new logic)
    const hasCredits = await checkAndDeductCredits(1, 'Social Post Generation');
    if (!hasCredits) {
      setShowInsufficientCreditsModal(true); // Show modal if credits are insufficient
      return;
    }

    setIsGenerating(true); // Use new loading state
    setGeneratedPost(""); // Clear any previously generated post
    // Remove setError(null) as we use toasts now

    try {
      const { data, error } = await supabase.functions.invoke('generateSocialPostTool', {
        body: {
          topic,
          platform,
          tone,
          includeHashtags
        }
      });

      if (error) {
        console.error('[SocialPostGenerator] Error from function:', error);
        toast.error(error.message || "Failed to generate social post");
        return;
      }

      if (data?.success && data?.content) {
        setGeneratedPost(data.content); // Set the single generated post
        
        // Save to GeneratedContent
        try {
          await GeneratedContent.create({
            userId: user.id,
            contentType: 'social_post',
            contentTitle: `${platform} - ${topic.substring(0, 50)}`,
            contentBody: data.content,
            creditsUsed: 1
          });
        } catch (saveError) {
          console.error('[SocialPostGenerator] Error saving content:', saveError);
          // Don't block the user if save fails, they still have the content
        }

        toast.success("Social post generated successfully!");
        // Remove onGenerationComplete call
        
      } else {
        // Handle cases where API returns success: false or no content
        throw new Error(data?.error || "Failed to generate social post - no content returned");
      }
    } catch (error) {
      console.error('[SocialPostGenerator] Error:', error);
      toast.error(error.message || "An error occurred while generating your post");
      // Remove specific error handling for 429/timeout as it's likely handled by base44.functions.invoke or generic catch.
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Post copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy text: ", err);
      toast.error("Failed to copy text.");
    });
  };

  // Remove downloadAsText function, as only a single string post is generated now.

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-purple-500"/> 
            Social Media Post Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Remove old error display block */}

          {/* New Topic Input */}
          <div>
            <Label htmlFor="topic" className="font-semibold text-base block mb-2">
              Topic
            </Label>
            <Input 
              id="topic" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder="e.g., 'Latest interest rate changes', 'Benefits of staging a home', 'Local market trends'"
              className="text-base"
            />
          </div>

          <div>
            <Label className="font-semibold text-base mb-3 block">Platform</Label>
            <RadioGroup value={platform} onValueChange={setPlatform} className="grid grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="facebook" id="fb" />
                <Label htmlFor="fb">Facebook</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="instagram" id="ig" />
                <Label htmlFor="ig">Instagram</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="linkedin" id="li" />
                <Label htmlFor="li">LinkedIn</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Remove Content Type Radio Group */}

          <div>
            <Label className="font-semibold text-base mb-3 block">Tone & Style</Label>
            <RadioGroup value={tone} onValueChange={setTone} className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional" id="professional" />
                <Label htmlFor="professional">Professional</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="casual" />
                <Label htmlFor="casual">Casual & Friendly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="educational" id="educational_tone" />
                <Label htmlFor="educational_tone">Educational</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="promotional" id="promotional" />
                <Label htmlFor="promotional">Promotional</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Remove Length Radio Group */}
          {/* Remove Custom Prompt Input */}

          {/* New Checkbox for Hashtags */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="include-hashtags" 
              checked={includeHashtags} 
              onCheckedChange={setIncludeHashtags} 
            />
            <Label htmlFor="include-hashtags">Include relevant hashtags</Label>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !topic.trim()} // Update disabled logic
            className="w-full text-base py-3 bg-pink-600 hover:bg-pink-700 text-white"
          >
            {isGenerating ? ( // Use new loading state
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating Post...
              </>
            ) : (
              `Generate Post (1 Credit)` // Fixed credit cost
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isGenerating && ( // Use new loading state
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-slate-600">Crafting your social media post...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {showInsufficientCreditsModal && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <p className="font-bold">Insufficient Credits</p>
            <p>You don't have enough credits to generate this post. Please top up your credits.</p>
            <Button onClick={() => setShowInsufficientCreditsModal(false)} className="mt-2">Close</Button>
          </div>
        )}
        
        {generatedPost && ( // Display a single generated post
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Your Generated Social Post
              </CardTitle>
              <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(generatedPost)} // Copy the single post
                    className="gap-1"
                  >
                    <Copy className="w-4 h-4" /> Copy
                  </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded text-slate-700">
                {generatedPost}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Remove the entire loop for generatedPosts and the "Download All" and "Generate New Variations" buttons */}
      </div>
    </div>
  );
}
