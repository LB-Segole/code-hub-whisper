
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AssistantForm from '@/components/Assistants/AssistantForm';
import AssistantCard from '@/components/Assistants/AssistantCard';
import CallInterface from '@/components/Assistants/CallInterface';
import { useAssistants } from '@/hooks/useAssistants';
import { Assistant, AssistantFormData } from '@/hooks/useAssistants';
import { toast } from 'sonner';

const Assistants = () => {
  const navigate = useNavigate();
  const { assistants, isLoading, createAssistant, updateAssistant, deleteAssistant } = useAssistants();
  const [showForm, setShowForm] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [callingAssistant, setCallingAssistant] = useState<Assistant | null>(null);
  const [formData, setFormData] = useState<AssistantFormData>({
    name: '',
    system_prompt: '',
    first_message: '',
    voice_provider: 'deepgram',
    voice_id: 'aura-asteria-en',
    model: 'nova-2',
    temperature: 0.8,
    max_tokens: 500,
  });

  const handleSubmit = async () => {
    try {
      if (editingAssistant) {
        await updateAssistant(editingAssistant.id, formData);
        toast.success('Assistant updated successfully!');
      } else {
        await createAssistant(formData);
        toast.success('Assistant created successfully!');
      }
      setShowForm(false);
      setEditingAssistant(null);
      // Reset form
      setFormData({
        name: '',
        system_prompt: '',
        first_message: '',
        voice_provider: 'deepgram',
        voice_id: 'aura-asteria-en',
        model: 'nova-2',
        temperature: 0.8,
        max_tokens: 500,
      });
    } catch (error) {
      toast.error(editingAssistant ? 'Failed to update assistant' : 'Failed to create assistant');
    }
  };

  const handleEdit = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setFormData({
      name: assistant.name,
      system_prompt: assistant.system_prompt,
      first_message: assistant.first_message || '',
      voice_provider: assistant.voice_provider,
      voice_id: assistant.voice_id,
      model: assistant.model,
      temperature: assistant.temperature,
      max_tokens: assistant.max_tokens,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this assistant?')) {
      try {
        await deleteAssistant(id);
        toast.success('Assistant deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete assistant');
      }
    }
  };

  const handleStartVoiceChat = (assistant: Assistant) => {
    console.log('Starting voice chat with:', assistant.name);
    // TODO: Implement voice chat functionality
  };

  const handleMakeCall = (assistant: Assistant) => {
    setCallingAssistant(assistant);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAssistant(null);
    setFormData({
      name: '',
      system_prompt: '',
      first_message: '',
      voice_provider: 'deepgram',
      voice_id: 'aura-asteria-en',
      model: 'nova-2',
      temperature: 0.8,
      max_tokens: 500,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading assistants...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">AI Voice Assistants</h1>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Assistant
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Create/Edit Form */}
        {showForm && (
          <div className="mb-8">
            <AssistantForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={false}
              editingAssistant={editingAssistant}
            />
          </div>
        )}

        {/* Assistants Grid */}
        {!showForm && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assistants.map((assistant) => (
              <AssistantCard
                key={assistant.id}
                assistant={assistant}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStartVoiceChat={handleStartVoiceChat}
                onMakeCall={handleMakeCall}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!showForm && assistants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No assistants created yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Assistant
            </Button>
          </div>
        )}
      </div>

      {/* Call Interface */}
      {callingAssistant && (
        <CallInterface
          assistants={[callingAssistant]}
          onClose={() => setCallingAssistant(null)}
        />
      )}
    </div>
  );
};

export default Assistants;
