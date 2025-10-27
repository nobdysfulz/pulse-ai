import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Edit, Trash2, Upload, Play, Pause, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { AgentVoice } from '@/api/entities';
import { base44 } from '@/api/base44Client';

export default function AgentVoiceManager() {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [playingVoice, setPlayingVoice] = useState(null);
  const [audio, setAudio] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    voice_id: '',
    previewAudioUrl: '',
    isActive: true
  });

  useEffect(() => {
    loadVoices();
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  const loadVoices = async () => {
    setLoading(true);
    try {
      const data = await AgentVoice.list('-created_date');
      setVoices(data || []);
    } catch (error) {
      console.error('Error loading voices:', error);
      toast.error('Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.wav') && !file.name.endsWith('.mp3')) {
      toast.error('Please upload a WAV or MP3 file');
      return;
    }

    setUploading(true);
    try {
      const { data } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, previewAudioUrl: data.file_url });
      toast.success('Audio file uploaded');
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error('Failed to upload audio');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.voice_id) {
      toast.error('Name and Voice ID are required');
      return;
    }

    try {
      if (editing?.id) {
        await AgentVoice.update(editing.id, formData);
        toast.success('Voice updated');
      } else {
        await AgentVoice.create(formData);
        toast.success('Voice created');
      }
      await loadVoices();
      setEditing(null);
      setFormData({ name: '', voice_id: '', previewAudioUrl: '', isActive: true });
    } catch (error) {
      console.error('Error saving voice:', error);
      toast.error('Failed to save voice');
    }
  };

  const handleEdit = (voice) => {
    setEditing(voice);
    setFormData(voice);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this voice?')) return;

    try {
      await AgentVoice.delete(id);
      toast.success('Voice deleted');
      await loadVoices();
    } catch (error) {
      console.error('Error deleting voice:', error);
      toast.error('Failed to delete voice');
    }
  };

  const togglePlayPreview = (voice) => {
    if (!voice.previewAudioUrl) {
      toast.error('No preview audio available');
      return;
    }

    if (playingVoice === voice.id) {
      audio?.pause();
      setPlayingVoice(null);
      return;
    }

    if (audio) {
      audio.pause();
    }

    const newAudio = new Audio(voice.previewAudioUrl);
    newAudio.play();
    newAudio.onended = () => setPlayingVoice(null);
    setAudio(newAudio);
    setPlayingVoice(voice.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <Card className="bg-white border border-[#E2E8F0]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#1E293B]">AI Agent Voices</h3>
            <p className="text-sm text-[#475569] mt-1">Manage available voices for AI agents</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing({})}>
              <Plus className="w-4 h-4 mr-2" />
              Add Voice
            </Button>
          )}
        </div>

        {editing && (
          <div className="mb-6 p-6 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Voice Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., David - Professional Male"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="voice_id">ElevenLabs Voice ID</Label>
                <Input
                  id="voice_id"
                  value={formData.voice_id}
                  onChange={(e) => setFormData({ ...formData, voice_id: e.target.value })}
                  placeholder="Voice ID from ElevenLabs"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Preview Audio (WAV or MP3)</Label>
                <div className="mt-1">
                  <Input
                    type="file"
                    accept=".wav,.mp3"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && <p className="text-xs text-[#7C3AED] mt-1">Uploading...</p>}
                  {formData.previewAudioUrl && <p className="text-xs text-[#22C55E] mt-1">✓ Audio uploaded</p>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active (Available for selection)</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setFormData({ name: '', voice_id: '', previewAudioUrl: '', isActive: true });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Voice
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {voices.map((voice) => (
            <div
              key={voice.id}
              className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3 flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePlayPreview(voice)}
                  disabled={!voice.previewAudioUrl}
                >
                  {playingVoice === voice.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#1E293B]">{voice.name}</p>
                    {voice.isActive ? (
                      <span className="px-2 py-0.5 bg-[#22C55E] text-white text-xs rounded-full">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[#94A3B8] text-white text-xs rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-[#64748B] mt-1">Voice ID: {voice.voice_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(voice)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(voice.id)}>
                  <Trash2 className="w-4 h-4 text-[#EF4444]" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {voices.length === 0 && !editing && (
          <div className="text-center py-12">
            <p className="text-base text-[#475569]">No voices configured</p>
            <p className="text-sm text-[#64748B] mt-1">Add your first voice</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}