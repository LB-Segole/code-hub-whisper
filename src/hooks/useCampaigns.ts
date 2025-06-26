
import { useState, useEffect } from 'react';
import { backendService } from '@/services/BackendService';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
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

  return {
    campaigns,
    isLoading,
    refetch: loadCampaigns
  };
};
