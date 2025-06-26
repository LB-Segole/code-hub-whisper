
import { backendService } from '@/services/BackendService';

export interface ChainExecution {
  id: string;
  chain_id: string;
  chain_name?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  execution_log: any[];
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export class ChainExecutionService {
  static async create(data: Partial<ChainExecution>): Promise<ChainExecution> {
    const result = await backendService.insert('chain_executions', data);
    return result as ChainExecution;
  }

  static async getById(id: string): Promise<ChainExecution | null> {
    const results = await backendService.select('chain_executions', {
      where: { id },
      limit: 1
    });
    return (results[0] as ChainExecution) || null;
  }

  static async getByChainId(chainId: string): Promise<ChainExecution[]> {
    const results = await backendService.select('chain_executions', {
      where: { chain_id: chainId },
      orderBy: { column: 'started_at', ascending: false }
    });
    return results as ChainExecution[];
  }

  static async update(id: string, data: Partial<ChainExecution>): Promise<ChainExecution> {
    const result = await backendService.update('chain_executions', id, data);
    return result as ChainExecution;
  }

  static async startChainExecution(chainId: string, callId?: string): Promise<ChainExecution> {
    const execution = await this.create({
      chain_id: chainId,
      status: 'pending',
      execution_log: [],
      started_at: new Date().toISOString()
    });
    return execution;
  }

  static async getChainExecution(executionId: string): Promise<ChainExecution | null> {
    return this.getById(executionId);
  }

  static async getActiveExecutions(chainId?: string): Promise<ChainExecution[]> {
    if (chainId) {
      return this.getByChainId(chainId);
    }
    
    const results = await backendService.select('chain_executions', {
      where: { status: 'running' },
      orderBy: { column: 'started_at', ascending: false }
    });
    return results as ChainExecution[];
  }
}

export const chainExecutionService = ChainExecutionService;
