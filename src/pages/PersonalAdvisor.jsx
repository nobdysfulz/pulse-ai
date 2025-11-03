
import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../components/context/UserContext';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Settings, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useQueryClient } from '@tanstack/react-query';
import AITypingIndicator from '../components/ui/AITypingIndicator';

const TypingBubble = ({ text, onTypingComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i++;
      if (i > text.length) {
        clearInterval(typingInterval);
        if (onTypingComplete) onTypingComplete();
      }
    }, 20);

    return () => clearInterval(typingInterval);
  }, [text, onTypingComplete]);

  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap">
      <ReactMarkdown>{displayedText}</ReactMarkdown>
    </div>
  );
};

const GradientSparklesIcon = ({ className }) => (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="url(#sparkles-gradient)"
      stroke="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sparkles-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e03389" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <path d="M5 3s0-2 2-2 2 2 2 2-2 2-2 2-2-2-2-2zm14 0s0-2 2-2 2 2 2 2-2 2-2 2-2-2-2-2zM5 21s0-2 2-2 2 2 2 2-2 2-2 2-2-2-2-2zm14 0s0-2 2-2 2 2 2 2-2 2-2 2-2-2-2-2zM12 2a2.83 2.83 0 0 0 2-5 2.83 2.83 0 0 0-4 0 2.83 2.83 0 0 0 2 5zm0 20a2.83 2.83 0 0 0 2-5 2.83 2.83 0 0 0-4 0 2.83 2.83 0 0 0 2 5zM2 12a2.83 2.83 0 0 0 5 2 2.83 2.83 0 0 0 0-4 2.83 2.83 0 0 0-5 2zm20 0a2.83 2.83 0 0 0 5 2 2.83 2.83 0 0 0 0-4 2.83 2.83 0 0 0-5 2zM12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6z"/>
    </svg>
);

export default function PersonalAdvisorPage() {
  const { user, loading: contextLoading } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('query');
    if (query && messages.length === 0) {
      handleSendMessage(null, query);
    }
  }, [location.search, messages.length]);

  const handleSendMessage = async (e, initialQuery = null) => {
    if (e) e.preventDefault();

    const messageText = initialQuery || inputMessage.trim();
    if (!messageText) return;

    if (initialQuery) {
        setInputMessage(messageText);
    }

    const userMessage = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
        const { data: agentContext, error: contextError } = await supabase.functions.invoke('getAgentContext', { body: {} });
        if (contextError || !agentContext) {
            throw new Error(contextError?.message || "Could not retrieve agent context.");
        }

        // Call Copilot with tool use capability
        const { data, error } = await supabase.functions.invoke('copilotChat', {
            body: {
                userPrompt: messageText,
                conversationId: conversationId,
                agentContext: agentContext,
                conversationHistory: messages,
                currentTab: 'advisor'
            }
        });

        if (error) {
            throw new Error(error.message || "The Copilot failed to respond.");
        }

        // Set conversation ID if new
        if (data.conversationId && !conversationId) {
            setConversationId(data.conversationId);
        }

        const assistantMessage = { 
            role: 'assistant', 
            content: data.response, 
            isTyping: true,
            toolCalls: data.toolCalls || []
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Invalidate queries based on tool calls
        if (data.toolCalls && data.toolCalls.length > 0) {
            data.toolCalls.forEach(tool => {
                if (tool.name === 'scheduleAppointmentTool') {
                    queryClient.invalidateQueries(['appointments']);
                    queryClient.invalidateQueries(['dailyActions']);
                }
                if (tool.name === 'sendEmailTool') {
                    queryClient.invalidateQueries(['sentEmails']);
                }
            });
        }

    } catch (error) {
      console.error('Error getting Copilot response:', error);
      toast.error(error.message || "Failed to get response from Copilot.");
      const errorMessage = { role: 'assistant', content: "I apologize, but I'm having trouble responding right now. Please try again." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleTypingComplete = (index) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages[index]) {
        newMessages[index].isTyping = false;
      }
      return newMessages;
    });
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/3ac877de1_PULSEaiicon.png"
          alt="PULSE AI"
          className="w-12 h-12 animate-spin-slow object-contain"
          style={{ animationDuration: '3s' }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 flex-1 overflow-hidden flex flex-col h-full">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
        <div className="flex-1 overflow-y-auto mb-6 pr-2 -mr-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/3ac877de1_PULSEaiicon.png"
                    alt="My Advisor"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <h2 className="text-xl font-semibold text-[#1E293B] mb-2">My Advisor</h2>
                <p className="text-sm text-[#475569]">Your AI Business Advisor</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${message.role === 'user' ? 'bg-[#7C3AED] text-white' : 'bg-white border border-[#E2E8F0] text-[#1E293B]'} rounded-lg p-4`}>
                    {message.isTyping ? (
                      <TypingBubble text={message.content} onTypingComplete={() => handleTypingComplete(index)} />
                    ) : (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none">
                         <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        {message.toolCalls.map((tool, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                            <GradientSparklesIcon className="w-3 h-3" />
                            <span className="font-medium">{tool.name.replace('Tool', ' ').replace(/([A-Z])/g, ' $1').trim()}</span>
                            {tool.status === 'success' && <span className="text-green-600">✓</span>}
                            {tool.status === 'failed' && <span className="text-red-600">✗</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <AITypingIndicator agentName="My Advisor" />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="pt-2">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask your advisor anything..."
              className="flex-1 px-4 py-3 border border-[#E2E8F0] rounded-lg bg-white focus:ring-0 focus:outline-none focus:border-[#7C3AED] text-base text-[#1E293B] placeholder:text-[#94A3B8]"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !inputMessage.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
