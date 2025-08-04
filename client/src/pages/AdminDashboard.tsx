"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  offlineUsers: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  totalWithdrawals: number;
  monthlyStats: {
    newUsers: number;
    revenue: number;
    withdrawals: number;
  };
}

interface WithdrawalRequest {
  id: number;
  userId: number;
  username: string;
  amount: number;
  pixKey: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  plan: string;
  availableBalance: number;
}

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [adminWallet, setAdminWallet] = useState<any>(null);

  // Fetch admin stats
  const { data: adminStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000,
  }) as { data: AdminStats | undefined, isLoading: boolean, refetch: () => void };

  // Fetch withdrawal requests
  const { data: withdrawalRequests, isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useQuery({
    queryKey: ['/api/admin/withdrawals'],
    refetchInterval: 30000,
  }) as { data: WithdrawalRequest[] | undefined, isLoading: boolean, refetch: () => void };

  // Fetch admin wallet
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['/api/admin/wallet'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (walletData) {
      setAdminWallet(walletData);
    }
  }, [walletData]);

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchStats(),
      refetchWithdrawals()
    ]);
  };

  const handleWithdrawalAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/withdrawals/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        refetchWithdrawals();
        refetchStats();
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/20 border-b border-gray-700">
        <div className="mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">🎮 Admin Dashboard</h1>
              <p className="text-gray-400">Orbitrum Connect - Painel Administrativo</p>
            </div>
            <Button 
              onClick={handleRefreshAll}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={statsLoading || withdrawalsLoading}
            >
              🔄 Sync
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-4 gap-1 p-1 bg-black/30 h-auto w-full">
            <TabsTrigger value="overview" className="text-xs px-2 py-1">
              📊 Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs px-2 py-1">
              👥 Usuários
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="text-xs px-2 py-1">
              💳 Saques
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs px-2 py-1">
              📈 Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-black/30 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {statsLoading ? '...' : (adminStats?.totalUsers || 0)}
                    </div>
                    <p className="text-sm text-gray-400">Total Usuários</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-black/30 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      R$ {statsLoading ? '...' : (adminStats?.totalRevenue || 0).toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-400">Receita Total</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-black/30 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {withdrawalsLoading ? '...' : (withdrawalRequests?.length || 0)}
                    </div>
                    <p className="text-sm text-gray-400">Saques Pendentes</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Wallet */}
            {adminWallet && (
              <Card className="bg-black/30 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-cyan-400">
                    🎮 Carteira Administrativa
                  </CardTitle>
                  <CardDescription>Tokens para testes e configuração</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-cyan-400">
                        {((adminWallet as any).saldoTotal || 10000).toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-400">Tokens Disponíveis</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">
                        {((adminWallet as any).utilizacaoSemana || 0).toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-400">Utilizados esta semana</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        R$ {(((adminWallet as any).saldoTotal || 0) * 0.001).toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-400">Valor em Reais</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">
                  👥 Gestão de Usuários
                </CardTitle>
                <CardDescription>Visualize e gerencie usuários da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <div className="text-6xl mb-4">👥</div>
                  <div className="text-lg">Gestão de Usuários</div>
                  <div className="text-sm mt-2">Funcionalidade em desenvolvimento</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-6 mt-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">
                  💳 Solicitações de Saque
                </CardTitle>
                <CardDescription>Gerencie solicitações de saque dos usuários</CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawalsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin mx-auto mb-4 text-blue-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Carregando solicitações...</p>
                  </div>
                ) : withdrawalRequests && withdrawalRequests.length > 0 ? (
                  <div className="space-y-4">
                    {withdrawalRequests.map((request: WithdrawalRequest) => (
                      <div key={request.id} className="border border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-white">{request.username}</div>
                            <div className="text-sm text-gray-400">R$ {request.amount.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">{request.pixKey}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleWithdrawalAction(request.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              ✅ Aprovar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleWithdrawalAction(request.id, 'reject')}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              ❌ Rejeitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-6xl mb-4">💳</div>
                    <div className="text-lg">Nenhuma solicitação pendente</div>
                    <div className="text-sm mt-2">Todas as solicitações foram processadas</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">
                  📈 Analytics e Relatórios
                </CardTitle>
                <CardDescription>Dados detalhados da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <div className="text-6xl mb-4">📈</div>
                  <div className="text-lg">Analytics e Relatórios</div>
                  <div className="text-sm mt-2">Funcionalidade em desenvolvimento</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}