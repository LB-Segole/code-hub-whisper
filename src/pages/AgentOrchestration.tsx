import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChainMonitoringDashboard } from '@/components/AgentOrchestration/ChainMonitoringDashboard';
import { AgentChainDialog } from '@/components/AgentOrchestration/AgentChainDialog';
import { useChainExecution } from '@/hooks/useChainExecution';
import { useAssistants } from '@/hooks/useAssistants';
import { backendService } from '@/services/BackendService';
import { Plus, Play, TrendingUp, Monitor, Zap, GitBranch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AgentChain {
  id: string;
  name: string;
  description?: string;
  configuration: {
    steps: Array<{
      id: string;
      agent_id?: string;
      step_order: number;
      conditions?: Record<string, any>;
      timeout_seconds?: number;
      fallback_step_id?: string;
    }>;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const AgentOrchestration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chains');
  const [showChainDialog, setShowChainDialog] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [chains, setChains] = useState<AgentChain[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalChains: 0,
    activeChains: 0,
    totalExecutions: 0,
    successRate: 0
  });

  const { startExecution, isLoading: executionLoading } = useChainExecution();
  const { assistants } = useAssistants();
  const { toast } = useToast();

  const loadChains = async () => {
    try {
      setIsLoading(true);
      
      const data = await backendService.select('agent_chains', {
        orderBy: { column: 'created_at', ascending: false }
      });

      // Type cast the data to AgentChain[]
      const typedChains = (data || []).map(item => ({
        id: item.id,
        name: item.name || 'Unnamed Chain',
        description: item.description,
        configuration: item.configuration || { steps: [] },
        is_active: item.is_active || false,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      })) as AgentChain[];

      setChains(typedChains);
      
      // Calculate stats
      const totalChains = typedChains.length;
      const activeChains = typedChains.filter(chain => chain.is_active).length;
      
      setStats(prev => ({
        ...prev,
        totalChains,
        activeChains
      }));
    } catch (error) {
      console.error('Failed to load chains:', error);
      toast({
        title: "Error",
        description: "Failed to load agent chains",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load execution stats
      const executions = await backendService.select('chain_executions');

      const totalExecutions = executions?.length || 0;
      const successfulExecutions = executions?.filter((e: any) => e.status === 'completed').length || 0;
      const successRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;

      setStats(prev => ({
        ...prev,
        totalExecutions,
        successRate
      }));
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCreateChain = async (chainData: any) => {
    try {
      const user = await backendService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const newChainData = await backendService.insert('agent_chains', {
        ...chainData,
        user_id: user.id
      });

      // Type cast the new data
      const newChain: AgentChain = {
        id: newChainData.id,
        name: newChainData.name || 'Unnamed Chain',
        description: newChainData.description,
        configuration: newChainData.configuration || { steps: [] },
        is_active: newChainData.is_active || false,
        created_at: newChainData.created_at || new Date().toISOString(),
        updated_at: newChainData.updated_at || new Date().toISOString()
      };

      setChains(prev => [newChain, ...prev]);
      
      toast({
        title: "Success",
        description: "Agent chain created successfully",
      });

      setShowChainDialog(false);
    } catch (error) {
      console.error('Failed to create chain:', error);
      toast({
        title: "Error",
        description: "Failed to create agent chain",
        variant: "destructive"
      });
    }
  };

  const handleTestChain = async (chainId: string) => {
    console.log('Testing chain:', chainId);
    const execution = await startExecution(chainId);
    if (execution) {
      setSelectedChainId(chainId);
      setActiveTab('monitoring');
    }
  };

  const toggleChainStatus = async (chainId: string, isActive: boolean) => {
    try {
      await backendService.update('agent_chains', chainId, { 
        is_active: !isActive, 
        updated_at: new Date().toISOString() 
      });

      setChains(prev =>
        prev.map(chain =>
          chain.id === chainId ? { ...chain, is_active: !isActive } : chain
        )
      );

      toast({
        title: "Success",
        description: `Chain ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Failed to toggle chain status:', error);
      toast({
        title: "Error",
        description: "Failed to update chain status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadChains();
    loadStats();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Orchestration</h1>
          <p className="text-gray-600">Manage multi-agent workflows and chains</p>
        </div>
        <Button onClick={() => setShowChainDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Chain
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalChains}</div>
                <div className="text-sm text-gray-600">Total Chains</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.activeChains}</div>
                <div className="text-sm text-gray-600">Active Chains</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalExecutions}</div>
                <div className="text-sm text-gray-600">Total Executions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.successRate}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chains">Agent Chains</TabsTrigger>
          <TabsTrigger value="monitoring">
            <Monitor className="w-4 h-4 mr-2" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="chains" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading chains...</div>
          ) : chains.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Agent Chains</h3>
                <p className="text-gray-600 mb-4">
                  Create your first agent chain to get started with multi-agent workflows
                </p>
                <Button onClick={() => setShowChainDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Chain
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {chains.map((chain) => (
                <Card key={chain.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{chain.name}</h3>
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            chain.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {chain.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{chain.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{chain.configuration.steps?.length || 0} steps</span>
                          <span>Created {new Date(chain.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedChainId(chain.id);
                            setActiveTab('monitoring');
                          }}
                        >
                          <Monitor className="w-4 h-4 mr-2" />
                          Monitor
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleChainStatus(chain.id, chain.is_active)}
                        >
                          {chain.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        
                        <Button 
                          size="sm"
                          onClick={() => handleTestChain(chain.id)}
                          disabled={executionLoading || !chain.is_active}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {executionLoading ? 'Starting...' : 'Test'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <ChainMonitoringDashboard chainId={selectedChainId || undefined} />
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Chain Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <ChainMonitoringDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Chain Performance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="font-semibold">{stats.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Executions</span>
                      <span className="font-semibold">{stats.totalExecutions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Chains</span>
                      <span className="font-semibold">{stats.activeChains}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Usage Insights</h3>
                  <p className="text-sm text-gray-600">
                    Detailed analytics and insights will be available here to help you 
                    optimize your agent chain performance and workflows.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chain Creation Dialog */}
      <AgentChainDialog
        open={showChainDialog}
        onOpenChange={setShowChainDialog}
        onSave={handleCreateChain}
        availableAgents={assistants.map(a => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
};
