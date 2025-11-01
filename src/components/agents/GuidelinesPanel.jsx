import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { UserGuidelines } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function GuidelinesPanel({ agentType }) {
  const { user } = useContext(UserContext);
  const [guidelines, setGuidelines] = useState([]);
  const [newGuideline, setNewGuideline] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      loadGuidelines();
    }
  }, [agentType, user]);

  const loadGuidelines = async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const allGuidelines = await UserGuidelines.list();
      const userGuidelines = allGuidelines.filter(g => 
        g.userId === user.id && g.agentType === agentType
      );
      
      setGuidelines(userGuidelines || []);
    } catch (error) {
      console.error('Error loading guidelines:', error);
      toast.error('Failed to load guidelines');
    } finally {
      setLoading(false);
    }
  };

  const addGuideline = async () => {
    if (!newGuideline.trim()) {
      toast.warning('Please enter a guideline');
      return;
    }

    if (!user || !user.id) {
      toast.error('User information not available');
      return;
    }

    setAdding(true);
    try {
      // Import and apply validation
      const { validateOrThrow, guidelineSchema } = await import('@/lib/validation');
      
      const validatedData = validateOrThrow(guidelineSchema, {
        user_id: user.id,
        agent_type: agentType,
        guideline_category: 'custom_instructions',
        guideline_text: newGuideline.trim(),
        guideline_type: 'custom'
      });

      const newGuidelineRecord = await UserGuidelines.create({
        userId: validatedData.user_id,
        agentType: validatedData.agent_type,
        guidelineCategory: validatedData.guideline_category,
        guidelineText: validatedData.guideline_text,
        guidelineType: validatedData.guideline_type
      });
      
      setGuidelines(prev => [...prev, newGuidelineRecord]);
      setNewGuideline(''); // Clear input after successful add
      toast.success('Guideline added');
    } catch (error) {
      console.error('Error adding guideline:', error);
      toast.error(error.message || 'Failed to add guideline');
    } finally {
      setAdding(false);
    }
  };

  const deleteGuideline = async (guidelineId) => {
    try {
      await UserGuidelines.delete(guidelineId);
      setGuidelines(prev => prev.filter(g => g.id !== guidelineId));
      toast.success('Guideline removed');
    } catch (error) {
      console.error('Error deleting guideline:', error);
      toast.error('Failed to delete guideline');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#1E293B] mb-1">Custom Guidelines</h3>
        <p className="text-xs text-[#64748B] mb-4">
          Teach your agent how you prefer to work
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {guidelines.length > 0 ? (
              guidelines.map((guideline) => (
                <div key={guideline.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[#1E293B] flex-1">{guideline.guidelineText}</p>
                    <button
                      onClick={() => deleteGuideline(guideline.id)}
                      className="text-[#94A3B8] hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#94A3B8] text-center py-4">
                No custom guidelines yet. Add some to personalize your agent.
              </p>
            )}
          </div>
        )}

        <Textarea
          value={newGuideline}
          onChange={(e) => setNewGuideline(e.target.value)}
          placeholder="e.g., 'Always include emojis in social posts' or 'Send appointment confirmations 24 hours in advance'"
          className="mb-2 text-sm"
          rows={3}
        />
        <Button
          onClick={addGuideline}
          disabled={adding || !newGuideline.trim()}
          size="sm"
          className="w-full"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Add Guideline
        </Button>
      </div>
    </div>
  );
}