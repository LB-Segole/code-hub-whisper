
import { useState } from 'react';
import { backendService } from '@/services/BackendService';

export interface Team {
  id: string;
  name: string;
  description?: string;
  billing_email?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export const useTeamManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createTeam = async (teamData: Partial<Team>): Promise<boolean> => {
    try {
      setIsLoading(true);
      const user = await backendService.getCurrentUser();
      if (!user) return false;

      const newTeam = await backendService.insert<Team>('teams', {
        ...teamData,
        owner_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      setTeams(prev => [newTeam, ...prev]);
      return true;
    } catch (error) {
      console.error('Error creating team:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    teams,
    isLoading,
    createTeam
  };
};
