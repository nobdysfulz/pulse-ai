
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { UserContext } from '../components/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, subDays } from 'date-fns';
import ContextualTopNav from '../components/layout/ContextualTopNav';
import ContextualSidebar from '../components/layout/ContextualSidebar';
import AIContentGenerator from '../components/content-studio/AIContentGenerator';
import RecentGenerated from '../components/content-studio/RecentGenerated';
import useCredits from '../components/credits/useCredits';
import InsufficientCreditsModal from '../components/credits/InsufficientCreditsModal';
import ContentDetailModal from '../components/content-studio/ContentDetailModal';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingIndicator, { InlineLoadingIndicator } from '../components/ui/LoadingIndicator';
import { getCacheItem, setCacheItem, CACHE_KEYS } from '@/lib/cache';
import {
  ContentTopic,
  ContentPack,
  FeaturedContentPack,
  GeneratedContent,
  TaskTemplate,
  MarketIntelligence,
  AiPromptConfig,
  ContentPreference,
} from '@/api/entities';

const getCurrentWeekNumber = (date = new Date()) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};

const sortByCreatedDateDesc = (items = []) =>
  [...items].sort((a, b) => new Date(b.created_date || b.createdAt) - new Date(a.created_date || a.createdAt));

const shareContent = async ({ title, text }) => {
  const contentToShare = text?.trim();

  if (!contentToShare) {
    toast.error('No content available to share.');
    return;
  }

  const shareTitle = title || 'PULSE AI Content';

  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: shareTitle, text: contentToShare });
      toast.success('Content shared successfully!');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(contentToShare);
      toast.success('Content copied to clipboard!');
      return;
    }

    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = contentToShare;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success('Content copied to clipboard!');
      return;
    }

    toast.error('Sharing is not supported on this device.');
  } catch (error) {
    console.error('Failed to share content:', error);
    toast.error('Unable to share content right now.');
  }
};

