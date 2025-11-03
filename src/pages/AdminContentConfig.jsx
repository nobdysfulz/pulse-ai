
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import { ContentTopic } from '@/api/entities';
import { AiPromptConfig } from '@/api/entities';
import { BrandColorPalette } from '@/api/entities';

const FileUploader = ({ label, onUpload, currentUrl, isMultiple = false }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            if (isMultiple) {
                const uploadedUrls = await Promise.all(
                    Array.from(files).map(async (file) => {
                        const fileName = `${Date.now()}_${file.name}`;
                        const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('admin-uploads')
                            .upload(fileName, file);
                        
                        if (uploadError) throw uploadError;
                        
                        const { data: urlData } = supabase.storage
                            .from('admin-uploads')
                            .getPublicUrl(fileName);
                        
                        return urlData.publicUrl;
                    })
                );
                onUpload(uploadedUrls);
            } else {
                const file = files[0];
                const fileName = `${Date.now()}_${file.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('admin-uploads')
                    .upload(fileName, file);
                
                if (uploadError) throw uploadError;
                
                const { data: urlData } = supabase.storage
                    .from('admin-uploads')
                    .getPublicUrl(fileName);
                
                onUpload(urlData.publicUrl);
            }
            toast.success(`${files.length} file(s) uploaded successfully!`);
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("File upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input type="file" onChange={handleFileChange} multiple={isMultiple} disabled={isUploading} />
            {isUploading && <p className="text-sm text-slate-500">Uploading...</p>}
            {currentUrl && !isMultiple && (
                <div className="mt-2">
                    <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        View Current File
                    </a>
                </div>
            )}
            {Array.isArray(currentUrl) && currentUrl.length > 0 && (
                 <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium">Current Files:</p>
                    {currentUrl.map((url, i) => (
                         <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">
                            File {i + 1}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};


const TopicsManager = () => {
    const [topics, setTopics] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        weekNumber: '',
        title: '',
        coreQuestion: '',
        keywords: '',
        isActive: true,
        socialFeedGraphicUrl: '',
        socialStoryGraphicUrl: '',
        socialCarouselGraphicUrls: [],
        socialFeedCaption: '',
        socialCarouselCaption: '',
        socialHashtags: '',
        socialPremiumGraphic1Url: '',
        socialPremiumGraphic2Url: '',
        socialPremiumCarouselUrl: '',
        socialPremiumReelScript: '',
        outreachTopicTitle: '',
        outreachEmail: '',
        outreachCallScript: '',
        outreachDmTemplate: '',
        outreachPremiumGraphicUrl: '',
        outreachPremiumPostText: '',
        outreachPremiumVideoScript: ''
    });

    useEffect(() => {
        loadTopics();
    }, []);

    const loadTopics = async () => {
        try {
            const data = await ContentTopic.list('-weekNumber');
            setTopics(data);
        } catch (error) {
            console.error('Failed to load topics:', error);
            toast.error('Failed to load content topics');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                weekNumber: parseInt(formData.weekNumber),
                keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
            };

            if (editingTopic) {
                await ContentTopic.update(editingTopic.id, payload);
                toast.success('Topic updated successfully');
            } else {
                await ContentTopic.create(payload);
                toast.success('Topic created successfully');
            }

            await loadTopics();
            handleCancel();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save topic');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (topic) => {
        setEditingTopic(topic);
        setFormData({
            weekNumber: topic.weekNumber?.toString() || '',
            title: topic.title || '',
            coreQuestion: topic.coreQuestion || '',
            keywords: Array.isArray(topic.keywords) ? topic.keywords.join(', ') : '',
            isActive: topic.isActive ?? true,
            socialFeedGraphicUrl: topic.socialFeedGraphicUrl || '',
            socialStoryGraphicUrl: topic.socialStoryGraphicUrl || '',
            socialCarouselGraphicUrls: topic.socialCarouselGraphicUrls || [],
            socialFeedCaption: topic.socialFeedCaption || '',
            socialCarouselCaption: topic.socialCarouselCaption || '',
            socialHashtags: topic.socialHashtags || '',
            socialPremiumGraphic1Url: topic.socialPremiumGraphic1Url || '',
            socialPremiumGraphic2Url: topic.socialPremiumGraphic2Url || '',
            socialPremiumCarouselUrl: topic.socialPremiumCarouselUrl || '',
            socialPremiumReelScript: topic.socialPremiumReelScript || '',
            outreachTopicTitle: topic.outreachTopicTitle || '',
            outreachEmail: topic.outreachEmail || '',
            outreachCallScript: topic.outreachCallScript || '',
            outreachDmTemplate: topic.outreachDmTemplate || '',
            outreachPremiumGraphicUrl: topic.outreachPremiumGraphicUrl || '',
            outreachPremiumPostText: topic.outreachPremiumPostText || '',
            outreachPremiumVideoScript: topic.outreachPremiumVideoScript || ''
        });
        setShowDialog(true);
    };

    const handleDelete = async (topicId) => {
        if (!confirm('Are you sure you want to delete this topic?')) return;
        
        try {
            await ContentTopic.delete(topicId);
            toast.success('Topic deleted successfully');
            await loadTopics();
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete topic');
        }
    };

    const handleCancel = () => {
        setShowDialog(false);
        setEditingTopic(null);
        setFormData({
            weekNumber: '',
            title: '',
            coreQuestion: '',
            keywords: '',
            isActive: true,
            socialFeedGraphicUrl: '',
            socialStoryGraphicUrl: '',
            socialCarouselGraphicUrls: [],
            socialFeedCaption: '',
            socialCarouselCaption: '',
            socialHashtags: '',
            socialPremiumGraphic1Url: '',
            socialPremiumGraphic2Url: '',
            socialPremiumCarouselUrl: '',
            socialPremiumReelScript: '',
            outreachTopicTitle: '',
            outreachEmail: '',
            outreachCallScript: '',
            outreachDmTemplate: '',
            outreachPremiumGraphicUrl: '',
            outreachPremiumPostText: '',
            outreachPremiumVideoScript: ''
        });
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Content Topics</h3>
                <Button onClick={() => setShowDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Topic
                </Button>
            </div>

            <div className="space-y-4">
                {topics.map((topic) => (
                    <Card key={topic.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">Week {topic.weekNumber}</Badge>
                                    {topic.isActive ? 
                                        <Badge className="bg-green-100 text-green-800">Active</Badge> : 
                                        <Badge variant="outline">Inactive</Badge>
                                    }
                                </div>
                                <h4 className="font-semibold text-lg mb-2">{topic.title}</h4>
                                <p className="text-slate-600 text-sm mb-2">{topic.coreQuestion}</p>
                                <div className="flex flex-wrap gap-1">
                                    {topic.keywords?.map((keyword, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">{keyword}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(topic)}>
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(topic.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTopic ? 'Edit Topic' : 'Create New Topic'}</DialogTitle>
                        <DialogDescription>
                            Define all content for a specific week. Upload graphics and input all text here.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-6 py-4">
                        <Card>
                            <CardHeader><CardTitle>Core Topic Details</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Week Number</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.weekNumber}
                                        onChange={(e) => setFormData({...formData, weekNumber: e.target.value})}
                                        placeholder="1-52"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input 
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        placeholder="e.g., Is now a good time to buy?"
                                    />
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <Label>Core Question (for Market Pack AI)</Label>
                                    <Textarea 
                                        value={formData.coreQuestion}
                                        onChange={(e) => setFormData({...formData, coreQuestion: e.target.value})}
                                        placeholder="The detailed question or theme that will guide AI content generation..."
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <Label>Keywords</Label>
                                    <Input 
                                        value={formData.keywords}
                                        onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                                        placeholder="interest rates, housing market (comma separated)"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch 
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                                        id="topic-active"
                                    />
                                    <Label htmlFor="topic-active">Active</Label>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader><CardTitle>Social Media Pack (Free)</CardTitle></CardHeader>
                             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <FileUploader label="Feed Graphic" currentUrl={formData.socialFeedGraphicUrl} onUpload={(url) => setFormData({...formData, socialFeedGraphicUrl: url})} />
                                 <FileUploader label="Story Graphic" currentUrl={formData.socialStoryGraphicUrl} onUpload={(url) => setFormData({...formData, socialStoryGraphicUrl: url})} />
                                 <FileUploader label="Carousel Graphics (up to 8)" isMultiple={true} currentUrl={formData.socialCarouselGraphicUrls} onUpload={(urls) => setFormData({...formData, socialCarouselGraphicUrls: urls})} />
                                 <div className="space-y-2">
                                     <Label>Feed Caption</Label>
                                     <Textarea value={formData.socialFeedCaption} onChange={(e) => setFormData({...formData, socialFeedCaption: e.target.value})} rows={3}/>
                                 </div>
                                 <div className="space-y-2">
                                     <Label>Carousel Caption</Label>
                                     <Textarea value={formData.socialCarouselCaption} onChange={(e) => setFormData({...formData, socialCarouselCaption: e.target.value})} rows={3}/>
                                 </div>
                                  <div className="space-y-2">
                                     <Label>Hashtags</Label>
                                     <Input value={formData.socialHashtags} onChange={(e) => setFormData({...formData, socialHashtags: e.target.value})} />
                                 </div>
                             </CardContent>
                        </Card>
                        
                        <Card>
                             <CardHeader><CardTitle>Social Media Pack (Premium)</CardTitle></CardHeader>
                             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FileUploader label="Premium Graphic 1" currentUrl={formData.socialPremiumGraphic1Url} onUpload={(url) => setFormData({...formData, socialPremiumGraphic1Url: url})} />
                                <FileUploader label="Premium Graphic 2" currentUrl={formData.socialPremiumGraphic2Url} onUpload={(url) => setFormData({...formData, socialPremiumGraphic2Url: url})} />
                                <FileUploader label="Premium Carousel" currentUrl={formData.socialPremiumCarouselUrl} onUpload={(url) => setFormData({...formData, socialPremiumCarouselUrl: url})} />
                                <div className="space-y-2 md:col-span-2">
                                     <Label>Reel Script</Label>
                                     <Textarea value={formData.socialPremiumReelScript} onChange={(e) => setFormData({...formData, socialPremiumReelScript: e.target.value})} rows={4}/>
                                </div>
                             </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Outreach Pack (Free & Premium)</CardTitle></CardHeader>
                             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                     <Label>Outreach Topic Title</Label>
                                     <Input value={formData.outreachTopicTitle} onChange={(e) => setFormData({...formData, outreachTopicTitle: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                     <Label>Email Template</Label>
                                     <Textarea value={formData.outreachEmail} onChange={(e) => setFormData({...formData, outreachEmail: e.target.value})} rows={4}/>
                                </div>
                                <div className="space-y-2">
                                     <Label>Call Script</Label>
                                     <Textarea value={formData.outreachCallScript} onChange={(e) => setFormData({...formData, outreachCallScript: e.target.value})} rows={4}/>
                                </div>
                                <div className="space-y-2">
                                     <Label>DM Template</Label>
                                     <Textarea value={formData.outreachDmTemplate} onChange={(e) => setFormData({...formData, outreachDmTemplate: e.target.value})} rows={4}/>
                                </div>

                                <div className="md:col-span-2 my-4 border-t"></div>

                                <FileUploader label="Premium Outreach Graphic" currentUrl={formData.outreachPremiumGraphicUrl} onUpload={(url) => setFormData({...formData, outreachPremiumGraphicUrl: url})} />
                                <div className="space-y-2">
                                     <Label>Premium Post Text</Label>
                                     <Textarea value={formData.outreachPremiumPostText} onChange={(e) => setFormData({...formData, outreachPremiumPostText: e.target.value})} rows={4}/>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                     <Label>Premium Video Script</Label>
                                     <Textarea value={formData.outreachPremiumVideoScript} onChange={(e) => setFormData({...formData, outreachPremiumVideoScript: e.target.value})} rows={4}/>
                                </div>
                             </CardContent>
                        </Card>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Topic'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

const PromptsManager = () => {
    const [prompts, setPrompts] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        promptId: '',
        purpose: '',
        contentType: '',
        tier: 'free',
        systemMessage: '',
        userMessageTemplate: '',
        creditsCost: 0
    });

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        try {
            const data = await AiPromptConfig.list('-created_date');
            setPrompts(data);
        } catch (error) {
            console.error('Failed to load prompts:', error);
            toast.error('Failed to load AI prompts');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                creditsCost: parseInt(formData.creditsCost) || 0
            };

            if (editingPrompt) {
                await AiPromptConfig.update(editingPrompt.id, payload);
                toast.success('Prompt updated successfully');
            } else {
                await AiPromptConfig.create(payload);
                toast.success('Prompt created successfully');
            }

            await loadPrompts();
            handleCancel();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save prompt');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (prompt) => {
        setEditingPrompt(prompt);
        setFormData({
            promptId: prompt.promptId,
            purpose: prompt.purpose,
            contentType: prompt.contentType,
            tier: prompt.tier,
            systemMessage: prompt.systemMessage || '',
            userMessageTemplate: prompt.userMessageTemplate,
            creditsCost: prompt.creditsCost || 0
        });
        setShowDialog(true);
    };

    const handleDelete = async (promptId) => {
        if (!confirm('Are you sure you want to delete this prompt?')) return;
        
        try {
            await AiPromptConfig.delete(promptId);
            toast.success('Prompt deleted successfully');
            await loadPrompts();
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete prompt');
        }
    };

    const handleCancel = () => {
        setShowDialog(false);
        setEditingPrompt(null);
        setFormData({
            promptId: '',
            purpose: '',
            contentType: '',
            tier: 'free',
            systemMessage: '',
            userMessageTemplate: '',
            creditsCost: 0
        });
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">AI Prompt Configurations</h3>
                <Button onClick={() => setShowDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Prompt
                </Button>
            </div>

            <div className="space-y-4">
                {prompts.map((prompt) => (
                    <Card key={prompt.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">{prompt.promptId}</Badge>
                                    <Badge className={prompt.tier === 'free' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}>
                                        {prompt.tier}
                                    </Badge>
                                    <Badge variant="secondary">{prompt.contentType}</Badge>
                                    {prompt.creditsCost > 0 && <Badge className="bg-orange-100 text-orange-800">{prompt.creditsCost} credits</Badge>}
                                </div>
                                <h4 className="font-semibold text-lg mb-2">{prompt.purpose}</h4>
                                <p className="text-slate-600 text-sm">{prompt.userMessageTemplate?.substring(0, 150)}...</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(prompt)}>
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(prompt.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}</DialogTitle>
                        <DialogDescription>
                            Configure AI prompts that will generate different types of content.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Prompt ID</Label>
                                <Input 
                                    value={formData.promptId}
                                    onChange={(e) => setFormData({...formData, promptId: e.target.value})}
                                    placeholder="e.g., social_caption_generic"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Content Type</Label>
                                <Select value={formData.contentType} onValueChange={(value) => setFormData({...formData, contentType: value})}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="social_graphic_feed">Social Graphic (Feed)</SelectItem>
                                        <SelectItem value="social_graphic_story">Social Graphic (Story)</SelectItem>
                                        <SelectItem value="social_caption">Social Caption</SelectItem>
                                        <SelectItem value="outreach_email">Outreach Email</SelectItem>
                                        <SelectItem value="video_script">Video Script</SelectItem>
                                        <SelectItem value="blog_post">Blog Post</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tier</Label>
                                <Select value={formData.tier} onValueChange={(value) => setFormData({...formData, tier: value})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="unlockable">Unlockable</SelectItem>
                                        <SelectItem value="premium_market">Premium Market</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Credits Cost</Label>
                                <Input 
                                    type="number"
                                    value={formData.creditsCost}
                                    onChange={(e) => setFormData({...formData, creditsCost: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Purpose</Label>
                            <Input 
                                value={formData.purpose}
                                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                                placeholder="Brief description of what this prompt generates"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>System Message</Label>
                            <Textarea 
                                value={formData.systemMessage}
                                onChange={(e) => setFormData({...formData, systemMessage: e.target.value})}
                                placeholder="Static instructions for the AI (optional)"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>User Message Template</Label>
                            <Textarea 
                                value={formData.userMessageTemplate}
                                onChange={(e) => setFormData({...formData, userMessageTemplate: e.target.value})}
                                placeholder="Dynamic prompt with placeholders like {{topic_title}}, {{user_city}}, {{brand_color_primary}}"
                                rows={5}
                            />
                            <p className="text-xs text-slate-500">
                                Available placeholders: topic_title, topic_question, user_name, user_city, user_state, brand_color_primary, brand_color_secondary (wrap each in double curly braces)
                            </p>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Prompt'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

const PalettesManager = () => {
    const [palettes, setPalettes] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingPalette, setEditingPalette] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        paletteId: '',
        name: '',
        primaryColorHex: '',
        secondaryColorHex: '',
        accentColorHex1: '',
        accentColorHex2: '',
        isActive: true
    });

    useEffect(() => {
        loadPalettes();
    }, []);

    const loadPalettes = async () => {
        try {
            const data = await BrandColorPalette.list('-created_date');
            setPalettes(data);
        } catch (error) {
            console.error('Failed to load palettes:', error);
            toast.error('Failed to load color palettes');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (editingPalette) {
                await BrandColorPalette.update(editingPalette.id, formData);
                toast.success('Palette updated successfully');
            } else {
                await BrandColorPalette.create(formData);
                toast.success('Palette created successfully');
            }

            await loadPalettes();
            handleCancel();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save palette');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (palette) => {
        setEditingPalette(palette);
        setFormData({
            paletteId: palette.paletteId,
            name: palette.name,
            primaryColorHex: palette.primaryColorHex,
            secondaryColorHex: palette.secondaryColorHex || '',
            accentColorHex1: palette.accentColorHex1 || '',
            accentColorHex2: palette.accentColorHex2 || '',
            isActive: palette.isActive
        });
        setShowDialog(true);
    };

    const handleDelete = async (paletteId) => {
        if (!confirm('Are you sure you want to delete this palette?')) return;
        
        try {
            await BrandColorPalette.delete(paletteId);
            toast.success('Palette deleted successfully');
            await loadPalettes();
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete palette');
        }
    };

    const handleCancel = () => {
        setShowDialog(false);
        setEditingPalette(null);
        setFormData({
            paletteId: '',
            name: '',
            primaryColorHex: '',
            secondaryColorHex: '',
            accentColorHex1: '',
            accentColorHex2: '',
            isActive: true
        });
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Brand Color Palettes</h3>
                <Button onClick={() => setShowDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Palette
                </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {palettes.map((palette) => (
                    <Card key={palette.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-semibold">{palette.name}</h4>
                                <p className="text-sm text-slate-500">{palette.paletteId}</p>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(palette)}>
                                    <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(palette.id)}>
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mb-3">
                            <div className="w-8 h-8 rounded border" style={{ backgroundColor: palette.primaryColorHex }}></div>
                            {palette.secondaryColorHex && <div className="w-8 h-8 rounded border" style={{ backgroundColor: palette.secondaryColorHex }}></div>}
                            {palette.accentColorHex1 && <div className="w-8 h-8 rounded border" style={{ backgroundColor: palette.accentColorHex1 }}></div>}
                            {palette.accentColorHex2 && <div className="w-8 h-8 rounded border" style={{ backgroundColor: palette.accentColorHex2 }}></div>}
                        </div>
                        
                        <Badge className={palette.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {palette.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </Card>
                ))}
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingPalette ? 'Edit Palette' : 'Create New Palette'}</DialogTitle>
                        <DialogDescription>
                            Define color combinations that users can choose for their brand.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Palette ID</Label>
                            <Input 
                                value={formData.paletteId}
                                onChange={(e) => setFormData({...formData, paletteId: e.target.value})}
                                placeholder="e.g., modern_storm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g., Modern Storm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <Input 
                                value={formData.primaryColorHex}
                                onChange={(e) => setFormData({...formData, primaryColorHex: e.target.value})}
                                placeholder="#222831"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Secondary Color</Label>
                            <Input 
                                value={formData.secondaryColorHex}
                                onChange={(e) => setFormData({...formData, secondaryColorHex: e.target.value})}
                                placeholder="#083377"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Accent Color 1</Label>
                            <Input 
                                value={formData.accentColorHex1}
                                onChange={(e) => setFormData({...formData, accentColorHex1: e.target.value})}
                                placeholder="#00ADB5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Accent Color 2</Label>
                            <Input 
                                value={formData.accentColorHex2}
                                onChange={(e) => setFormData({...formData, accentColorHex2: e.target.value})}
                                placeholder="#FFFFFF"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch 
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                            />
                            <Label>Active</Label>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Palette'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default function AdminContentConfigPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Content Engine Configuration</h1>
                    <p className="text-slate-600">Manage all dynamic aspects of the Social & Outreach Engine.</p>
                </header>

                <Tabs defaultValue="topics" className="w-full">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                        <TabsTrigger value="topics">Content Topics</TabsTrigger>
                        <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
                        <TabsTrigger value="palettes">Color Palettes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="topics" className="mt-6">
                        <Card>
                            <CardContent className="p-6">
                                <TopicsManager />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="prompts" className="mt-6">
                        <Card>
                            <CardContent className="p-6">
                                <PromptsManager />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="palettes" className="mt-6">
                        <Card>
                            <CardContent className="p-6">
                                <PalettesManager />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
