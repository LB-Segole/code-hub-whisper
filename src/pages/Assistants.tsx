import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAssistants } from '@/hooks/useAssistants';
import AssistantForm from '@/components/Assistants/AssistantForm';
import AssistantCard from '@/components/Assistants/AssistantCard';
import CallInterface from '@/components/Assistants/CallInterface';
import { Assistant, AssistantFormData } from '@/types/assistant';
import { FloatingVoiceAssistant } from '@/components/Assistants/FloatingVoiceAssistant';
import { OutboundCallInterface } from '@/components/Assistants/OutboundCallInterface';

const Assistants = () => {
  const { assistants, isLoading, createAssistant, updateAssistant, deleteAssistant } = useAssistants();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [showOutboundCall, setShowOutboundCall] = useState(false);

  // Form state with DeepGram defaults
  const [formData, setFormData] = useState<AssistantFormData>({
    name: '',
    system_prompt: '',
    first_message: '',
    voice_provider: 'deepgram',
    voice_id: 'aura-asteria-en',
    model: 'nova-2',
    temperature: 0.8,
    max_tokens: 500
  });

  const handleCreateAssistant = async () => {
    setIsSubmitting(true);
    const success = await createAssistant(formData);
    if (success) {
      setShowCreateForm(false);
      resetForm();
    }
    setIsSubmitting(false);
  };

  const handleUpdateAssistant = async () => {
    if (!editingAssistant) return;

    setIsSubmitting(true);
    const success = await updateAssistant(editingAssistant, formData);
    if (success) {
      setEditingAssistant(null);
      setShowCreateForm(false);
      resetForm();
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      system_prompt: '',
      first_message: '',
      voice_provider: 'deepgram',
      voice_id: 'aura-asteria-en',
      model: 'nova-2',
      temperature: 0.8,
      max_tokens: 500
    });
  };

  const startEdit = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setFormData({
      name: assistant.name,
      system_prompt: assistant.system_prompt,
      first_message: assistant.first_message || '',
      voice_provider: assistant.voice_provider || 'deepgram',
      voice_id: assistant.voice_id || 'aura-asteria-en',
      model: assistant.model || 'nova-2',
      temperature: assistant.temperature || 0.8,
      max_tokens: assistant.max_tokens || 500
    });
    setShowCreateForm(true);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingAssistant(null);
    resetForm();
  };

  const handleSubmit = async () => {
    if (editingAssistant) {
      await handleUpdateAssistant();
    } else {
      await handleCreateAssistant();
    }
  };

  const handleDelete = async (assistantId: string) => {
    const success = await deleteAssistant(assistantId);
    if (success) {
      console.log('Assistant deleted successfully');
    }
  };

  const handleStartVoiceChat = (assistant: Assistant) => {
    console.log('🚀 Starting voice chat for assistant:', assistant.name);
    setSelectedAssistant(assistant);
    setShowVoiceChat(true);
  };

  const handleCloseVoiceChat = () => {
    console.log('🛑 Closing voice chat');
    setShowVoiceChat(false);
    setSelectedAssistant(null);
  };

  const handleMakeCall = (assistant: Assistant) => {
    console.log('📞 Making call with assistant:', assistant.name);
    setSelectedAssistant(assistant);
    setShowOutboundCall(true);
  };

  const handleCloseOutboundCall = () => {
    setShowOutboundCall(false);
    setSelectedAssistant(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading AI agents...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Voice AI Agents</h1>
            <p className="text-gray-600 mt-2">Create and manage your AI voice assistants</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create AI Agent
          </Button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <AssistantForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            editingAssistant={editingAssistant}
          />
        )}

        {/* Call Interface */}
        {assistants.length > 0 && !showCreateForm && (
          <CallInterface assistants={assistants} />
        )}

        {/* AI Assistants Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistants.map((assistant) => (
            <AssistantCard
              key={assistant.id}
              assistant={assistant}
              onEdit={startEdit}
              onDelete={handleDelete}
              onStartVoiceChat={handleStartVoiceChat}
              onMakeCall={handleMakeCall}
            />
          ))}
        </div>

        {assistants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No AI agents created yet</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First AI Agent
            </Button>
          </div>
        )}
      </div>

      {/* Floating Voice Assistant */}
      {showVoiceChat && selectedAssistant && (
        <FloatingVoiceAssistant
          assistant={selectedAssistant}
          onClose={handleCloseVoiceChat}
        />
      )}

      {/* Outbound Call Interface */}
      {showOutboundCall && selectedAssistant && (
        <OutboundCallInterface
          assistant={selectedAssistant}
          onClose={handleCloseOutboundCall}
        />
      )}
    </>
  );
};

export default Assistants;
