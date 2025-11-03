
import React, { useState, useEffect, useRef } from 'react';
import { RolePlayScenario, ClientPersona } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Upload, Loader2, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { UploadFile } from '@/api/integrations';
import BulkImportModal from '../admin/BulkImportModal';

const SCENARIO_CSV_SAMPLE = `name,description,category,difficulty_level,initial_context,client_persona,passing_threshold
"Price Negotiation","Practice handling price objections","price_objections","beginner","Client wants 10% discount","skeptical_buyer",70
"Timeline Pressure","Handle urgent timeline requests","urgency_objections","intermediate","Client needs to close in 2 weeks","impatient_buyer",75`;

const SCENARIO_COLUMN_MAPPING = {
  name: 'name',
  description: 'description',
  category: 'category',
  difficulty_level: 'difficulty_level',
  initial_context: 'initial_context',
  client_persona: 'client_persona',
  passing_threshold: 'passing_threshold'
};

export default function ScenarioManager() {
  const [scenarios, setScenarios] = useState([]);
  const [clientPersonas, setClientPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingScenario, setEditingScenario] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    category: 'price_objections',
    difficultyLevel: 'beginner',
    name: '',
    description: '',
    initialContext: '',
    clientPersona: '',
    elevenLabsAgentId: '',
    elevenLabsPhoneNumberId: '',
    elevenLabsVoiceId: '',
    firstMessageOverride: '',
    avatarImageUrl: '',
    passingThreshold: 70,
    learningObjectives: [],
    averageDurationMinutes: 10,
    successCriteria: [],
    isActive: true,
    isPopular: false,
    isPremium: false
  });

  useEffect(() => {
    loadScenarios();
    loadClientPersonas();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const data = await RolePlayScenario.filter({}, '-created_date');
      setScenarios(data || []);
    } catch (error) {
      console.error('Error loading scenarios:', error);
      toast.error('Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const loadClientPersonas = async () => {
    try {
      const personas = await ClientPersona.filter({ isActive: true });
      setClientPersonas(personas || []);
    } catch (error) {
      console.error('Error loading client personas:', error);
      // Not showing toast for personas load error as it shouldn't block scenario display
    }
  };

  const handleEdit = (scenario) => {
    setEditingScenario(scenario);
    setFormData({
      category: scenario.category || 'price_objections',
      difficultyLevel: scenario.difficultyLevel || 'beginner',
      name: scenario.name || '',
      description: scenario.description || '',
      initialContext: scenario.initialContext || '',
      clientPersona: scenario.clientPersona || '',
      elevenLabsAgentId: scenario.elevenLabsAgentId || '',
      elevenLabsPhoneNumberId: scenario.elevenLabsPhoneNumberId || '',
      elevenLabsVoiceId: scenario.elevenLabsVoiceId || '',
      firstMessageOverride: scenario.firstMessageOverride || '',
      avatarImageUrl: scenario.avatarImageUrl || '',
      passingThreshold: scenario.passingThreshold || 70,
      learningObjectives: scenario.learningObjectives || [],
      averageDurationMinutes: scenario.averageDurationMinutes || 10,
      successCriteria: scenario.successCriteria || [],
      isActive: scenario.isActive !== undefined ? scenario.isActive : true,
      isPopular: scenario.isPopular || false,
      isPremium: scenario.isPremium || false
    });
    setShowDialog(true);
  };

  const handleDelete = async (scenarioId) => {
    if (!window.confirm('Are you sure you want to delete this scenario?')) return;

    try {
      await RolePlayScenario.delete(scenarioId);
      toast.success('Scenario deleted successfully');
      loadScenarios(); // Reload only scenarios
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast.error('Failed to delete scenario');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    toast.info('Uploading avatar image...');

    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, avatarImageUrl: file_url }));
      toast.success('Avatar image uploaded successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.initialContext || !formData.clientPersona) {
      toast.error('Please fill in all required fields (Name, Description, Initial Context, Client Persona)');
      return;
    }

    try {
      if (editingScenario) {
        await RolePlayScenario.update(editingScenario.id, formData);
        toast.success('Scenario updated successfully');
      } else {
        await RolePlayScenario.create(formData);
        toast.success('Scenario created successfully');
      }
      setShowDialog(false);
      setEditingScenario(null);
      resetForm();
      loadScenarios(); // Reload only scenarios
    } catch (error) {
      console.error('Error saving scenario:', error);
      toast.error('Failed to save scenario');
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'price_objections',
      difficultyLevel: 'beginner',
      name: '',
      description: '',
      initialContext: '',
      clientPersona: '',
      elevenLabsAgentId: '',
      elevenLabsPhoneNumberId: '',
      elevenLabsVoiceId: '',
      firstMessageOverride: '',
      avatarImageUrl: '',
      passingThreshold: 70,
      learningObjectives: [],
      averageDurationMinutes: 10,
      successCriteria: [],
      isActive: true,
      isPopular: false,
      isPremium: false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Role-Play Scenarios</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            size="sm"
          >
            <FileUp className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button
            onClick={() => {
              setEditingScenario(null);
              resetForm();
              setShowDialog(true);
            }}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Scenario
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                {scenario.avatarImageUrl && (
                  <img
                    src={scenario.avatarImageUrl}
                    alt={scenario.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <h4 className="font-semibold">{scenario.name}</h4>
                  <p className="text-sm text-slate-600">{scenario.description}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-1 bg-slate-100 rounded">
                      {scenario.category}
                    </span>
                    <span className="text-xs px-2 py-1 bg-slate-100 rounded">
                      {scenario.difficultyLevel}
                    </span>
                    {scenario.isPopular && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                        Popular
                      </span>
                    )}
                    {scenario.isPremium && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        Premium
                      </span>
                    )}
                    {scenario.clientPersona && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        Persona: {clientPersonas.find(p => p.personaKey === scenario.clientPersona)?.personaName || scenario.clientPersona}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(scenario)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(scenario.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingScenario ? 'Edit Role-Play Scenario' : 'Create New Role-Play Scenario'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Avatar Image Upload */}
              <div className="space-y-2">
                <Label>Avatar Image</Label>
                <div className="flex items-center gap-4">
                  {formData.avatarImageUrl && (
                    <img
                      src={formData.avatarImageUrl}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUploadClick}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Avatar
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-slate-500 mt-1">
                      Recommended: Square image, at least 200x200px
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price_objections">Price Objections</SelectItem>
                      <SelectItem value="timing_concerns">Timing Concerns</SelectItem>
                      <SelectItem value="agent_selection">Agent Selection</SelectItem>
                      <SelectItem value="market_conditions">Market Conditions</SelectItem>
                      <SelectItem value="process_complexity">Process Complexity</SelectItem>
                      <SelectItem value="commission_questions">Commission Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level *</Label>
                  <Select
                    value={formData.difficultyLevel}
                    onValueChange={(value) =>
                      setFormData({ ...formData, difficultyLevel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Price Too High"
                />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the scenario..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Initial Context *</Label>
                <Textarea
                  value={formData.initialContext}
                  onChange={(e) =>
                    setFormData({ ...formData, initialContext: e.target.value })
                  }
                  placeholder="The setup/context that the AI client will use..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Client Persona *</Label>
                <Select
                  value={formData.clientPersona}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clientPersona: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select persona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientPersonas.map((persona) => (
                      <SelectItem key={persona.id} value={persona.personaKey}>
                        {persona.personaName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ElevenLabs Voice ID</Label>
                <Input
                  value={formData.elevenLabsVoiceId}
                  onChange={(e) =>
                    setFormData({ ...formData, elevenLabsVoiceId: e.target.value })
                  }
                  placeholder="Voice ID to override default voice"
                />
                <p className="text-xs text-slate-500">
                  Optional: Leave blank to use the default voice for the agent
                </p>
              </div>

              <div className="space-y-2">
                <Label>First Message Override</Label>
                <Textarea
                  value={formData.firstMessageOverride}
                  onChange={(e) =>
                    setFormData({ ...formData, firstMessageOverride: e.target.value })
                  }
                  placeholder="e.g., 'Hello! I'm calling about the property listing...'"
                  rows={3}
                />
                <p className="text-xs text-slate-500">
                  Optional: Custom message the AI will say when the call is answered
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ElevenLabs Agent ID</Label>
                  <Input
                    value={formData.elevenLabsAgentId}
                    onChange={(e) =>
                      setFormData({ ...formData, elevenLabsAgentId: e.target.value })
                    }
                    placeholder="Agent ID from ElevenLabs"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ElevenLabs Phone Number ID</Label>
                  <Input
                    value={formData.elevenLabsPhoneNumberId}
                    onChange={(e) =>
                      setFormData({ ...formData, elevenLabsPhoneNumberId: e.target.value })
                    }
                    placeholder="Phone Number ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Passing Threshold (%)</Label>
                  <Input
                    type="number"
                    value={formData.passingThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, passingThreshold: parseInt(e.target.value) || 70 })
                    }
                    min="0"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Average Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.averageDurationMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, averageDurationMinutes: parseInt(e.target.value) || 10 })
                    }
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isPopular}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPopular: checked })
                    }
                  />
                  <Label>Popular</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isPremium}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPremium: checked })
                    }
                  />
                  <Label>Premium</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingScenario ? 'Update' : 'Create'} Scenario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>

      <BulkImportModal
        isOpen={showImportModal}
        onClose={(shouldRefresh) => {
          setShowImportModal(false);
          if (shouldRefresh) loadScenarios();
        }}
        entityType="role_play_scenarios"
        entityLabel="Role-Play Scenarios"
        sampleCsvData={SCENARIO_CSV_SAMPLE}
        columnMapping={SCENARIO_COLUMN_MAPPING}
      />
    </Card>
  );
}
