import { useState, useEffect } from 'react';
import { backendService } from '@/services/BackendService';

export interface VoiceAgent {
  id: string;
  name: string;
  system_prompt: string;
  first_message?: string;
  voice_provider: string;
  voice_id: string;
  model: string;
  temperature: number;
  max_tokens: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_active?: boolean;
}

export interface VoiceAgentFormData {
  name: string;
  system_prompt: string;
  first_message?: string;
  voice_provider: string;
  voice_id: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

export const useVoiceAgents = () => {
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const user = await backendService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const data = await backendService.select<VoiceAgent>('voice_agents', {
        where: { user_id: user.id },
        orderBy: { column: 'created_at', ascending: false }
      });
      
      setAgents(data || []);
    } catch (err) {
      console.error('Error loading voice agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = async (formData: VoiceAgentFormData): Promise<VoiceAgent | null> => {
    try {
      const user = await backendService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newAgent = await backendService.insert<VoiceAgent>('voice_agents', {
        ...formData,
        user_id: user.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      setAgents(prev => [newAgent, ...prev]);
      return newAgent;
    } catch (err) {
      console.error('Error creating voice agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agent');
      return null;
    }
  };

  const updateAgent = async (id: string, formData: VoiceAgentFormData): Promise<VoiceAgent | null> => {
    try {
      setIsLoading(true);
      
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      await backendService.update('voice_agents', id, updateData);
      
      // Reload to get updated data
      await loadAgents();
      
      return agents.find(agent => agent.id === id) || null;
    } catch (error) {
      console.error('Error updating voice agent:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAgent = async (id: string): Promise<boolean> => {
    try {
      await backendService.delete('voice_agents', id);
      
      setAgents(prev => prev.filter(agent => agent.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting voice agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
      return false;
    }
  };

  const toggleAgentStatus = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const updatedAgent = await backendService.update<VoiceAgent>('voice_agents', id, {
        is_active: isActive,
        updated_at: new Date().toISOString()
      });
      
      setAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, is_active: isActive } : agent
      ));
      return true;
    } catch (err) {
      console.error('Error toggling agent status:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle agent status');
      return false;
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  return {
    agents,
    isLoading,
    error,
    loadAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
  };
};
