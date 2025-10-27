
import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { agentSDK } from "@/agents";
import { UserContext } from '../components/context/UserContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send, ShieldAlert, Wrench } from 'lucide-react'; // Removed MessageSquare
import MessageBubble from '../components/agents/MessageBubble';
import { toast } from 'sonner';

export default function SupportAgentPage() {
    const { user, loading: userLoading } = useContext(UserContext);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const AGENT_NAME = "it_manager";

    const initializeConversation = useCallback(async () => {
        if (!user) return; // Ensure user is available before proceeding
        setIsLoading(true);
        try {
            const existingConvos = await agentSDK.listConversations({ agent_name: AGENT_NAME });
            if (existingConvos.length > 0) {
                setConversation(existingConvos[0]);
                setMessages(existingConvos[0].messages);
            } else {
                const newConvo = await agentSDK.createConversation({
                    agent_name: AGENT_NAME,
                    metadata: { name: `IT Support Chat - ${user.email}` }
                });
                setConversation(newConvo);
                setMessages(newConvo.messages);
            }
        } catch (error) {
            toast.error("Failed to initialize support chat.", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user]); // initializeConversation depends on 'user'

    useEffect(() => {
        if (!userLoading && user) {
            initializeConversation();
        } else if (!userLoading && !user) {
            setIsLoading(false);
        }
    }, [user, userLoading, initializeConversation]);

    useEffect(() => {
        if (conversation?.id) {
            const unsubscribe = agentSDK.subscribeToConversation(conversation.id, (data) => {
                setMessages(data.messages);
            });
            return () => unsubscribe();
        }
    }, [conversation?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (!currentMessage.trim() || !conversation) return;

        const messageContent = currentMessage;
        setCurrentMessage('');

        try {
            await agentSDK.addMessage(conversation, {
                role: 'user',
                content: messageContent,
            });
        } catch (error) {
            toast.error("Failed to send message.", { description: error.message });
            setCurrentMessage(messageContent); // Restore message on failure
        }
    };

    if (userLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <CardTitle>Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600">This feature is restricted to administrators.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <Card className="flex-1 flex flex-col h-full shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <Wrench className="w-6 h-6 text-purple-600" />
                            IT Manager Agent
                        </CardTitle>
                        {/* The incorrect WhatsApp URL generator was here. It is now removed. */}
                    </div>
                    <CardDescription>Chat with the AI agent to diagnose and resolve technical issues.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin text-purple-600" />
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <MessageBubble key={index} message={msg} />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>
                <CardFooter className="pt-4 border-t">
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            placeholder="Describe the issue or ask a question..."
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isLoading}
                        />
                        <Button onClick={handleSendMessage} disabled={!currentMessage.trim() || isLoading}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
