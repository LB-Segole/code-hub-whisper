
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface AgentTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  template_data: Record<string, any>;
  created_by: string;
  team_id?: string;
  is_public: boolean;
  rating_average: number;
  rating_count: number;
  usage_count: number;
  downloads_count: number;
  version: string;
  created_at: string;
  updated_at: string;
}

export const useAgentTemplates = () => {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      console.log('🔄 Fetching agent templates...');
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.warn('⚠️ Auth error, but continuing with public templates:', authError);
      }
      
      console.log('👤 Current user:', user?.id || 'anonymous');

      const { data, error } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching templates:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Templates fetched successfully:', data?.length || 0);
      console.log('📋 Template data:', data);
      
      // Ensure all templates have required fields with defaults
      const processedTemplates = (data || []).map(template => ({
        ...template,
        description: template.description || 'No description available',
        tags: template.tags || [],
        rating_average: template.rating_average || 0,
        rating_count: template.rating_count || 0,
        usage_count: template.usage_count || 0,
        downloads_count: template.downloads_count || 0,
        version: template.version || '1.0.0'
      }));
      
      setTemplates(processedTemplates);
      setError(null);
    } catch (error: any) {
      console.error('❌ Error in fetchTemplates:', error);
      setError(error.message || 'Failed to fetch templates');
      setTemplates([]); // Set empty array on error
      toast({
        title: 'Error',
        description: `Failed to fetch agent templates: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('🔄 Fetching template categories...');
      const { data, error } = await supabase
        .from('agent_templates')
        .select('category')
        .eq('is_public', true);

      if (error) {
        console.error('❌ Error fetching categories:', error);
        throw error;
      }

      const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
      console.log('✅ Categories fetched successfully:', uniqueCategories);
      setCategories(uniqueCategories);
    } catch (error: any) {
      console.error('❌ Error fetching categories:', error);
      setError('Failed to fetch categories');
      setCategories([]); // Set empty array on error
    }
  };

  const createTemplate = async (templateData: Partial<AgentTemplate>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create templates');
      }

      const { data, error } = await supabase
        .from('agent_templates')
        .insert({
          ...templateData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Template created successfully',
      });

      return data;
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<AgentTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('agent_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => prev.map(t => t.id === id ? data : t));
      toast({
        title: 'Success',
        description: 'Template updated successfully',
      });

      return data;
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agent_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await Promise.all([fetchTemplates(), fetchCategories()]);
      } catch (error: any) {
        console.error('❌ Error loading data:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    templates,
    categories,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([fetchTemplates(), fetchCategories()]);
      } catch (error: any) {
        setError(error.message || 'Failed to refetch data');
      } finally {
        setIsLoading(false);
      }
    },
  };
};
