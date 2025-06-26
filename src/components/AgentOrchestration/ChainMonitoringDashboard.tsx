import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  TrendingUp
} from 'lucide-react';
import { ChainExecution } from '@/services/chainExecution.service';
import { backendService } from '@/services/BackendService';

interface ChainMonitoringDashboardProps {
  chainId?: string;
}

export const ChainMonitoringDashboard: React.FC<ChainMonitoringDashboardProps> = ({ chainId }) => {
  const [executions, setExecutions] = useState<ChainExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<ChainExecution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    completed: 0,
    failed: 0,
    avgDuration: 0,
    successRate: 0
  });

  useEffect(() => {
    loadExecutions();
    loadStats();

    // Set up polling for real-time updates (since we removed Supabase subscriptions)
    const interval = setInterval(() => {
      loadExecutions();
      loadStats();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [chainId]);

  const loadExecutions = async () => {
    try {
      setIsLoading(true);
      
      const query = chainId ? { where: { chain_id: chainId } } : {};
      const data = await backendService.select('chain_executions', {
        ...query,
        orderBy: { column: 'started_at', ascending: false },
        limit: 50
      });

      setExecutions(data || []);
    } catch (error) {
      console.error('Error loading executions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const query = chainId ? { where: { chain_id: chainId } } : {};
      const data = await backendService.select('chain_executions', query);

      const total = data?.length || 0;
      const running = data?.filter((e: any) => e.status === 'running').length || 0;
      const completed = data?.filter((e: any) => e.status === 'completed').length || 0;
      const failed = data?.filter((e: any) => ['failed', 'timeout'].includes(e.status)).length || 0;
      
      // Calculate average duration for completed executions
      const completedWithDuration = data
        ?.filter((e: any) => e.status === 'completed' && e.completed_at)
        .map((e: any) => {
          const start = new Date(e.started_at).getTime();
          const end = new Date(e.completed_at).getTime();
          return (end - start) / 1000; // seconds
        }) || [];

      const avgDuration = completedWithDuration.length > 0
        ? Math.round(completedWithDuration.reduce((a: number, b: number) => a + b, 0) / completedWithDuration.length)
        : 0;

      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      setStats({
        total,
        running,
        completed,
        failed,
        avgDuration,
        successRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'timeout':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Square className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'timeout':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const duration = Math.round((end - start) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.round(duration / 60)}m`;
    } else {
      return `${Math.round(duration / 3600)}h`;
    }
  };

  const getExecutionProgress = (execution: ChainExecution) => {
    if (!execution.execution_log || execution.execution_log.length === 0) return 0;
    
    const totalSteps = new Set(execution.execution_log.map(log => log.step_id)).size;
    const completedSteps = execution.execution_log
      .filter(log => log.status === 'completed').length;
    
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Executions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.running}</div>
                <div className="text-sm text-gray-600">Currently Running</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.successRate}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.avgDuration}s</div>
                <div className="text-sm text-gray-600">Avg Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="executions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="details">Execution Details</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chain Executions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading executions...</div>
              ) : executions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No executions found
                </div>
              ) : (
                <div className="space-y-4">
                  {executions.map((execution: any) => (
                    <div
                      key={execution.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedExecution(execution)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(execution.status)}
                          <div>
                            <div className="font-medium">
                              {execution.chain_name || 'Unknown Chain'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Started {formatDuration(execution.started_at)} ago
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {execution.status === 'running' && (
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={getExecutionProgress(execution)} 
                                className="w-20" 
                              />
                              <span className="text-sm text-gray-500">
                                {getExecutionProgress(execution)}%
                              </span>
                            </div>
                          )}
                          
                          <Badge className={getStatusColor(execution.status)}>
                            {execution.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedExecution ? (
            <Card>
              <CardHeader>
                <CardTitle>Execution Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(selectedExecution.status)}
                        <Badge className={getStatusColor(selectedExecution.status)}>
                          {selectedExecution.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Duration</label>
                      <div className="mt-1">
                        {formatDuration(
                          selectedExecution.started_at, 
                          selectedExecution.completed_at
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedExecution.error_message && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Error</label>
                      <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-red-800">
                        {selectedExecution.error_message}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Execution Log</label>
                    <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                      {selectedExecution.execution_log?.map((log: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(log.status)}
                              <span className="font-medium">Step {log.step_id}</span>
                              {log.agent_id && (
                                <Badge variant="outline">Agent: {log.agent_id}</Badge>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          {log.error && (
                            <div className="mt-2 text-sm text-red-600">
                              Error: {log.error}
                            </div>
                          )}
                          
                          {log.output && (
                            <div className="mt-2 text-sm text-gray-600">
                              Output: {JSON.stringify(log.output, null, 2)}
                            </div>
                          )}
                        </div>
                      )) || (
                        <div className="text-gray-500 text-center py-4">
                          No execution logs available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                Select an execution to view details
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
