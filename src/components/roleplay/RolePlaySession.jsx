
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Mic, MicOff, Square, Send, Loader2, Brain, ArrowLeft, Clock, MessageCircle, AlertTriangle } from 'lucide-react';
import { openaiRolePlay } from '@/api/functions';
import { elevenLabsTTS } from '@/api/functions';
import { whisperSTT } from '@/api/functions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import AudioPermissionFlow from './AudioPermissionFlow';

// Helper to convert Blob to Base64
const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (reader.error) {
            reject(reader.error);
        } else {
            // result is "data:audio/webm;base64,xxxx..."
            // We need to extract just "xxxx..."
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

// Helper to play audio from base64
const playAudioFromBase64 = (base64String) => {
    return new Promise((resolve, reject) => {
        try {
            const audio = new Audio(`data:audio/mpeg;base64,${base64String}`);
            audio.play();
            audio.onended = resolve;
            audio.onerror = reject;
        } catch (error) {
            reject(error);
        }
    });
};

const LiveCoaching = ({ analysis, isEnabled, onToggle }) => {
    if (!isEnabled) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-black" />
                        Live Coaching
                    </h3>
                    <Switch checked={isEnabled} onCheckedChange={onToggle} />
                </div>
                <p className="text-sm text-slate-500">Enable live coaching to get real-time feedback on your performance.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-black" />
                    Live Coaching
                </h3>
                <Switch checked={isEnabled} onCheckedChange={onToggle} />
            </div>
            
            {analysis ? (
                <div className="space-y-3 text-sm">
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="font-semibold text-purple-800 mb-1">Strengths</div>
                        <p className="text-purple-700">{analysis.strengths?.join(', ')}</p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="font-semibold text-amber-800 mb-1">Areas for Improvement</div>
                        <p className="text-amber-700">{analysis.improvements?.join(', ')}</p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-semibold text-blue-800 mb-1">Coaching Tip</div>
                        <p className="text-blue-700">{analysis.coaching_tip}</p>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-slate-500">Start the conversation to receive live coaching feedback.</p>
            )}
        </div>
    );
};

