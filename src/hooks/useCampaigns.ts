
import { useState, useEffect } from 'react';
import { backendService } from '@/services/BackendService';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  assistant_id?: string;
  total_calls?: number;
  completed_calls?: number;
  success_rate?: number;
  created_at: string;
  updated_at: string;
}

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const data = await backendService.select<Campaign>('campaigns', {
        orderBy: { column: 'created_at', ascending: false }
      });
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createCampaign = async (campaignData: Partial<Campaign>): Promise<Campaign | null> => {
    try {
      const newCampaign = await backendService.insert<Campaign>('campaigns', {
        ...campaignData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      setCampaigns(prev => [newCampaign, ...prev]);
      return newCampaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  };

  return {
    campaigns,
    isLoading,
    refetch: loadCampaigns,
    createCampaign
  };
};
