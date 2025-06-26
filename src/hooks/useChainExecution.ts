
import { useState } from 'react';
import { ChainExecutionService, ChainExecution } from '@/services/chainExecution.service';

export const useChainExecution = () => {
  const [executions, setExecutions] = useState<ChainExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const startExecution = async (chainId: string): Promise<ChainExecution | null> => {
    try {
      setIsLoading(true);
      const execution = await ChainExecutionService.startChainExecution(chainId);
      setExecutions(prev => [execution, ...prev]);
      return execution;
    } catch (error) {
      console.error('Error starting chain execution:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getExecution = async (executionId: string): Promise<ChainExecution | null> => {
    try {
      return await ChainExecutionService.getChainExecution(executionId);
    } catch (error) {
      console.error('Error getting chain execution:', error);
      return null;
    }
  };

  const getActiveExecutions = async (chainId?: string): Promise<ChainExecution[]> => {
    try {
      return await ChainExecutionService.getActiveExecutions(chainId);
    } catch (error) {
      console.error('Error getting active executions:', error);
      return [];
    }
  };

  return {
    executions,
    isLoading,
    startExecution,
    getExecution,
    getActiveExecutions
  };
};
