import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function VoiceSelection({ data, onNext, onBack }) {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState(data.selectedVoice || null);
  const [playingVoice, setPlayingVoice] = useState(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    setLoading(true);
    try {
      const voiceList = await base44.entities.AgentVoice.filter({ isActive: true });
      setVoices(voiceList || []);
    } catch (error) {
      console.error('Error loading voices:', error);
      toast.error('Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPreview = (voice) => {
    if (!voice.previewAudioUrl) return;

    setPlayingVoice(voice.voice_id);
    const audio = new Audio(voice.previewAudioUrl);
    audio.onended = () => setPlayingVoice(null);
    audio.play();
  };

  const handleContinue = () => {
    if (!selectedVoice) {
      toast.error('Please select a voice');
      return;
    }
    onNext({ selectedVoice });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1E293B] mb-3">
          Choose Your Agent's Voice
        </h2>
        <p className="text-[#64748B]">
          Select the voice your AI calling agent will use
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] space-y-4 mb-8">
        <Label>Available Voices</Label>
        <div className="space-y-3">
          {voices.map((voice) => (
            <div
              key={voice.voice_id}
              onClick={() => setSelectedVoice(voice.voice_id)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedVoice === voice.voice_id
                  ? 'border-[#7C3AED] bg-[#7C3AED]/5'
                  : 'border-[#E2E8F0] hover:border-[#7C3AED]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-[#1E293B]">{voice.name}</h4>
                </div>
                {voice.previewAudioUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPreview(voice);
                    }}
                    disabled={playingVoice === voice.voice_id}
                  >
                    {playingVoice === voice.voice_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedVoice}
          size="lg"
          className="bg-gradient-to-r from-[#E4018B] to-[#7017C3] hover:opacity-90 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}