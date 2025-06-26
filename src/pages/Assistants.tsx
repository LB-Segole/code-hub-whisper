
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AssistantForm } from '@/components/Assistants/AssistantForm';
import { AssistantCard } from '@/components/Assistants/AssistantCard';
import { CallInterface } from '@/components/Assistants/CallInterface';
import { useAssistants } from '@/hooks/useAssistants';
import { Assistant } from '@/types/assistant';
import { toast } from 'sonner';

const Assistants = () => {
  const navigate = useNavigate();
  const { assistants, isLoading, createAssistant, updateAssistant, deleteAssistant } = useAssistants();
  const [showForm, setShowForm] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | undefined>(undefined);
  const [callingAssistant, setCallingAssistant] = useState<Assistant | null>(null);

  const handleCreateAssistant = async (assistantData: Partial<Assistant>) => {
    try {
      const newAssistant = await createAssistant(assistantData);
      if (newAssistant) {
        setShowForm(false);
        toast.success('Assistant created successfully!');
      }
    } catch (error) {
      toast.error('Failed to create assistant');
    }
  };

  const handleUpdateAssistant = async (assistantData: Partial<Assistant>) => {
    if (!editingAssistant) return;
    
    try {
      await updateAssistant(editingAssistant.id, assistantData);
      setEditingAssistant(undefined);
      setShowForm(false);
      toast.success('Assistant updated successfully!');
    } catch (error) {
      toast.error('Failed to update assistant');
    }
  };

  const handleEdit = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setShowForm(true);
  };

  const handleDelete = async (assistant: Assistant) => {
    if (confirm('Are you sure you want to delete this assistant?')) {
      try {
        await deleteAssistant(assistant.id);
        toast.success('Assistant deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete assistant');
      }
    }
  };

  const handleCall = (assistant: Assistant) => {
    setCallingAssistant(assistant);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAssistant(undefined);
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
              assistant={editingAssistant}
              onSubmit={editingAssistant ? handleUpdateAssistant : handleCreateAssistant}
              onCancel={handleCancel}
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
                onCall={handleCall}
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
          assistant={callingAssistant}
          onClose={() => setCallingAssistant(null)}
        />
      )}
    </div>
  );
};

export default Assistants;
