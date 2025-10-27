
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { AgentConfig, AgentVoice, UserPreferences } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play, Pause, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import LoadingIndicator, { InlineLoadingIndicator } from '../ui/LoadingIndicator';

export default function AgentIntelligenceTab() {
    const { user, agentConfig, preferences, refreshUserData, loading } = useContext(UserContext);
    const [voices, setVoices] = useState([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState('');
    const [audio, setAudio] = useState(null);
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null); // Changed from isPlaying
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null); // New state variable

    // Initialize profile state from user object
    useEffect(() => {
        if (user?.agentProfile) {
            setProfile(user.agentProfile);
        }
    }, [user]);

    useEffect(() => {
        async function loadVoices() {
            try {
                const data = await AgentVoice.filter({ isActive: true });
                setVoices(data || []);
            } catch (error) {
                console.error("Failed to load voices:", error);
            }
        }
        loadVoices();
    }, []);

    useEffect(() => {
        if (preferences?.elevenLabsVoiceId) {
            setSelectedVoiceId(preferences.elevenLabsVoiceId);
        }
    }, [preferences]);

    // FIX: Store handler in ref to properly cleanup
    // When audio ends, clear the audio object reference.
    // Note: currentlyPlaying state will need to be managed separately if UI needs to reflect 'ended' state.
    const handleAudioEnded = React.useRef(() => {
        setAudio(null);
        setCurrentlyPlaying(null); // Added this for consistent UI state management
    });

    useEffect(() => {
        if (audio) {
            const handler = handleAudioEnded.current;
            audio.addEventListener('ended', handler);
            
            // FIX: Proper cleanup with same function reference
            return () => {
                audio.removeEventListener('ended', handler);
            };
        }
    }, [audio]);

    const handlePreview = (voice) => {
        if (currentlyPlaying === voice.voice_id) {
            // If this voice is currently playing, pause it
            if (audio) {
                audio.pause();
                setAudio(null); // Clear the audio object when manually paused to prevent memory leaks
            }
            setCurrentlyPlaying(null);
        } else {
            // If another voice is playing or nothing is playing
            if (audio) {
                audio.pause(); // Pause any currently playing audio
                setAudio(null); // Clear the audio object of the previously playing sound
            }
            const newAudio = new Audio(voice.previewAudioUrl);
            setAudio(newAudio);
            newAudio.play();
            setCurrentlyPlaying(voice.voice_id);
        }
    };
    
    const handleSaveVoice = async () => {
        if (!selectedVoiceId || !preferences) return;
        setSaving(true);
        try {
            await UserPreferences.update(preferences.id, { elevenLabsVoiceId: selectedVoiceId });
            toast.success("AI Agent voice updated!");
            await refreshUserData();
        } catch (error) {
            console.error("Failed to save voice:", error);
            toast.error("Could not save selected voice.");
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return <div className="flex justify-center p-12"><LoadingIndicator text="Loading AI configuration..." size="md" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>AI Sales Agent Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    {agentConfig?.twilioPhoneNumber ? (
                        <>
                            <div className="mb-4">
                                <p className="text-sm font-medium text-slate-600">Your AI Agent Phone Number</p>
                                <p className="text-lg font-mono text-slate-800">{agentConfig.twilioPhoneNumber}</p>
                                <p className="text-xs text-slate-500">This is your dedicated AI Agent's phone number for outbound calling.</p>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                                <CheckCircle className="w-5 h-5" />
                                <p className="text-sm font-medium">Agent is configured and ready to call</p>
                            </div>
                        </>
                    ) : (
                         <p className="text-sm text-slate-500">Your AI Sales Agent is not yet configured. Please complete the AI Agent onboarding.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>AI Sales Agent Voice</CardTitle>
                    <CardDescription>Choose the voice your AI Agent will use when calling prospects.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
                        <SelectTrigger><SelectValue placeholder="Select a voice..."/></SelectTrigger>
                        <SelectContent>
                            {voices.map(voice => (
                                <SelectItem key={voice.id} value={voice.voice_id}>
                                    <div className="flex justify-between items-center w-full">
                                        <span>{voice.name}</span>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handlePreview(voice); }}>
                                            {currentlyPlaying === voice.voice_id ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSaveVoice} disabled={saving || !selectedVoiceId}>
                        {saving && <InlineLoadingIndicator />} Save Voice
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Intelligence Profile</CardTitle>
                    <CardDescription>This profile helps the AI to understand your business style to provide tailored coaching and tasks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <IntelligenceProfileSection title="Experience & Business" profile={profile} fields={['experienceLevel', 'workCommitment', 'businessStructure', 'workSchedule']} />
                    <IntelligenceProfileSection title="Performance & Database" profile={profile} fields={['previousYearTransactions', 'previousYearVolume', 'databaseSize', 'sphereWarmth', 'averagePricePoint']} />
                    <IntelligenceProfileSection title="Challenges & Growth" profile={profile} fields={['businessConsistency', 'biggestChallenges', 'growthTimeline', 'learningPreference']} />
                </CardContent>
            </Card>
        </div>
    );
}

const IntelligenceProfileSection = ({ title, profile, fields }) => {
    // Check if profile exists before trying to access its fields
    const isComplete = profile ? fields.every(field => profile?.[field] != null && profile?.[field] !== '') : false;
    
    const formatFieldName = (fieldName) => {
        return fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };
    
    return (
        <div className="border-t py-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-slate-700">{title}</h4>
                <div className="flex items-center gap-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isComplete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {isComplete ? 'Complete' : 'Incomplete'}
                    </span>
                    <Button asChild variant="outline" size="sm">
                        <Link to={createPageUrl('IntelligenceSurvey')}>Edit</Link>
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                {fields.map(field => (
                     <div key={field} className="flex justify-between">
                        <span>{formatFieldName(field)}:</span>
                        <span className="font-medium text-slate-800 text-right">{profile?.[field] || '–'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
