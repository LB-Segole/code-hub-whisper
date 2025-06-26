
import { useState, useEffect } from 'react';
import { backendService } from '@/services/BackendService';
import type { Assistant, AssistantFormData } from '@/types/assistant';

export type { Assistant, AssistantFormData };

export const useAssistants = () => {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssistants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const user = await backendService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const data = await backendService.select<Assistant>('assistants', {
        where: { user_id: user.id },
        orderBy: { column: 'created_at', ascending: false }
      });
      
      setAssistants(data || []);
    } catch (err) {
      console.error('Error loading assistants:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assistants');
    } finally {
      setIsLoading(false);
    }
  };

  const createAssistant = async (formData: AssistantFormData): Promise<Assistant | null> => {
    try {
      const user = await backendService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newAssistant = await backendService.insert<Assistant>('assistants', {
        ...formData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      setAssistants(prev => [newAssistant, ...prev]);
      return newAssistant;
    } catch (err) {
      console.error('Error creating assistant:', err);
      setError(err instanceof Error ? err.message : 'Failed to create assistant');
      return null;
    }
  };

  const updateAssistant = async (id: string, formData: AssistantFormData): Promise<Assistant | null> => {
    try {
      const updatedAssistant = await backendService.update<Assistant>('assistants', id, {
        ...formData,
        updated_at: new Date().toISOString()
      });
      
      setAssistants(prev => prev.map(assistant => 
        assistant.id === id ? updatedAssistant : assistant
      ));
      return updatedAssistant;
    } catch (err) {
      console.error('Error updating assistant:', err);
      setError(err instanceof Error ? err.message : 'Failed to update assistant');
      return null;
    }
  };

  const deleteAssistant = async (id: string): Promise<boolean> => {
    try {
      await backendService.delete('assistants', id);
      
      setAssistants(prev => prev.filter(assistant => assistant.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting assistant:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete assistant');
      return false;
    }
  };

  useEffect(() => {
    loadAssistants();
  }, []);

  return {
    assistants,
    isLoading,
    error,
    loadAssistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,
  };
};
