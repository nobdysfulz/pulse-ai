
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { UserKnowledge } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function KnowledgePanel() {
  const { user } = useContext(UserContext);
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadKnowledge();
    }
  }, [user]);

  const loadKnowledge = async () => {
    setLoading(true);
    try {
      const items = await UserKnowledge.filter({ userId: user.id }, '-created_date');
      setKnowledge(items || []);
    } catch (error) {
      console.error('Error loading knowledge:', error);
      toast.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.warning('Please provide both title and content');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await UserKnowledge.update(editingItem.id, formData);
        toast.success('Knowledge updated');
      } else {
        await UserKnowledge.create({
          userId: user.id,
          ...formData
        });
        toast.success('Knowledge added');
      }
      setFormData({ title: '', content: '' });
      setShowForm(false);
      setEditingItem(null);
      await loadKnowledge();
    } catch (error) {
      console.error('Error saving knowledge:', error);
      toast.error('Failed to save knowledge');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ title: item.title, content: item.content });
    setShowForm(true);
  };

  const handleDelete = async (itemId) => {
    try {
      await UserKnowledge.delete(itemId);
      toast.success('Knowledge deleted');
      await loadKnowledge();
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      toast.error('Failed to delete knowledge');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ title: '', content: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#1E293B]">
            {editingItem ? 'Edit Knowledge' : 'Add Knowledge'}
          </h3>
          <button onClick={handleCancel} className="text-[#64748B] hover:text-[#1E293B]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1E293B] mb-2">Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., My business hours"
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1E293B] mb-2">Content</label>
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Add information for your AI to reference..."
            rows={8}
            className="text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {editingItem ? 'Update' : 'Save'}
          </Button>
          <Button onClick={handleCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1E293B] mb-1">Knowledge Base</h3>
          <p className="text-xs text-[#64748B]">
            Information your AI can reference
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {knowledge.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-[#64748B]">No knowledge entries yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {knowledge.map((item) => (
            <div key={item.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm text-[#1E293B]">{item.title}</h4>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-[#64748B] hover:text-[#7C3AED]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-[#64748B] hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Knowledge?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this knowledge entry. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <p className="text-xs text-[#475569] line-clamp-2">{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
