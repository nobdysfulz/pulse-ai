import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/UserContext';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AiAgentConversation } from '@/api/entities';
import ReactMarkdown from 'react-markdown';
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

const agentAvatars = {
  executive_assistant: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/9ed7e57e3_ExecutiveAssistant.png',
  content_agent: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/4cce42e70_ContentAgent.png',
  transaction_coordinator: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/1b1eebc95_TransactionCoordinator.png'
};

const agentGreetings = {
  executive_assistant: "Hey! I'm NOVA, your Executive Assistant. Think of me as your right hand - I'll help you manage your calendar, handle emails, schedule meetings, research anything you need, and keep your business running smoothly. What can I tackle for you today?",
  content_agent: "Hi there! I'm SIRIUS, your Content Agent and creative partner. I create killer social media posts, generate eye-catching images, write video scripts, analyze your engagement, and help you build a content strategy that actually gets results. Ready to create something amazing?",
  transaction_coordinator: "Hello! I'm VEGA, your Transaction Coordinator. I keep every deal on track from contract to close - managing deadlines, coordinating with all parties, organizing documents, and making sure nothing slips through the cracks. Let's make sure your transactions run smoothly. What deal are we working on?"
};

const agentNames = {
  executive_assistant: "NOVA",
  content_agent: "SIRIUS",
  transaction_coordinator: "VEGA"
};

export default function AgentChatInterface({ agentType }) {
  const { user } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const messagesEndRef = useRef(null);

  const agentName = agentNames[agentType];
  const agentAvatar = agentAvatars[agentType];
  const userAvatar = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing conversation on mount
  useEffect(() => {
    loadConversation();
  }, [agentType, user]);

  const loadConversation = async () => {
    if (!user) return;
    
    setLoadingConversation(true);
    try {
      // Find today's active conversation for this agent
      const conversations = await AiAgentConversation.filter({
        userId: user.id,
        agentType: agentType,
        status: 'active'
      }, '-created_date', 1);

      if (conversations.length > 0) {
        const conversation = conversations[0];
        // Check if conversation is from today
        const conversationDate = new Date(conversation.created_date);
        const today = new Date();
        const isToday = conversationDate.toDateString() === today.toDateString();

        if (isToday && conversation.conversationHistory) {
          const history = JSON.parse(conversation.conversationHistory);
          // Filter out any system messages that might have been saved
          const displayMessages = history.filter(msg => msg.role !== 'system');
          setMessages(displayMessages);
          setConversationId(conversation.id);
        } else {
          // Start fresh with greeting
          setMessages([{ 
            role: 'assistant', 
            content: agentGreetings[agentType]
          }]);
        }
      } else {
        // No conversation found, start with greeting
        setMessages([{ 
          role: 'assistant', 
          content: agentGreetings[agentType]
        }]);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setMessages([{ 
        role: 'assistant', 
        content: agentGreetings[agentType]
      }]);
    } finally {
      setLoadingConversation(false);
    }
  };

  const saveConversation = async (updatedMessages) => {
    if (!user) return;

    try {
      // Filter out system messages before saving
      const messagesToSave = updatedMessages.filter(msg => msg.role !== 'system');
      
      const conversationData = {
        userId: user.id,
        agentType: agentType,
        conversationHistory: JSON.stringify(messagesToSave),
        status: 'active'
      };

      if (conversationId) {
        await AiAgentConversation.update(conversationId, conversationData);
      } else {
        const newConversation = await AiAgentConversation.create(conversationData);
        setConversationId(newConversation.id);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    const messageText = inputMessage.trim();
    if (!messageText) return;

    const userMessage = { role: 'user', content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setLoading(true);

    try {
      const functionName = `${agentType}Chat`;
      // Only send user/assistant messages to backend, not system messages
      const conversationHistory = messages.filter(m => m.role !== 'system');
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          message: messageText,
          conversationId: conversationId,
          conversationHistory: conversationHistory
        }
      });

      if (error) {
        throw new Error(error.message || "The agent failed to respond.");
      }

      const assistantMessage = { 
        role: 'assistant', 
        content: data.response, 
        isTyping: true
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save conversation after getting response
      await saveConversation(finalMessages);

    } catch (error) {
      console.error('Error getting agent response:', error);
      toast.error(error.message || "Failed to get response from agent.");
      const errorMessage = { 
        role: 'assistant', 
        content: "I apologize, but I'm having trouble responding right now. Please try again." 
      };
      setMessages([...updatedMessages, errorMessage]);
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

  if (loadingConversation) {
    return (
      <div className="h-full flex items-center justify-center bg-white border border-[#E2E8F0] rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border border-[#E2E8F0] rounded-lg">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.filter(msg => msg.role !== 'system').map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <img 
                  src={agentAvatar} 
                  alt={agentName}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
              )}
              <div className={`max-w-[85%] ${message.role === 'user' ? 'bg-[#7C3AED] text-white' : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B]'} rounded-lg p-4`}>
                {message.isTyping ? (
                  <TypingBubble text={message.content} onTypingComplete={() => handleTypingComplete(index)} />
                ) : (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <img 
                  src={userAvatar} 
                  alt="You"
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
              )}
            </div>
          ))}
          {loading && (
            <AITypingIndicator agentName={agentName} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-[#E2E8F0] p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Message ${agentName}...`}
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