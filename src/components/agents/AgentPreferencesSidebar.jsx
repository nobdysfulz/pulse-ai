import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { UserPreferences, AgentVoice } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function AgentPreferencesSidebar() {
  const { user, preferences, refreshUserData } = useContext(UserContext);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const voices = await AgentVoice.filter({ isActive: true });
        setAvailableVoices(voices || []);
        if (preferences?.elevenLabsVoiceId) {
          setSelectedVoiceId(preferences.elevenLabsVoiceId);
        }
      } catch (error) {
        toast.error("Failed to load voice options.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [preferences]);

  const handlePlayPreview = (voice) => {
    if (playingAudio) {
      playingAudio.pause();
    }
    const audio = new Audio(voice.previewAudioUrl);
    setPlayingAudio(audio);
    audio.play();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { ...preferences, userId: user.id, elevenLabsVoiceId: selectedVoiceId };
      if (preferences?.id) {
        await UserPreferences.update(preferences.id, payload);
      } else {
        await UserPreferences.create(payload);
      }
      await refreshUserData();
      toast.success("Preferences saved!");
    } catch (e) {
      toast.error("Failed to save preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-[#1E293B]">Agent Voice</h3>
        <p className="text-sm text-gray-500 mb-4">Select the voice for your outbound AI agent.</p>
        <div className="space-y-2">
          {availableVoices.map((voice) =>
          <div key={voice.id} className="flex items-center p-2 border rounded-md">
              <input
              type="radio"
              id={voice.id}
              name="agentVoice"
              value={voice.voice_id}
              checked={selectedVoiceId === voice.voice_id}
              onChange={(e) => setSelectedVoiceId(e.target.value)}
              className="mr-3" />

              <label htmlFor={voice.id} className="text-sm flex-1">{voice.name}</label>
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => handlePlayPreview(voice)}>
                <Play className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Preferences"}
      </Button>
    </div>);

}