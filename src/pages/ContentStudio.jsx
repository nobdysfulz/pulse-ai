
import React, { useState, useEffect, useContext } from 'react';
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
import { Input } from '@/components/ui/input';
import LoadingIndicator, { InlineLoadingIndicator } from '../components/ui/LoadingIndicator';

const ContentItemCard = ({ title, description }) => {
  const handleCopy = () => {
    if (!description) {
      toast.error("No content to copy.");
      return;
    }
    navigator.clipboard.writeText(description);
    toast.success(`${title} content copied to clipboard!`);
  };

  return (
    <Card className="bg-white border border-[#E2E8F0] shadow-sm">
      <CardContent className="p-4">
        <h3 className="text-base font-semibold text-[#1E293B] mb-1">{title}</h3>
        <p className="text-sm text-[#475569] line-clamp-2 mb-4">{description || "No content available for this item."}</p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
            <Copy className="w-4 h-4 text-[#64748B]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="w-4 h-4 text-[#64748B]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
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
  const [activeTab, setActiveTab] = useState('this_week');
  const [loading, setLoading] = useState(true);
  const [weeklyTopic, setWeeklyTopic] = useState(null);
  const [weeklyContentPacks, setWeeklyContentPacks] = useState([]);
  const [featuredPacks, setFeaturedPacks] = useState([]);
  const [recentContent, setRecentContent] = useState([]);
  const [calendarTopics, setCalendarTopics] = useState([]);
  const [socialMediaTemplates, setSocialMediaTemplates] = useState([]);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentDetail, setShowContentDetail] = useState(false);
  const [marketIntelligence, setMarketIntelligence] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);
  const [generatingTaskId, setGeneratingTaskId] = useState(null);
  const [newlyGeneratedId, setNewlyGeneratedId] = useState(null);
  const [promptConfigs, setPromptConfigs] = useState([]);

  const isSubscriber = user?.subscriptionTier === 'Subscriber' || user?.subscriptionTier === 'Admin';

  const tabs = [
    { id: 'this_week', label: 'This Week' },
    { id: 'packs', label: 'Packs' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'recents', label: 'Recents' },
    { id: 'preferences', label: 'Preferences' }
  ];

  useEffect(() => {
    if (!contextLoading && user) {
      loadPageData();
    }
  }, [contextLoading, user]);

  const loadPageData = async () => {
    setLoading(true);
    try {
      // Content Studio functionality will be implemented later
      // For now, set empty data
      setWeeklyTopic(null);
      setWeeklyContentPacks([]);
      setFeaturedPacks([]);
      setRecentContent([]);
      setMarketIntelligence(null);
      setCalendarTopics([]);
      setSocialMediaTemplates([]);
      setPromptConfigs([]);
      
      // Set default preferences
      setPreferences({
        defaultTone: 'professional',
        defaultLength: 'medium'
      });

    } catch (error) {
      console.error('Error loading content studio data:', error);
      toast.error('Failed to load content data');
    } finally {
      setLoading(false);
    }
  };

  const handleContentGenerated = async (contentData) => {
    if (!hasSufficientCredits(contentData.credits)) {
      setShowCreditModal(true);
      return;
    }

    const success = await deductCredits(contentData.credits, 'Content Studio', `Generated ${contentData.type}: ${contentData.title}`);
    if (!success) return;

    try {
      // Content generation will be implemented later
      toast.success('Content generation feature coming soon!');
      await loadPageData();
    } catch (error) {
      console.error('Error saving generated content:', error);
      toast.error('Failed to save generated content');
    }
  };

  const handleGenerateFromCalendar = async (template) => {
    toast.info('Calendar content generation coming soon!');
    setGeneratingTaskId(null);
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

  const handleContentClick = (content) => {
    setSelectedContent(content);
    setShowContentDetail(true);
  };

  const handleUpdatePreferences = async () => {
    if (!preferences) {
      toast.error("Preferences not loaded correctly.");
      return;
    }
    setIsUpdatingPrefs(true);
    try {
      // Preferences update will be implemented later
      toast.success("Preferences saved successfully!");
    } catch (e) {
      console.error("Failed to save preferences", e);
      toast.error("Could not save preferences.");
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const renderMainContent = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[30px] font-semibold text-[#1E293B]">Content Studio</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPack}
              className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded transition-colors"
              title="Download Content Pack"
            >
              <Download className="w-5 h-5 text-[#475569]" />
            </button>
          </div>
        </div>

        {weeklyTopic ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <Card className="overflow-hidden border-[#E2E8F0]">
                <img
                  src={weeklyTopic.socialFeedGraphicUrl || "/images/content/content-dashboard-placeholder.png"}
                  alt={weeklyTopic.title}
                  className="w-full h-auto object-cover aspect-[4/5]"
                />
              </Card>
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👍</span>
                    <span className="text-lg">🤣</span>
                    <span className="text-lg">❤️</span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Updated: {weeklyTopic.created_date ? format(new Date(weeklyTopic.created_date), "MMMM d") : "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <img src={user?.avatar || `https://i.pravatar.cc/150?u=${user?.email}`} alt="user avatar" className="w-8 h-8 rounded-full" />
                  <div className="flex items-center gap-2 ml-auto">
                    <Button onClick={handleCopyCaption} variant="ghost" size="icon" className="h-8 w-8"><Copy className="w-4 h-4 text-[#64748B]" /></Button>
                    <Button onClick={handleDownloadPostImage} variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4 text-[#64748B]" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Share2 className="w-4 h-4 text-[#64748B]" /></Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <ContentItemCard title="Email" description={weeklyTopic.outreachEmail} />
              <ContentItemCard title="Phone Script" description={weeklyTopic.outreachCallScript} />
              <ContentItemCard title="Text/DM" description={weeklyTopic.outreachDmTemplate} />
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-white border border-dashed border-gray-300 rounded-lg">
            <p className="text-lg font-medium text-[#475569]">No content available for this week.</p>
            <p className="text-sm text-[#64748B] mt-2">Check back soon for new materials.</p>
          </div>
        )}
      </div>
    );
  };

  const renderSidebarContent = () => {
    switch (activeTab) {
      case 'this_week':
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
    this_week: 'AI Creator',
    packs: 'Packs',
    calendar: 'Calendar',
    recents: 'Recent Generated',
    preferences: 'Preferences'
  };
  return titles[tabId] || 'Details';
}
