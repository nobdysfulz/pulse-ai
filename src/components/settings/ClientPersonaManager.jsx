import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Edit, Trash2, Save, X, User } from 'lucide-react';
import { toast } from 'sonner';
import { ClientPersona } from '@/api/entities';

export default function ClientPersonaManager() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    personaKey: '',
    personaName: '',
    description: '',
    personality: '',
    speakingStyle: '',
    typicalObjections: [],
    isActive: true
  });

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    setLoading(true);
    try {
      const data = await ClientPersona.list('-created_date');
      setPersonas(data || []);
    } catch (error) {
      console.error('Error loading personas:', error);
      toast.error('Failed to load personas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.personaKey || !formData.personaName) {
      toast.error('Persona key and name are required');
      return;
    }

    try {
      if (editing?.id) {
        await ClientPersona.update(editing.id, formData);
        toast.success('Persona updated');
      } else {
        await ClientPersona.create(formData);
        toast.success('Persona created');
      }
      await loadPersonas();
      setEditing(null);
      setFormData({
        personaKey: '',
        personaName: '',
        description: '',
        personality: '',
        speakingStyle: '',
        typicalObjections: [],
        isActive: true
      });
    } catch (error) {
      console.error('Error saving persona:', error);
      toast.error('Failed to save persona');
    }
  };

  const handleEdit = (persona) => {
    setEditing(persona);
    setFormData(persona);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;

    try {
      await ClientPersona.delete(id);
      toast.success('Persona deleted');
      await loadPersonas();
    } catch (error) {
      console.error('Error deleting persona:', error);
      toast.error('Failed to delete persona');
    }
  };

  const handleObjectionsChange = (value) => {
    const objections = value.split('\n').filter(o => o.trim());
    setFormData({ ...formData, typicalObjections: objections });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <Card className="bg-white border border-[#E2E8F0]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#1E293B]">Client Personas</h3>
            <p className="text-sm text-[#475569] mt-1">Manage AI client personalities for role-play</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing({})}>
              <Plus className="w-4 h-4 mr-2" />
              Add Persona
            </Button>
          )}
        </div>

        {editing && (
          <div className="mb-6 p-6 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Persona Key</Label>
                  <Input
                    value={formData.personaKey}
                    onChange={(e) => setFormData({ ...formData, personaKey: e.target.value })}
                    placeholder="e.g., skeptical_buyer"
                    disabled={!!editing?.id}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Persona Name</Label>
                  <Input
                    value={formData.personaName}
                    onChange={(e) => setFormData({ ...formData, personaName: e.target.value })}
                    placeholder="e.g., Skeptical Buyer"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this persona"
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Personality Traits</Label>
                <Textarea
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  placeholder="Detailed personality traits"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Speaking Style</Label>
                <Textarea
                  value={formData.speakingStyle}
                  onChange={(e) => setFormData({ ...formData, speakingStyle: e.target.value })}
                  placeholder="How this persona communicates"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Typical Objections (one per line)</Label>
                <Textarea
                  value={(formData.typicalObjections || []).join('\n')}
                  onChange={(e) => handleObjectionsChange(e.target.value)}
                  placeholder="Enter common objections, one per line"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setFormData({
                      personaKey: '',
                      personaName: '',
                      description: '',
                      personality: '',
                      speakingStyle: '',
                      typicalObjections: [],
                      isActive: true
                    });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Persona
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personas.map((persona) => (
            <div key={persona.id} className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center">
                    <User className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[#1E293B]">{persona.personaName}</h4>
                      {persona.isActive ? (
                        <span className="px-2 py-0.5 bg-[#22C55E] text-white text-xs rounded-full">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#94A3B8] text-white text-xs rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-1">{persona.personaKey}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#475569] mb-3">{persona.description}</p>
              {persona.typicalObjections && persona.typicalObjections.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-[#64748B] mb-1">Typical Objections:</p>
                  <p className="text-xs text-[#475569]">{persona.typicalObjections.length} objections configured</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(persona)} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(persona.id)}>
                  <Trash2 className="w-4 h-4 text-[#EF4444]" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {personas.length === 0 && !editing && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-base text-[#475569]">No personas configured</p>
            <p className="text-sm text-[#64748B] mt-1">Add your first client persona</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}