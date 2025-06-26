
import { backendService } from '@/services/BackendService';

export interface ChainExecution {
  id: string;
  chain_id: string;
  chain_name?: string; // Add the missing property
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  execution_log: any[];
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export class ChainExecutionService {
  static async create(data: Partial<ChainExecution>): Promise<ChainExecution> {
    return await backendService.insert('chain_executions', data);
  }

  static async getById(id: string): Promise<ChainExecution | null> {
    const results = await backendService.select('chain_executions', {
      where: { id },
      limit: 1
    });
    return results[0] || null;
  }

  static async getByChainId(chainId: string): Promise<ChainExecution[]> {
    return await backendService.select('chain_executions', {
      where: { chain_id: chainId },
      orderBy: { column: 'started_at', ascending: false }
    });
  }

  static async update(id: string, data: Partial<ChainExecution>): Promise<ChainExecution> {
    return await backendService.update('chain_executions', id, data);
  }
}