const TranscriptMessage = ({ message }) => {
    const isAgent = message.speaker === 'Agent';
    
    return (
        <div className={`flex gap-3 mb-3 ${isAgent ? 'justify-end' : 'justify-start'}`}>
            <div className={cn(
                "max-w-[70%] px-4 py-2 rounded-lg",
                isAgent 
                    ? "bg-blue-600 text-white" 
                    : "bg-green-600 text-white"
            )}>
                <div className="text-xs opacity-75 mb-1">
                    {isAgent ? 'You' : 'Prospect'}
                </div>
                <p className="text-sm">{message.text}</p>
            </div>
        </div>
    );
};

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function RolePlaySession() {
    const location = useLocation();
    const navigate = useNavigate();
    const { scenario } = location.state || {};
    
    const [audioPermission, setAudioPermission] = useState('prompt'); // prompt, granted, denied
    const [transcript, setTranscript] = useState([]);
    const [sessionState, setSessionState] = useState('idle'); // idle, recording, processing, playing
    const [lastAnalysis, setLastAnalysis] = useState(null);
    const [isTextOnlyMode, setIsTextOnlyMode] = useState(false);
    const [liveCoachingEnabled, setLiveCoachingEnabled] = useState(true);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [textInput, setTextInput] = useState('');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const onSessionComplete = useCallback((results) => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        navigate(createPageUrl('SessionResults'), { state: { results, scenario } });
    }, [navigate, scenario]);

    // Session timer
    useEffect(() => {
        if (audioPermission !== 'granted' && !isTextOnlyMode) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        if (!timerRef.current) { // Prevent multiple intervals
            timerRef.current = setInterval(() => {
                setSessionDuration(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [audioPermission, isTextOnlyMode]);

    // Initialize Session
    useEffect(() => {
        if (!scenario) {
            toast.error("No scenario selected. Redirecting...");
            navigate(createPageUrl('RolePlay'));
            return;
        }

        // Do not start session until audio permission is handled AND not in text-only mode
        // Or if it is text-only mode, it can start immediately
        if (audioPermission !== 'granted' && !isTextOnlyMode) return;
        
        // Only start the session if the transcript is empty
        if (transcript.length > 0) return;

        const startSession = async () => {
            setSessionState('processing');
            try {
                const initialResponse = await openaiRolePlay({ scenario: scenario.initialContext, clientPersona: scenario.clientPersona });
                const initialText = initialResponse.data.clientResponse;
                const newTranscript = [{ speaker: 'AI', text: initialText }];
                setTranscript(newTranscript);

                if (!isTextOnlyMode) {
                    try {
                        const audioResponse = await elevenLabsTTS({ text: initialText, persona: scenario.clientPersona });
                        
                        if (!audioResponse.data.success) {
                            if (audioResponse.data.fallback === 'text_only') {
                                setIsTextOnlyMode(true);
                                toast.info("Continuing in text-only mode. Audio voices are temporarily unavailable.", { duration: 4000 });
                            } else {
                                throw new Error(audioResponse.data.error);
                            }
                        } else {
                            setSessionState('playing');
                            await playAudioFromBase64(audioResponse.data.audioData);
                        }
                    } catch (audioError) {
                        console.warn("Audio playback failed:", audioError);
                        setIsTextOnlyMode(true);
                        toast.info("Continuing in text-only mode. Audio temporarily unavailable.", { duration: 4000 });
                    }
                }
                
                setSessionState('idle');

            } catch (error) {
                console.error("Session start error:", error);
                toast.error("Session failed to start.", { description: error.message });
                onSessionComplete({ error: true, transcript: [] });
            }
        };
        startSession();
    }, [scenario, navigate, onSessionComplete, audioPermission, isTextOnlyMode, transcript.length]);
    
    const handleStartRecording = async () => {
        if (isTextOnlyMode || audioPermission !== 'granted') return;
        
        setSessionState('recording');
        audioChunksRef.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                processAgentResponse(audioBlob);
                stream.getTracks().forEach(track => track.stop()); // Stop the stream after recording
            };
            mediaRecorderRef.current.start();
        } catch (error) {
            console.error("Error starting recording:", error);
            toast.error("Failed to start recording. Please check microphone permissions.");
            setSessionState('idle');
            // If recording fails, revert to text-only if not already there
            if (!isTextOnlyMode) {
                setIsTextOnlyMode(true);
                toast.warning("Microphone access issue. Switching to text-only mode.", { duration: 5000 });
            }
        }
    };

    const handleStopRecording = () => {
        if (isTextOnlyMode) return;
        
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    const handleTextSubmit = () => {
        if (!textInput.trim()) return;
        processAgentResponse(null, textInput.trim());
        setTextInput('');
    };
    
    const processAgentResponse = async (audioBlob, textInput = null) => {
        setSessionState('processing');
        try {
            let agentText = textInput;

            if (audioBlob && !textInput) {
                const audioBase64 = await blobToBase64(audioBlob);
                const sttResponse = await whisperSTT({ audioBase64, mimeType: 'audio/webm' });

                if (!sttResponse.data.success) throw new Error(sttResponse.data.error || 'Speech-to-text failed.');
                agentText = sttResponse.data.transcript;
            }

            if (!agentText || agentText.trim() === '') {
                toast.info("No speech detected or text entered. Please try again.");
                setSessionState('idle');
                return;
            }

            const newTranscript = [...transcript, { speaker: 'Agent', text: agentText }];
            setTranscript(newTranscript);

            const rolePlayResponse = await openaiRolePlay({
                scenario: scenario.initialContext,
                clientPersona: scenario.clientPersona,
                history: newTranscript,
                agentResponse: agentText,
                analysisRequested: true
            });
            
            const { clientResponse, analysis, conversation_ended } = rolePlayResponse.data;

            // Attach the analysis to the agent's turn it corresponds to.
            // This assumes the analysis is always for the last agent turn.
            if (analysis) {
                const lastAgentTurnIndex = newTranscript.findLastIndex(msg => msg.speaker === 'Agent');
                if (lastAgentTurnIndex !== -1) {
                    newTranscript[lastAgentTurnIndex].analysis = analysis;
                }
            }
            
            if (liveCoachingEnabled) {
                setLastAnalysis(analysis);
            }
            
            const updatedTranscript = [...newTranscript, { speaker: 'AI', text: clientResponse }];
            setTranscript(updatedTranscript);

            if (conversation_ended) {
                onSessionComplete({ transcript: updatedTranscript });
                return;
            }

            if (!isTextOnlyMode) {
                try {
                    const ttsResponse = await elevenLabsTTS({ text: clientResponse, persona: scenario.clientPersona });
                    
                    if (!ttsResponse.data.success) {
                        if (ttsResponse.data.fallback === 'text_only') {
                            setIsTextOnlyMode(true);
                            toast.info("Switching to text-only mode due to voice service unavailability.");
                        } else {
                            throw new Error(ttsResponse.data.error);
                        }
                    } else {
                        setSessionState('playing');
                        await playAudioFromBase64(ttsResponse.data.audioData);
                    }
                } catch (audioError) {
                    console.warn("AI audio playback failed:", audioError);
                    setIsTextOnlyMode(true);
                    toast.info("Switching to text-only mode due to audio error.");
                }
            }

            setSessionState('idle');
        } catch (error) {
            console.error("Error processing response:", error);
            toast.error("Error processing your response.", { description: error.message });
            setSessionState('idle');
        }
    };

    const handlePermissionResult = (result) => {
        setAudioPermission(result);
        if (result === 'denied') {
            setIsTextOnlyMode(true);
            toast.warning("Microphone access denied.", {
                description: "The session will continue in text-only mode.",
                duration: 5000,
            });
        }
    };

    if (!scenario) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-purple-600" /></div>;
    }

    if (audioPermission === 'prompt' && !isTextOnlyMode) {
        return <AudioPermissionFlow onComplete={handlePermissionResult} />;
    }

    return (
        <div className="h-screen bg-slate-100 flex flex-col">
            {/* Top Bar */}
            <div className="bg-white border-b px-6 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => onSessionComplete({ transcript: [] })} // End session without saving if no real activity
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{scenario.name}</h1>
                            <p className="text-sm text-slate-600">{scenario.description}</p>
                        </div>
                    </div>
                    {isTextOnlyMode && (
                        <div className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Text-Only Mode
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Side - Avatar Display */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="flex-1 relative bg-gradient-to-br from-slate-50 to-slate-100">
                        {/* Avatar Container */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                <div className="w-80 h-80 rounded-xl overflow-hidden shadow-2xl bg-white">
                                    <img 
                                        src={scenario.avatarImageUrl} 
                                        alt={scenario.clientPersona} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Session Timer Overlay */}
                                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-mono flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {formatTime(sessionDuration)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transcript Section */}
                    <div className="h-64 bg-slate-900 text-white flex flex-col">
                        <div className="px-4 py-2 border-b border-slate-700">
                            <h3 className="text-sm font-medium text-slate-300">Real time conversation</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {transcript.map((message, index) => (
                                <TranscriptMessage key={index} message={message} />
                            ))}
                        </div>
                        
                        {/* Controls */}
                        <div className="p-4 border-t border-slate-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {isTextOnlyMode ? (
                                        <div className="flex items-center gap-2 w-full">
                                            <div className="flex-1 relative">
                                                <Input
                                                    value={textInput}
                                                    onChange={(e) => setTextInput(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                                                    placeholder="Type your response..."
                                                    className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 pr-10"
                                                    disabled={sessionState === 'processing'}
                                                />
                                                <button
                                                    onClick={handleTextSubmit}
                                                    disabled={!textInput.trim() || sessionState === 'processing'}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white disabled:opacity-50"
                                                >
                                                    <Send className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onMouseDown={handleStartRecording}
                                            onMouseUp={handleStopRecording}
                                            onTouchStart={handleStartRecording}
                                            onTouchEnd={handleStopRecording}
                                            className={cn(
                                                "px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 flex items-center gap-2",
                                                sessionState === 'recording' 
                                                    ? 'bg-red-600 hover:bg-red-700 scale-105' 
                                                    : 'bg-red-500 hover:bg-red-600',
                                                (sessionState === 'processing' || sessionState === 'playing') && 'bg-slate-400 cursor-not-allowed'
                                            )}
                                            disabled={sessionState === 'processing' || sessionState === 'playing'}
                                        >
                                            {sessionState === 'idle' && <><Mic className="w-4 h-4" /> PUSH TO TALK</>}
                                            {sessionState === 'recording' && <><Mic className="w-4 h-4 animate-pulse" /> RECORDING...</>}
                                            {sessionState === 'processing' && <><Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...</>}
                                            {sessionState === 'playing' && <><Square className="w-4 h-4" /> AI SPEAKING...</>}
                                        </button>
                                    )}
                                </div>
                                
                                <Button 
                                    onClick={() => onSessionComplete({ transcript })} 
                                    variant="outline"
                                    className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                                >
                                    END SESSION
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Live Coaching */}
                <div className="w-80 bg-slate-50 border-l p-4">
                    <LiveCoaching 
                        analysis={lastAnalysis} 
                        isEnabled={liveCoachingEnabled}
                        onToggle={setLiveCoachingEnabled}
                    />
                </div>
            </div>
        </div>
    );
}
