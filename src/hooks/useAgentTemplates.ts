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
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate loading templates for local mode
      const mockTemplates: AgentTemplate[] = [
        {
          id: '1',
          name: 'Customer Support Agent',
          description: 'Helpful customer service assistant',
          category: 'Support',
          system_prompt: 'You are a helpful customer support agent.',
          is_public: true,
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          rating: 4.5,
          usage_count: 150,
          tags: ['support', 'customer-service']
        }
      ];
      
      setTemplates(mockTemplates);
      setCategories(['Support', 'Sales', 'Marketing']);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return {
    templates,
    categories,
    isLoading,
    error,
    refetch
  };
};