const ContentItemCard = ({ title, description }) => {
  const safeDescription = description || '';

  const handleCopy = () => {
    if (!safeDescription.trim()) {
      toast.error('No content to copy.');
      return;
    }
    navigator.clipboard.writeText(safeDescription);
    toast.success(`${title} content copied to clipboard!`);
  };

  const handleDownload = () => {
    if (!safeDescription.trim()) {
      toast.info('No content available to download.');
      return;
    }
    const blob = new Blob([safeDescription], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_').toLowerCase() || 'content'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${title} downloaded!`);
  };

  const handleShare = () => {
    shareContent({ title, text: safeDescription });
  };

  return (
    <Card className="bg-white border border-[#E2E8F0] shadow-sm">
      <CardContent className="p-4">
        <h3 className="text-base font-semibold text-[#1E293B] mb-1">{title}</h3>
        <p className="text-sm text-[#475569] line-clamp-2 mb-4">
          {safeDescription.trim() ? safeDescription : 'No content available for this item.'}
        </p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
            <Copy className="w-4 h-4 text-[#64748B]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
            <Download className="w-4 h-4 text-[#64748B]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
            <Share2 className="w-4 h-4 text-[#64748B]" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ContentStudioPage() {
  const { user, loading: contextLoading, marketConfig } = useContext(UserContext);
  const { userCredits, hasSufficientCredits, deductCredits } = useCredits();
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(true);
  const [weeklyTopic, setWeeklyTopic] = useState(null);
  const [weeklyContentPacks, setWeeklyContentPacks] = useState([]);
  const [featuredPacks, setFeaturedPacks] = useState([]);
  const [recentContent, setRecentContent] = useState([]);
  const [socialMediaTemplates, setSocialMediaTemplates] = useState([]);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentDetail, setShowContentDetail] = useState(false);
  const [marketIntelligence, setMarketIntelligence] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [preferenceRecordId, setPreferenceRecordId] = useState(null);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);
  const [generatingTaskId, setGeneratingTaskId] = useState(null);
  const [newlyGeneratedId, setNewlyGeneratedId] = useState(null);
  const [promptConfigs, setPromptConfigs] = useState([]);

  const isSubscriber = user?.subscriptionTier === 'Subscriber' || user?.subscriptionTier === 'Admin';

  const tabs = useMemo(() => ([
    { id: 'create', label: 'Create & Post' },
    { id: 'packs', label: 'Packs' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'recents', label: 'Recents' },
    { id: 'preferences', label: 'Preferences' },
  ]), []);

  const loadMarketIntel = useCallback(async () => {
    if (!user?.id) {
      setMarketIntelligence(null);
      return;
    }

    try {
      const data = await MarketIntelligence.filter({ userId: user.id });
      if (Array.isArray(data) && data.length > 0) {
        const sorted = sortByCreatedDateDesc(data);
        const latest = { ...(sorted[0] || {}) };
        if (!latest.rawResponse) {
          const snapshot = latest.dataSnapshot || latest.data_snapshot;
          const insights = latest.insights || latest.insightsSnapshot;
          latest.rawResponse = snapshot?.rawResponse || insights?.rawResponse || ''; // best-effort extraction
        }
        setMarketIntelligence(latest);
      } else {
        setMarketIntelligence(null);
      }
    } catch (error) {
      console.warn('Failed to load market intelligence context:', error);
      setMarketIntelligence(null);
    }
  }, [user?.id]);

  const loadPreferencesForUser = useCallback(async () => {
    if (!user?.id) {
      setPreferences({ defaultTone: 'professional', defaultLength: 'medium' });
      setPreferenceRecordId(null);
      return;
    }

    try {
      const existing = await ContentPreference.filter({ userId: user.id });

      if (Array.isArray(existing) && existing.length > 0) {
        const pref = existing[0];
        setPreferenceRecordId(pref.id);
        setPreferences({
          defaultTone: pref.defaultTone || 'professional',
          defaultLength: pref.defaultLength || 'medium',
        });
      } else {
        const created = await ContentPreference.create({
          userId: user.id,
          defaultTone: 'professional',
          defaultLength: 'medium',
        });
        setPreferenceRecordId(created?.id || null);
        setPreferences({ defaultTone: 'professional', defaultLength: 'medium' });
      }
    } catch (error) {
      console.error('Failed to load content preferences:', error);
      setPreferences({ defaultTone: 'professional', defaultLength: 'medium' });
    }
  }, [user?.id]);

  const loadRecentGenerated = useCallback(async () => {
    if (!user?.id) {
      setRecentContent([]);
      return;
    }

    try {
      const data = await GeneratedContent.filter({ userId: user.id });
      const sorted = sortByCreatedDateDesc(data).slice(0, 20);

      const mapped = sorted.map((item) => {
        const metadata = item.metadata || {};
        return {
          id: item.id,
          contentTitle: item.title || 'Untitled Content',
          contentBody: item.content,
          contentType: item.contentType,
          created_date: item.created_date || item.createdAt,
          creditsUsed: metadata.creditsUsed ?? metadata.credits_used ?? item.creditsUsed ?? 0,
          platform: metadata.platform || item.platform || null,
          metadata,
        };
      });

      setRecentContent(mapped);
    } catch (error) {
      console.error('Failed to load generated content history:', error);
      toast.error('Unable to load recent content right now.');
      setRecentContent([]);
    }
  }, [user?.id]);

  const loadPageData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Try to get cached prompt configs first (5 min cache)
      const cachedPrompts = getCacheItem(CACHE_KEYS.PROMPT_CONFIGS);
      
      const [topics, featured, templates, prompts] = await Promise.all([
        ContentTopic.filter({ isActive: true }),
        FeaturedContentPack.filter({ isActive: true }),
        TaskTemplate.filter({ category: 'social_media', triggerType: 'day_of_week', isActive: true }),
        cachedPrompts ? Promise.resolve(cachedPrompts) : AiPromptConfig.filter({ isActive: true }),
      ]);

      const currentWeek = getCurrentWeekNumber();
      const sortedTopics = sortByCreatedDateDesc(topics).sort((a, b) => (b.weekNumber || 0) - (a.weekNumber || 0));
      const topicForWeek = topics.find((topic) => Number(topic.weekNumber) === currentWeek) || sortedTopics[0] || null;

      setWeeklyTopic(topicForWeek);

      if (topicForWeek?.id) {
        try {
          const packs = await ContentPack.filter({ topicId: topicForWeek.id, isActive: true });
          setWeeklyContentPacks(packs || []);
        } catch (packError) {
          console.warn('Unable to load weekly content packs:', packError);
          setWeeklyContentPacks([]);
        }
      } else {
        setWeeklyContentPacks([]);
      }

      const sortedFeatured = Array.isArray(featured)
        ? [...featured].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        : [];
      setFeaturedPacks(sortedFeatured);

      const orderedTemplates = Array.isArray(templates)
        ? [...templates].sort((a, b) => (Number(a.triggerValue) || 0) - (Number(b.triggerValue) || 0))
        : [];
      setSocialMediaTemplates(orderedTemplates);

      const normalizedPrompts = Array.isArray(prompts)
        ? prompts.map((prompt) => ({
            ...prompt,
            promptId: prompt.promptId || prompt.promptKey || prompt.promptName || prompt.prompt_id || prompt.prompt_key,
          }))
        : [];
      
      // Cache prompt configs if they were fetched (not from cache)
      if (!cachedPrompts && normalizedPrompts.length > 0) {
        setCacheItem(CACHE_KEYS.PROMPT_CONFIGS, normalizedPrompts);
      }
      
      setPromptConfigs(normalizedPrompts);

      await Promise.all([loadRecentGenerated(), loadPreferencesForUser(), loadMarketIntel()]);
    } catch (error) {
      console.error('Error loading content studio data:', error);
      toast.error('Failed to load content data');
    } finally {
      setLoading(false);
    }
  }, [user, loadRecentGenerated, loadPreferencesForUser, loadMarketIntel]);

  useEffect(() => {
    if (!contextLoading && user) {
      loadPageData();
    }
  }, [contextLoading, user, loadPageData]);

  const handleContentGenerated = async (contentData) => {
    if (!user?.id) {
      toast.error('You need to be logged in to save content.');
      return;
    }

    try {
      const data = await GeneratedContent.create({
        userId: user.id,
        title: contentData.title,
        content: contentData.body,
        contentType: contentData.type,
        metadata: {
          creditsUsed: contentData.credits || 0,
          platform: contentData.platform || null,
          promptId: contentData.promptId || null,
          source: contentData.source || 'content_studio',
        },
      });

      toast.success('Content generated and saved!');
      setActiveTab('recents');
      await loadRecentGenerated();
      if (data?.id) {
        setNewlyGeneratedId(data.id);
      }
    } catch (error) {
      console.error('Error saving generated content:', error);
      toast.error('Failed to save content');
    }
  };

  const handleGenerateFromCalendar = async (template) => {
    if (!template) return;
    if (!promptConfigs || promptConfigs.length === 0) {
      toast.error('AI prompts are still loading. Please try again in a moment.');
      return;
    }

    const promptKey = template.promptId || template.promptKey || template.metadata?.promptId || 'content_studio_social_post';
    const promptConfig = promptConfigs.find((config) => config.promptId === promptKey) ||
      promptConfigs.find((config) => config.promptId === 'content_studio_social_post');

    if (!promptConfig) {
      toast.error('The configuration for this content type is missing. Please contact support.');
      return;
    }

    const creditsRequired = promptConfig.creditsCost || 2;
    if (!isSubscriber && !hasSufficientCredits(creditsRequired)) {
      toast.error(`Insufficient credits. This action requires ${creditsRequired} credits.`);
      setShowCreditModal(true);
      return;
    }

    const platformLabel = template.metadata?.platform || 'Instagram';
    const marketArea = marketConfig?.primaryTerritory || 'your local market';
    const topic = template.description || template.title || 'Social media post idea';

    let finalUserPrompt = (promptConfig.userMessageTemplate || '')
      .replace(/\(\(platform\)\)/gi, platformLabel)
      .replace(/\(\(topic\)\)/gi, topic)
      .replace(/\(\(marketArea\)\)/gi, marketArea);

    finalUserPrompt += '\n\nImportant: Use double line breaks to create clear paragraph breaks in the final output.';

    if (marketIntelligence?.rawResponse) {
      finalUserPrompt += `\n\nUse the following market analysis for local insights when relevant:\n---BEGIN MARKET DATA---\n${marketIntelligence.rawResponse}\n---END MARKET DATA---`;
    }

    let finalSystemPrompt = promptConfig.systemMessage || '';
    if (preferences) {
      finalSystemPrompt += `\n\n--- AGENT INSTRUCTIONS ---\n- Adopt a ${preferences.defaultTone || 'professional'} tone.\n- Keep the content length ${preferences.defaultLength || 'medium'}.`;
    }

    setGeneratingTaskId(template.id);

    try {
      // Get fresh auth token
      const token = window.__clerkGetToken ? await window.__clerkGetToken() : null;
      if (!token) {
        toast.error('Authentication token not available. Please refresh the page.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('openaiChat', {
        body: {
          messages: [{ role: 'user', content: finalUserPrompt }],
          systemPrompt: finalSystemPrompt,
          model: 'gpt-4o',
          maxTokens: 800,
          temperature: 0.7,
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) {
        console.error('AI generation error:', error);
        throw new Error(error.message || 'Failed to generate content');
      }

      if (!data?.message) {
        throw new Error('No response returned from AI.');
      }

      const deductionDescription = `Generated calendar content: ${template.title || 'Social Post'}`;
      const deductionSuccess = await deductCredits(
        creditsRequired,
        'content_generation',
        deductionDescription,
      );

      if (!deductionSuccess) {
        toast.error('We could not deduct credits for this generation. Please try again.');
        return;
      }

      await handleContentGenerated({
        title: template.title || topic,
        body: data.message,
        type: promptConfig.contentType || 'social_post',
        credits: creditsRequired,
        platform: platformLabel,
        promptId: promptConfig.promptId,
        source: 'calendar',
      });
    } catch (error) {
      console.error('Calendar content generation failed:', error);
      toast.error(error.message || 'Failed to generate content. Please try again.');
    } finally {
      setGeneratingTaskId(null);
    }
  };

  const handleDownloadPack = () => {
    if (weeklyContentPacks.length > 0) {
      let downloadsInitiated = 0;
      weeklyContentPacks.forEach(pack => {
        if (pack.fileUrl) {
          const link = document.createElement('a');
          link.href = pack.fileUrl;
          link.download = pack.fileName || `PULSE_Content_Pack_${pack.packType}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          downloadsInitiated++;
        }
      });
      if (downloadsInitiated > 0) {
        toast.success(`${downloadsInitiated} content pack(s) downloading!`);
      } else {
        toast.info("No downloadable files found for this week's packs.");
      }
    } else {
      toast.info("No content packs are available for this week.");
    }
  };

  const handleCopyCaption = () => {
    if (!weeklyTopic) {
      toast.error("No topic loaded.");
      return;
    }
    const textToCopy = `${weeklyTopic.socialFeedCaption || ''}\n\n${weeklyTopic.socialHashtags || ''}`.trim();
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success("Caption and hashtags copied!");
    } else {
      toast.info("No caption or hashtags to copy.");
    }
  };

  const handleDownloadPostImage = () => {
    if (weeklyTopic?.socialFeedGraphicUrl) {
      const link = document.createElement('a');
      link.href = weeklyTopic.socialFeedGraphicUrl;
      link.download = `PULSE_Post_${weeklyTopic.title.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Post image downloaded!");
    } else {
      toast.info("No image available for this post.");
    }
  };

  const handleSharePost = () => {
    if (!weeklyTopic) {
      toast.error('No topic loaded.');
      return;
    }

    const textToShare = `${weeklyTopic.socialFeedCaption || ''}\n\n${weeklyTopic.socialHashtags || ''}`.trim();
    shareContent({ title: weeklyTopic.title || 'Weekly Social Post', text: textToShare });
  };

  const handleContentClick = (content) => {
    setSelectedContent(content);
    setShowContentDetail(true);
  };

  const handleUpdatePreferences = async () => {
    if (!preferences || !user?.id) {
      toast.error('Preferences not loaded correctly.');
      return;
    }
    setIsUpdatingPrefs(true);
    try {
      if (preferenceRecordId) {
        await ContentPreference.update(preferenceRecordId, {
          userId: user.id,
          defaultTone: preferences.defaultTone,
          defaultLength: preferences.defaultLength,
        });
      } else {
        const created = await ContentPreference.create({
          userId: user.id,
          defaultTone: preferences.defaultTone,
          defaultLength: preferences.defaultLength,
        });
        setPreferenceRecordId(created?.id || null);
      }

      toast.success('Preferences saved successfully!');
    } catch (e) {
      console.error('Failed to save preferences', e);
      toast.error('Could not save preferences.');
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const renderMainContent = () => {
    const lastUpdated = weeklyTopic?.updated_date || weeklyTopic?.updatedAt || weeklyTopic?.created_date || weeklyTopic?.createdAt;
    const parsedLastUpdated = lastUpdated ? new Date(lastUpdated) : null;
    const formattedUpdated = parsedLastUpdated && !Number.isNaN(parsedLastUpdated.valueOf())
      ? format(parsedLastUpdated, 'MMMM d, yyyy')
      : 'N/A';
    const avatarUrl = user?.avatar_url || user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.email || 'pulse-ai'}`;

    switch (activeTab) {
      case 'create':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-[30px] font-semibold text-[#1E293B]">Content Studio</h1>
                <p className="text-sm text-[#64748B]">Turn this week&apos;s featured content into posts, emails, and scripts in minutes.</p>
              </div>
              <Button
                onClick={handleDownloadPack}
                variant="outline"
                className="flex items-center gap-2 border-[#E2E8F0]"
              >
                <Download className="w-4 h-4" />
                Download Packs
              </Button>
            </div>

            {weeklyTopic ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#1E293B]">This Week&apos;s Featured Content</h2>
                  <span className="text-xs text-[#64748B]">Last updated {formattedUpdated}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <Card className="overflow-hidden border-[#E2E8F0]">
                      <div className="w-full aspect-[4/5] bg-[#F8FAFC]">
                        <img
                          src={weeklyTopic.socialFeedGraphicUrl || '/images/content/content-dashboard-placeholder.png'}
                          alt={weeklyTopic.title || 'Social media graphic'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </Card>
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xl">
                          <span role="img" aria-label="thumbs up">👍</span>
                          <span role="img" aria-label="laugh">🤣</span>
                          <span role="img" aria-label="heart">❤️</span>
                        </div>
                        <div className="text-xs text-[#64748B]">Engagement preview</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src={avatarUrl} alt="Your avatar" className="w-9 h-9 rounded-full object-cover" />
                        <div className="ml-auto flex items-center gap-2">
                          <Button onClick={handleCopyCaption} variant="ghost" size="icon" className="h-9 w-9">
                            <Copy className="w-4 h-4 text-[#64748B]" />
                          </Button>
                          <Button onClick={handleDownloadPostImage} variant="ghost" size="icon" className="h-9 w-9">
                            <Download className="w-4 h-4 text-[#64748B]" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleSharePost}>
                            <Share2 className="w-4 h-4 text-[#64748B]" />
                          </Button>
                        </div>
                      </div>
                      {weeklyTopic.socialFeedCaption && (
                        <p className="text-sm text-[#475569] leading-relaxed">
                          {weeklyTopic.socialFeedCaption}
                        </p>
                      )}
                      {weeklyTopic.socialHashtags && (
                        <p className="text-xs text-[#7C3AED] font-medium">
                          {weeklyTopic.socialHashtags}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ContentItemCard title="Email" description={weeklyTopic.outreachEmail} />
                    <ContentItemCard title="Phone Script" description={weeklyTopic.outreachCallScript} />
                    <ContentItemCard title="Text/DM" description={weeklyTopic.outreachDmTemplate} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 bg-white border border-dashed border-[#E2E8F0] rounded-lg">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto">
                    <img src="/images/icons/pulse-ai-icon.png" alt="PULSE AI" className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1E293B]">No Weekly Content Yet</h3>
                  <p className="text-sm text-[#64748B]">
                    Weekly featured content packs will appear here once they're available. In the meantime, use the AI Content Generator in the sidebar to create custom content!
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'packs':
        return (
          <div className="space-y-4">
            <h1 className="text-[30px] font-semibold text-[#1E293B]">Content Studio</h1>
            <div className="bg-white border border-dashed border-[#E2E8F0] rounded-lg p-10 text-center">
              <p className="text-sm text-[#475569]">Browse the featured packs in the sidebar to download ready-to-use marketing assets.</p>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-4">
            <h1 className="text-[30px] font-semibold text-[#1E293B]">Content Studio</h1>
            <div className="bg-white border border-dashed border-[#E2E8F0] rounded-lg p-10 text-center">
              <p className="text-sm text-[#475569]">Use the calendar sidebar to copy upcoming social media prompts or instantly generate fresh posts with AI.</p>
            </div>
          </div>
        );

      case 'recents':
        return (
          <div className="space-y-4">
            <h1 className="text-[30px] font-semibold text-[#1E293B]">Content Studio</h1>
            <div className="bg-white border border-dashed border-[#E2E8F0] rounded-lg p-10 text-center">
              <p className="text-sm text-[#475569]">Your most recent AI-generated content appears in the sidebar. Click any item to review the full output.</p>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-4">
            <h1 className="text-[30px] font-semibold text-[#1E293B]">Content Studio</h1>
            <div className="bg-white border border-dashed border-[#E2E8F0] rounded-lg p-10 text-center">
              <p className="text-sm text-[#475569]">Update your tone and length preferences in the sidebar to personalize every future AI generation.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderSidebarContent = () => {
    switch (activeTab) {
      case 'create':
        return (
          <div className="space-y-6">
            <AIContentGenerator
              userCredits={userCredits}
              isSubscriber={isSubscriber}
              marketConfig={marketConfig}
              marketIntelligence={marketIntelligence}
              onContentGenerated={handleContentGenerated}
              onCreditError={() => setShowCreditModal(true)}
              promptConfigs={promptConfigs}
              preferences={preferences}
              currentUser={user}
            />
          </div>
        );

      case 'packs':
        return (
          <div className="space-y-6">
            <h4 className="text-base font-semibold text-[#1E293B]">Featured Packs</h4>
            {featuredPacks.length > 0 ? (
              <div className="space-y-4">
                {featuredPacks.map((pack) => (
                  <Card key={pack.id} className="bg-white border border-[#E2E8F0] overflow-hidden">
                    {pack.thumbnailUrl && (
                      <div className="h-32 bg-[#F8FAFC]">
                        <img
                          src={pack.thumbnailUrl}
                          alt={pack.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold text-[#64748B] uppercase mb-1">
                        {pack.type === 'file' ? 'PDF' : 'LINK'}
                      </p>
                      <h5 className="text-sm font-semibold text-[#1E293B] mb-2">{pack.title}</h5>
                      <p className="text-xs text-[#475569] mb-3">{pack.description}</p>
                      <Button
                        onClick={() => {
                          if (pack.isPremium && !isSubscriber) {
                            setShowCreditModal(true);
                          } else {
                            window.open(pack.url, '_blank');
                          }
                        }}
                        className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9 text-sm"
                      >
                        {pack.type === 'file' ? 'Download' : 'View'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748B]">No featured packs available</p>
            )}
          </div>
        );

      case 'calendar':
        const handleCopyToClipboard = (text, title) => {
          if (!text || text.trim() === 'No social media task scheduled for this day.') {
            toast.info("No content to copy.");
            return;
          }
          navigator.clipboard.writeText(text);
          toast.success(`'${title}' content copied to clipboard!`);
        };

        const calendarDays = [
          { label: 'Yesterday', date: subDays(new Date(), 1), color: 'border-l-[#94A3B8] bg-[#F8FAFC]' },
          { label: 'Today', date: new Date(), color: 'border-l-[#EF4444] bg-[#FEF2F2]' },
          { label: 'Tomorrow', date: addDays(new Date(), 1), color: 'border-l-[#EAB308] bg-[#FEFCE8]' },
          { label: format(addDays(new Date(), 2), 'EEEE'), date: addDays(new Date(), 2), color: 'border-l-[#22C55E] bg-[#F0FDF4]' }
        ];

        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {calendarDays.map((day, idx) => {
                // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
                // Template triggerValue: 1=Sun, 2=Mon, ..., 7=Sat
                const jsDayOfWeek = day.date.getDay();
                const templateDayOfWeek = jsDayOfWeek === 0 ? 1 : jsDayOfWeek + 1; // Adjust for Sunday being 1 in templates, 0 in JS
                
                const templateForDay = socialMediaTemplates.find(t => parseInt(t.triggerValue) === templateDayOfWeek);
                
                const postTitle = templateForDay ? templateForDay.title : "No Post Scheduled";
                const postContent = templateForDay ? templateForDay.description || "No description available for this task." : "No social media task scheduled for this day.";
                const isGenerating = generatingTaskId === templateForDay?.id;

                return (
                  <div key={idx} className="space-y-2">
                    <h5 className="text-sm font-semibold text-[#1E293B]">{day.label}</h5>
                    <div className={`p-3 border-l-4 ${day.color} rounded`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-[#1E293B]">{postTitle}</p>
                          <p className="text-xs text-[#64748B] line-clamp-2">{postContent}</p>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                           <button
                            onClick={() => handleCopyToClipboard(postContent, templateForDay?.title)}
                            className="p-1"
                            disabled={!templateForDay || !templateForDay.description || templateForDay.description.trim() === ''}
                            title={!templateForDay || !templateForDay.description ? "No content to copy" : "Copy to clipboard"}
                          >
                            <Copy className="w-3.5 h-3.5 text-[#64748B] hover:text-[#1E293B]" />
                          </button>
                          {templateForDay && (
                            <button
                              onClick={() => handleGenerateFromCalendar(templateForDay)}
                              className="p-1 text-[#7C3AED] hover:text-[#6D28D9] disabled:text-gray-400 disabled:cursor-not-allowed"
                              disabled={isGenerating}
                              title="Generate this post with AI"
                            >
                              {isGenerating ? <InlineLoadingIndicator className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'recents':
        return (
          <div className="space-y-6">
            <RecentGenerated
              content={recentContent}
              onItemClick={handleContentClick}
              highlightId={newlyGeneratedId}
              onHighlightComplete={() => setNewlyGeneratedId(null)}
            />
          </div>
        );

      case 'preferences':
        if (!preferences) {
          return <div className="text-sm text-[#475569]">Loading preferences...</div>;
        }
        return (
          <div className="space-y-6">
            <h4 className="text-base font-semibold text-[#1E293B]">Content Preferences</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="defaultTone" className="text-sm font-medium text-[#1E293B]">Default Tone</Label>
                <Select value={preferences.defaultTone} onValueChange={(val) => setPreferences(p => ({ ...p, defaultTone: val }))}>
                  <SelectTrigger id="defaultTone"><SelectValue placeholder="Select a tone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="defaultLength" className="text-sm font-medium text-[#1E293B]">Default Length</Label>
                <Select value={preferences.defaultLength} onValueChange={(val) => setPreferences(p => ({ ...p, defaultLength: val }))}>
                  <SelectTrigger id="defaultLength"><SelectValue placeholder="Select a length" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleUpdatePreferences} disabled={isUpdatingPrefs} className="w-full">
              {isUpdatingPrefs ? <InlineLoadingIndicator className="w-4 h-4" /> : 'Save Preferences'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <LoadingIndicator text="Loading Content Studio..." size="lg" />
      </div>
    );
  }

  return (
    <>
      <ContextualTopNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="bg-[#F8FAFC] pt-6 pr-8 pb-8 pl-8 flex-1 overflow-y-auto">
          {renderMainContent()}
        </div>

        <ContextualSidebar title={getSidebarTitle(activeTab)}>
          {renderSidebarContent()}
        </ContextualSidebar>
      </div>

      <InsufficientCreditsModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
      />

      {showContentDetail && selectedContent && (
        <ContentDetailModal
          isOpen={showContentDetail}
          onClose={() => {
            setShowContentDetail(false);
            setSelectedContent(null);
          }}
          contentItem={selectedContent}
        />
      )}
    </>
  );
}

function getSidebarTitle(tabId) {
  const titles = {
    create: 'AI Creator',
    packs: 'Featured Packs',
    calendar: 'Content Calendar',
    recents: 'Recent Generated',
    preferences: 'Content Preferences'
  };
  return titles[tabId] || 'Details';
}
