import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function SupportChatWidget() {
  const { isSupportChatOpen, setSupportChatOpen } = useContext(UserContext);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('sendEmail', {
        body: {
          to: 'support@pulseai.com',
          subject: 'Support Request from Widget',
          body: message
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to call support function');
      }

      if (data?.error || data?.details) {
        const details =
          (typeof data.error === 'string' && data.error) ||
          (typeof data.details === 'string' && data.details) ||
          'Failed to send support request';
        throw new Error(details);
      }

      if (!data?.success) {
        throw new Error('Support function did not complete successfully');
      }

      toast.success('Support request sent successfully!');
      setMessage('');
      setSupportChatOpen(false);
    } catch (error) {
      console.error('Error sending support request:', error);
      toast.error(error?.message || 'Failed to send support request');
    } finally {
      setSending(false);
    }
  };

  if (!isSupportChatOpen) {
    return (
      <button
        onClick={() => setSupportChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl border border-[#E2E8F0] z-50 flex flex-col max-h-[600px]">
      <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
        <h3 className="font-semibold text-[#1E293B]">Support Chat</h3>
        <button
          onClick={() => setSupportChatOpen(false)}
          className="text-[#64748B] hover:text-[#1E293B]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-[#F8FAFC] rounded-lg p-4">
          <p className="text-sm text-[#475569]">
            Hi! How can we help you today? Send us a message and our team will get back to you shortly.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-[#E2E8F0]">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="mb-2"
          rows={3}
        />
        <Button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="w-full"
        >
          {sending ? 'Sending...' : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </div>
  );
}