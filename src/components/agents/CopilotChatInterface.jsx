import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/UserContext';
import { Button } from '@/components/ui/button';
import { Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { useQueryClient } from '@tanstack/react-query';
import AITypingIndicator from '../ui/AITypingIndicator';

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

export default function CopilotChatInterface({
  currentTab,
  onClose,
  conversationId: externalConversationId,
  onConversationCreated
}) {
  const { user, marketConfig, goals, actions } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [internalConversationId, setInternalConversationId] = useState(externalConversationId || null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let greeting = "Hi! I'm your PULSE Copilot. I can help you with emails, scheduling, research, documents, and business insights.";

    switch (currentTab) {
      case 'lead_concierge':
        greeting = "Hi! I'm here to help with your leads. I can analyze call performance, qualify leads, schedule follow-ups, and manage your pipeline.";
        break;
      case 'content_agent':
        greeting = "Hi! I'm here to help with content creation. I can write social posts, create emails, generate market updates, and analyze engagement.";
        break;
      case 'transaction_coordinator':
        greeting = "Hi! I'm here to help manage your transactions. I can track milestones, coordinate with stakeholders, and automate your workflow.";
        break;
      case 'dashboard':
        greeting = "Hi! I'm your PULSE Copilot. I can analyze your performance, suggest priorities, and help automate your tasks.";
        break;
    }

    setMessages([{ role: 'assistant', content: greeting, isGreeting: true }]);
  }, [currentTab]);

  useEffect(() => {
    if (externalConversationId && externalConversationId !== internalConversationId) {
      setInternalConversationId(externalConversationId);
    }
  }, [externalConversationId, internalConversationId]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    const messageText = inputMessage.trim();
    if (!messageText) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const agentContext = {
        marketConfig: marketConfig,
        goals: goals,
        actions: actions,
        performanceAnalysis: {
          overallPulseScore: 75
        }
      };

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('copilotChat', {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          userPrompt: messageText,
          conversationId: internalConversationId,
          agentContext: agentContext,
          conversationHistory: messages.filter(m => !m.isGreeting),
          currentTab: currentTab
        }
      });

      if (error) {
        throw new Error(error.message || "The Copilot failed to respond.");
      }

      if (data.conversationId && data.conversationId !== internalConversationId) {
        setInternalConversationId(data.conversationId);
        if (onConversationCreated) {
          onConversationCreated(data.conversationId);
        }
      }

      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        isTyping: true,
        toolCalls: data.toolCalls || []
      };
      setMessages((prev) => [...prev, assistantMessage]);

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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
                <img
                  src="/images/icons/pulse-ai-icon.png"
                  alt="PULSE Copilot"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold text-[#1E293B] mb-2">PULSE Copilot</h3>
              <p className="text-sm text-[#64748B]">Your AI executive assistant</p>
            </div>
          )}

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
                        <span className="font-medium">{tool.name.replace('Tool', '').replace(/([A-Z])/g, ' $1').trim()}</span>
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
            <AITypingIndicator agentName="PULSE Copilot" />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded-lg bg-white focus:ring-0 focus:outline-none focus:border-[#7C3AED] text-sm text-[#1E293B] placeholder:text-[#94A3B8]"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !inputMessage.trim()} size="icon">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}