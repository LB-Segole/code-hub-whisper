
import { useState, useEffect } from 'react';

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_data: {
    system_prompt?: string;
    voice_model?: string;
    example_calls?: string[];
    is_active?: boolean;
  };
  created_by: string;
  team_id?: string;
  is_public: boolean;
  downloads_count: number;
  rating_average: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  version: string;
  tags: string[];
  usage_count: number;
}

export const useAgentTemplates = () => {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      
      // Create some mock templates for local development
      const mockTemplates: AgentTemplate[] = [
        {
          id: '1',
          name: 'Customer Support Agent',
          description: 'Friendly customer support assistant for handling inquiries',
          category: 'support',
          template_data: {
            system_prompt: 'You are a helpful customer support agent. Be friendly and professional.',
            voice_model: 'aura-asteria-en'
          },
          created_by: 'system',
          is_public: true,
          downloads_count: 150,
          rating_average: 4.5,
          rating_count: 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: '1.0.0',
          tags: ['support', 'customer-service'],
          usage_count: 150
        },
        {
          id: '2',
          name: 'Sales Assistant',
          description: 'Professional sales agent for lead qualification',
          category: 'sales',
          template_data: {
            system_prompt: 'You are a sales assistant. Help qualify leads and provide product information.',
            voice_model: 'aura-asteria-en'
          },
          created_by: 'system',
          is_public: true,
          downloads_count: 89,
          rating_average: 4.2,
          rating_count: 18,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: '1.0.0',
          tags: ['sales', 'lead-qualification'],
          usage_count: 89
        }
      ];

      setTemplates(mockTemplates);
      setCategories(['support', 'sales', 'general']);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    templates,
    categories,
    isLoading,
    refetch: loadTemplates
  };
};
