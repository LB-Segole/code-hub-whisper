
import { useState, useEffect } from 'react';
import { backendService } from '@/services/BackendService';

export interface CallRecord {
  id: string;
  phone_number: string;
  assistant_id?: string;
  status: 'pending' | 'calling' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';
  duration?: number;
  created_at: string;
  completed_at?: string;
  transcript?: string;
  recording_url?: string;
}

export const useCallHistory = () => {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setIsLoading(true);
      const data = await backendService.select<CallRecord>('calls', {
        orderBy: { column: 'created_at', ascending: false }
      });
      setCalls(data || []);
    } catch (error) {
      console.error('Error loading calls:', error);
      setCalls([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    calls,
    isLoading,
    refetch: loadCalls
  };
};
