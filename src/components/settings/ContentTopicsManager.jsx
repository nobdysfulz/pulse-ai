
import React, { useState, useEffect, useRef } from 'react';
import { ContentTopic } from '@/api/entities';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Save, X, Upload, Image, ExternalLink, Loader2 } from 'lucide-react'; // Updated icons

const TopicForm = ({ topic, onSave, onCancel, isOpen, onOpenChange }) => {
  const [formData, setFormData] = useState(topic || {
    weekNumber: 1,
    title: '',
    coreQuestion: '',
    keywords: [],
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
    outreachEmailSubject: '', // Added new field
    outreachEmail: '',
    outreachCallScript: '',
    outreachDmTemplate: '',
    outreachPremiumGraphicUrl: '',
    outreachPremiumPostText: '',
    outreachPremiumVideoScript: ''
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [uploading, setUploading] = useState('');
  const fileInputRefs = useRef({});

  useEffect(() => {
    if (topic) {
      setFormData(topic);
    } else {
      // Reset form data for new topic creation when dialog opens without a topic
      setFormData({
        weekNumber: 1,
        title: '',
        coreQuestion: '',
        keywords: [],
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
        outreachEmailSubject: '',
        outreachEmail: '',
        outreachCallScript: '',
        outreachDmTemplate: '',
        outreachPremiumGraphicUrl: '',
        outreachPremiumPostText: '',
        outreachPremiumVideoScript: ''
      });
    }
  }, [topic, isOpen]); // Added isOpen to dependency array to reset form on new topic

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleImageUpload = async (field) => {
    const input = fileInputRefs.current[field];
    if (!input || !input.files[0]) return;

    setUploading(field);
    try {
      // Upload to Supabase Storage
      const fileName = `${Date.now()}_${input.files[0].name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('content-topics')
        .upload(fileName, input.files[0]);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('content-topics')
        .getPublicUrl(fileName);
      
      const file_url = urlData.publicUrl;
      
      if (field === 'socialCarouselGraphicUrls') {
        setFormData(prev => ({
          ...prev,
          socialCarouselGraphicUrls: [...(prev.socialCarouselGraphicUrls || []), file_url]
        }));
      } else {
        handleChange(field, file_url);
      }
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error('Failed to upload image');
    } finally {
      setUploading('');
      if (input) input.value = ''; // Clear file input
    }
  };

  const ImageUploadField = ({ field, label, multiple = false }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input
          type="file"
          accept="image/*"
          ref={(ref) => fileInputRefs.current[field] = ref}
          onChange={() => handleImageUpload(field)}
          className="hidden"
          multiple={multiple} // Ensure multiple attribute is set if needed for input
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRefs.current[field]?.click()}
          disabled={uploading === field}
        >
          {uploading === field ? (
            <>Uploading...</>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </>
          )}
        </Button>
        {!multiple && formData[field] && (
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(formData[field], '_blank')}
            title="View image"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>
      {!multiple && formData[field] && (
        <div className="mt-2">
          <img src={formData[field]} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
        </div>
      )}
      {multiple && formData[field] && formData[field].length > 0 && (
        <div className="flex gap-2 flex-wrap mt-2">
          {formData[field].map((url, index) => (
            <div key={index} className="relative">
              <img src={url} alt={`Preview ${index + 1}`} className="w-20 h-20 object-cover rounded-lg" />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    [field]: prev[field].filter((_, i) => i !== index)
                  }));
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{topic ? 'Edit Content Topic' : 'Create New Content Topic'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weekNumber">Week Number*</Label>
              <Input
                id="weekNumber"
                type="number"
                value={formData.weekNumber}
                onChange={(e) => handleChange('weekNumber', parseInt(e.target.value) || 1)}
                min="1"
                max="52"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title*</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Is now a good time to buy?"
              required
            />
          </div>

          <div>
            <Label htmlFor="coreQuestion">Core Question*</Label>
            <Textarea
              id="coreQuestion"
              value={formData.coreQuestion}
              onChange={(e) => handleChange('coreQuestion', e.target.value)}
              placeholder="The core question or theme to guide the AI"
              rows={3}
              required
            />
          </div>

          {/* Keywords */}
          <div>
            <Label>Keywords</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keyword"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
              />
              <Button type="button" onClick={handleAddKeyword}>Add</Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {formData.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveKeyword(keyword)}>
                  {keyword} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          {/* Social Media Section */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Social Media Content</h4>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadField field="socialFeedGraphicUrl" label="Feed Graphic" />
              <ImageUploadField field="socialStoryGraphicUrl" label="Story Graphic" />
              <ImageUploadField field="socialCarouselGraphicUrls" label="Carousel Graphics" multiple />
              <ImageUploadField field="socialPremiumGraphic1Url" label="Premium Graphic 1" />
              <ImageUploadField field="socialPremiumGraphic2Url" label="Premium Graphic 2" />
              <ImageUploadField field="socialPremiumCarouselUrl" label="Premium Carousel" />
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div>
                <Label htmlFor="socialFeedCaption">Feed Caption</Label>
                <Textarea
                  id="socialFeedCaption"
                  value={formData.socialFeedCaption}
                  onChange={(e) => handleChange('socialFeedCaption', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="socialCarouselCaption">Carousel Caption</Label>
                <Textarea
                  id="socialCarouselCaption"
                  value={formData.socialCarouselCaption}
                  onChange={(e) => handleChange('socialCarouselCaption', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="socialHashtags">Hashtags</Label>
                <Input
                  id="socialHashtags"
                  value={formData.socialHashtags}
                  onChange={(e) => handleChange('socialHashtags', e.target.value)}
                  placeholder="#realestate #homebuying #market"
                />
              </div>
              <div>
                <Label htmlFor="socialPremiumReelScript">Premium Reel Script</Label>
                <Textarea
                  id="socialPremiumReelScript"
                  value={formData.socialPremiumReelScript}
                  onChange={(e) => handleChange('socialPremiumReelScript', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Outreach Section */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Outreach Content</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="outreachTopicTitle">Topic Title</Label>
                <Input
                  id="outreachTopicTitle"
                  value={formData.outreachTopicTitle}
                  onChange={(e) => handleChange('outreachTopicTitle', e.target.value)}
                />
              </div>
              <ImageUploadField field="outreachPremiumGraphicUrl" label="Premium Graphic" />
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div>
                <Label htmlFor="outreachEmailSubject">Email Subject</Label>
                <Input
                  id="outreachEmailSubject"
                  value={formData.outreachEmailSubject}
                  onChange={(e) => handleChange('outreachEmailSubject', e.target.value)}
                  placeholder="Subject line for the email"
                />
              </div>
              <div>
                <Label htmlFor="outreachEmail">Email Template Body</Label>
                <Textarea
                  id="outreachEmail"
                  value={formData.outreachEmail}
                  onChange={(e) => handleChange('outreachEmail', e.target.value)}
                  rows={4}
                  placeholder="The main body content of the email"
                />
              </div>
              <div>
                <Label htmlFor="outreachCallScript">Call Script</Label>
                <Textarea
                  id="outreachCallScript"
                  value={formData.outreachCallScript}
                  onChange={(e) => handleChange('outreachCallScript', e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="outreachDmTemplate">DM Template</Label>
                <Textarea
                  id="outreachDmTemplate"
                  value={formData.outreachDmTemplate}
                  onChange={(e) => handleChange('outreachDmTemplate', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="outreachPremiumPostText">Premium Post Text</Label>
                <Textarea
                  id="outreachPremiumPostText"
                  value={formData.outreachPremiumPostText}
                  onChange={(e) => handleChange('outreachPremiumPostText', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="outreachPremiumVideoScript">Premium Video Script</Label>
                <Textarea
                  id="outreachPremiumVideoScript"
                  value={formData.outreachPremiumVideoScript}
                  onChange={(e) => handleChange('outreachPremiumVideoScript', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Save Topic
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function ContentTopicsManager() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTopic, setEditingTopic] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const TOPICS_PER_PAGE = 20; // Add pagination

  useEffect(() => {
    loadTopics(1); // Load initial page
  }, []);

  const loadTopics = async (pageNum = 1) => {
    if (pageNum === 1) {
      setLoading(true);
      setPage(1); // Reset page number when loading from scratch
      setHasMore(true); // Assume there might be more when loading page 1
    } else {
      setLoadingMore(true);
    }

    try {
      // Add pagination with limit and offset
      const data = await ContentTopic.list('-weekNumber', TOPICS_PER_PAGE, (pageNum - 1) * TOPICS_PER_PAGE);
      
      if (pageNum === 1) {
        setTopics(data || []);
      } else {
        setTopics(prev => [...prev, ...(data || [])]);
      }

      // Check if there are more topics to load
      setHasMore(data && data.length === TOPICS_PER_PAGE);
    } catch (error) {
      console.error('Error loading topics:', error);
      toast.error('Failed to load content topics'); // Show error to user
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadTopics(nextPage);
  };

  const handleSave = async (topicData) => {
    try {
      if (editingTopic) {
        await ContentTopic.update(editingTopic.id, topicData);
        toast.success('Content topic updated successfully');
      } else {
        await ContentTopic.create(topicData);
        toast.success('Content topic created successfully');
      }
      setShowForm(false);
      setEditingTopic(null);
      loadTopics(1); // Reload from page 1 to see new/updated topic at correct sort order
    } catch (error) {
      console.error('Failed to save content topic:', error);
      toast.error('Failed to save content topic');
    }
  };

  const handleDelete = async (topic) => {
    if (!confirm(`Are you sure you want to delete topic: "${topic.title}"?`)) return;
    
    try {
      await ContentTopic.delete(topic.id);
      toast.success('Content topic deleted successfully');
      loadTopics(1); // Reload from page 1 to reflect deletion
    } catch (error) {
      console.error('Failed to delete content topic:', error);
      toast.error('Failed to delete content topic');
    }
  };

  const handleEdit = (topic) => {
    setEditingTopic(topic);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingTopic(null); // Clear editing topic for new creation
    setShowForm(true);
  };

  if (loading && page === 1) { // Only show full loader on initial load
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#1E293B]">Content Topics</h2>
          <p className="text-sm text-[#64748B]">
            Showing {topics.length} topics
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Topic
        </Button>
      </div>

      <div className="space-y-2">
        {topics.length === 0 && !loading && (
          <p className="text-center text-gray-500 py-8">No content topics found. Create one!</p>
        )}
        {topics.map(topic => (
          <div
            key={topic.id}
            className="p-4 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#7C3AED] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-[#1E293B]">Week {topic.weekNumber}: {topic.title}</h3>
                <p className="text-sm text-[#64748B] mt-1">{topic.coreQuestion}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(topic)} title="Edit Topic">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(topic)} title="Delete Topic">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                <div className="flex gap-2 flex-wrap">
                    {topic.keywords && topic.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{keyword}</Badge>
                    ))}
                </div>
                <Badge variant={topic.isActive ? "default" : "secondary"}>
                    {topic.isActive ? "Active" : "Inactive"}
                </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Add load more button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Topics'
            )}
          </Button>
        </div>
      )}

      {/* Re-integrated TopicForm component */}
      <TopicForm
        topic={editingTopic}
        isOpen={showForm}
        onOpenChange={setShowForm}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingTopic(null); // Clear editing topic on cancel
        }}
      />
    </div>
  );
}
