
import React, { useState, useEffect } from 'react';
import { ContentPack } from '@/api/entities';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Keeping Label as it might be useful for new elements or future extensions
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2, Loader2, Save } from 'lucide-react'; // Removed unused icons, added Save
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // New imports
import { Switch } from '@/components/ui/switch'; // New import
import { ContentTopic } from '@/api/entities'; // New import

export default function ContentPackManager() {
  const [packs, setPacks] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [packData, topicData] = await Promise.all([
        ContentPack.list('-created_date'),
        ContentTopic.list('-created_date')
      ]);
      setPacks(packData.map(p => ({ ...p, file: null }))); // Initialize file as null for existing packs
      setTopics(topicData);
    } catch (error) {
      console.error("Failed to load content packs or topics:", error);
      toast.error("Failed to load data.", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  const handleFieldChange = (id, field, value) => {
    setPacks(packs.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleFileChange = (e, id) => {
    const file = e.target.files[0];
    if (file) {
      setPacks(packs.map(p => (p.id === id ? { ...p, file } : p)));
    }
  };

  const handleSave = async (pack) => {
    setUploadingId(pack.id);
    try {
      let fileUrl = pack.fileUrl;
      if (pack.file) {
        // Upload file to Supabase Storage
        const fileName = `${Date.now()}_${pack.file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('content-packs')
          .upload(fileName, pack.file);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('content-packs')
          .getPublicUrl(fileName);
        
        fileUrl = urlData.publicUrl;
      }
      
      if (!pack.topicId) {
        toast.error("Please select a content topic before saving.");
        setUploadingId(null);
        return;
      }

      const payload = {
        packType: pack.packType,
        fileName: pack.file?.name || pack.fileName, // Use new file name if file is selected, else existing
        fileUrl: fileUrl,
        weekIdentifier: pack.weekIdentifier,
        isActive: pack.isActive,
        topicId: pack.topicId,
      };

      if (pack.id.startsWith('new-')) {
        await ContentPack.create(payload);
        toast.success("New pack created!");
      } else {
        await ContentPack.update(pack.id, payload);
        toast.success("Pack updated!");
      }
      fetchData(); // Refresh data after save
    } catch (error) {
      console.error("Failed to save content pack:", error);
      toast.error("Failed to upload content pack", { description: error.message });
    } finally {
      setUploadingId(null);
    }
  };

  const handleAddNew = () => {
    const currentYear = new Date().getFullYear();
    const currentWeek = new Date().getWeek(); // Using the helper below
    
    setPacks(prev => [{
      id: `new-${Date.now()}`, // Temporary ID for new packs
      packType: 'social_media', // Default pack type
      fileName: '',
      fileUrl: '',
      weekIdentifier: `Week ${currentWeek} - ${currentYear}`,
      isActive: false,
      file: null, // For new file upload
      topicId: '' // Must be selected by user
    }, ...prev]);
  };

  const handleDelete = async (packId) => {
    if (!window.confirm("Are you sure you want to delete this content pack?")) {
      return;
    }
    setUploadingId(packId); // Use uploadingId for delete state too
    try {
      await ContentPack.delete(packId);
      toast.success("Content pack deleted successfully!");
      fetchData(); // Refresh data after delete
    } catch (error) {
      console.error("Failed to delete content pack:", error);
      toast.error("Failed to delete content pack.", { description: error.message });
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold">Content Pack Manager</h3>
        <Button onClick={handleAddNew}>Add New Pack</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      <div className="space-y-4">
        {packs.map((pack) => (
          <Card key={pack.id}>
            <CardHeader>
              <CardTitle className="capitalize">
                {pack.fileName || `New ${pack.packType.replace('_', ' ')} Pack`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor={`packType-${pack.id}`}>Pack Type</Label>
                    <Select
                        value={pack.packType}
                        onValueChange={(value) => handleFieldChange(pack.id, 'packType', value)}
                        disabled={uploadingId === pack.id}
                    >
                        <SelectTrigger id={`packType-${pack.id}`}><SelectValue placeholder="Select Pack Type"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="social_media">Social Media Pack</SelectItem>
                            <SelectItem value="outreach">Outreach Pack</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`topicId-${pack.id}`}>Content Topic</Label>
                    <Select
                        value={pack.topicId}
                        onValueChange={(value) => handleFieldChange(pack.id, 'topicId', value)}
                        disabled={uploadingId === pack.id}
                    >
                        <SelectTrigger id={`topicId-${pack.id}`}><SelectValue placeholder="Select a Content Topic..."/></SelectTrigger>
                        <SelectContent>
                            {topics.map(topic => (
                                <SelectItem key={topic.id} value={topic.id}>{topic.title} (Week {topic.weekNumber})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`week-identifier-${pack.id}`}>Week Identifier</Label>
                <Input
                  id={`week-identifier-${pack.id}`}
                  placeholder="e.g., Week 25 - 2024"
                  value={pack.weekIdentifier}
                  onChange={(e) => handleFieldChange(pack.id, 'weekIdentifier', e.target.value)}
                  disabled={uploadingId === pack.id}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`file-input-${pack.id}`}>ZIP File</Label>
                <Input id={`file-input-${pack.id}`} type="file" accept=".zip" onChange={(e) => handleFileChange(e, pack.id)} disabled={uploadingId === pack.id} />
                {pack.fileUrl && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Current file: <a href={pack.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{pack.fileName}</a>
                  </p>
                )}
                 {pack.file && (
                  <p className="text-sm text-green-600 mt-1">New file selected: {pack.file.name}</p>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`active-switch-${pack.id}`}
                    checked={pack.isActive}
                    onCheckedChange={(checked) => handleFieldChange(pack.id, 'isActive', checked)}
                    disabled={uploadingId === pack.id}
                  />
                  <Label htmlFor={`active-switch-${pack.id}`}>Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={() => handleDelete(pack.id)} size="sm" variant="destructive" disabled={uploadingId === pack.id}>
                    {uploadingId === pack.id && <Loader2 className="w-4 h-4 animate-spin mr-2"/>}
                    <Trash2 className="w-4 h-4 mr-2"/>
                    Delete
                  </Button>
                  <Button onClick={() => handleSave(pack)} size="sm" disabled={uploadingId === pack.id}>
                    {uploadingId === pack.id ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helper to get week number
Date.prototype.getWeek = function() {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  const week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};
