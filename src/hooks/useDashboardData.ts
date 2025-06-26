
import { useState, useEffect } from 'react';
import { backendService } from '@/services/BackendService';

export interface DashboardStats {
  totalCalls: number;
  todaysCalls: number;
  successfulCalls: number;
  totalMinutes: number;
  successRate: number;
}

export interface CampaignStats {
  activeCampaigns: number;
  totalCampaigns: number;
}

export const useDashboardData = () => {
  const [callStats, setCallStats] = useState<DashboardStats>({
    totalCalls: 0,
    todaysCalls: 0,
    successfulCalls: 0,
    totalMinutes: 0,
    successRate: 0
  });
  
  const [campaignStats, setCampaignStats] = useState<CampaignStats>({
    activeCampaigns: 0,
    totalCampaigns: 0
  });
  
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load calls data
      const calls = await backendService.select('calls', {
        orderBy: { column: 'created_at', ascending: false },
        limit: 50
      });

      // Calculate call stats
      const totalCalls = calls.length;
      const today = new Date().toDateString();
      const todaysCalls = calls.filter((call: any) => 
        new Date(call.created_at).toDateString() === today
      ).length;
      
      const successfulCalls = calls.filter((call: any) => 
        call.status === 'completed'
      ).length;
      
      const totalMinutes = calls.reduce((sum: number, call: any) => 
        sum + (call.duration || 0), 0
      ) / 60;
      
      const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

      setCallStats({
        totalCalls,
        todaysCalls,
        successfulCalls,
        totalMinutes: Math.round(totalMinutes),
        successRate
      });

      // Load campaigns data
      const campaigns = await backendService.select('campaigns', {});
      const activeCampaigns = campaigns.filter((c: any) => c.status === 'active').length;
      
      setCampaignStats({
        activeCampaigns,
        totalCampaigns: campaigns.length
      });

      // Set recent calls
      setRecentCalls(calls.slice(0, 10));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    callStats,
    campaignStats,
    recentCalls,
    isLoading,
    error,
    refetch: loadDashboardData
  };
};
