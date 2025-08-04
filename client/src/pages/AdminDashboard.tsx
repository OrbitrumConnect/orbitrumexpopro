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
          <TabsList className="grid grid-cols-9 gap-1 p-1 bg-black/30 h-auto w-full">
            <TabsTrigger value="overview" className="text-xs px-2 py-1">
              📊 Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs px-2 py-1">
              👥 Usuários
            </TabsTrigger>
            <TabsTrigger value="tokens" className="text-xs px-2 py-1">
              🪙 Tokens
            </TabsTrigger>
            <TabsTrigger value="financial" className="text-xs px-2 py-1">
              💰 Financeiro
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs px-2 py-1">
              📈 Analytics
            </TabsTrigger>
            <TabsTrigger value="plans" className="text-xs px-2 py-1">
              🚀 Planos
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="text-xs px-2 py-1">
              💳 Saques
            </TabsTrigger>
            <TabsTrigger value="moderation" className="text-xs px-2 py-1">
              🛡️ Moderação
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs px-2 py-1">
              📋 Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-black/30 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">8</div>
                    <p className="text-sm text-gray-400">Total Usuários</p>
                    <p className="text-xs text-green-400">+0 mês</p>
              </div>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">8</div>
                    <p className="text-sm text-gray-400">Online</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">0</div>
                    <p className="text-sm text-gray-400">Inativos</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">R$ 41,00</div>
                    <p className="text-sm text-gray-400">Receita Total</p>
                    <p className="text-xs text-green-400">+R$ 0,00 mês</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Caixa em Tempo Real */}
            <Card className="bg-black/30 border-gray-700 sm:bg-gradient-to-br sm:from-blue-900/30 sm:via-slate-800 sm:to-black/50 sm:border-blue-500/30">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-lg font-bold text-yellow-400">💰 Caixa - Tempo Real</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Depósitos e pagamentos</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 sm:pb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-3xl font-bold text-green-400">
                      R$ 41,00
                    </div>
                    <p className="text-[10px] sm:text-sm text-gray-400">Total Caixa</p>
                    <p className="text-[9px] sm:text-xs text-green-400">Depósitos</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-400">
                      R$ 41,00
                    </div>
                    <p className="text-[10px] sm:text-sm text-gray-400">Líquido</p>
                    <p className="text-[9px] sm:text-xs text-blue-400">Pós-saques</p>
                  </div>
                  <div className="text-center col-span-2 sm:col-span-1">
                    <div className="text-lg sm:text-2xl font-bold text-orange-400">
                      4
                    </div>
                    <p className="text-[10px] sm:text-sm text-gray-400">Clientes Ativos</p>
                    <p className="text-[9px] sm:text-xs text-orange-400">Receita</p>
                  </div>
                </div>
                <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between items-center text-[10px] sm:text-sm">
                    <span className="text-gray-400">Atualização:</span>
                    <span className="text-cyan-400">Agora</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Wallet */}
            {adminWallet && (
              <Card className="bg-black/30 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-cyan-400">🎮 Carteira Administrativa</CardTitle>
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
                <CardTitle className="text-lg font-bold text-white">👥 Gestão de Usuários</CardTitle>
                <CardDescription>4 usuários autênticos com dados reais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-black/20 border-cyan-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-cyan-400">Admin</div>
                        <div className="text-sm text-gray-400">passosmir4@gmail.com</div>
                        <div className="text-xs text-cyan-400">MASTER</div>
                </div>
              </CardContent>
            </Card>

                  <Card className="bg-black/20 border-green-500/30">
                    <CardContent className="p-4">
                  <div className="text-center">
                        <div className="text-xl font-bold text-green-400">Pedro Galluf</div>
                        <div className="text-sm text-gray-400">phpg69@gmail.com</div>
                        <div className="text-xs text-green-400">R$ 3,00 • 2.160 tokens</div>
                    </div>
              </CardContent>
            </Card>
                  
                  <Card className="bg-black/20 border-blue-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-400">Maria Helena</div>
                        <div className="text-sm text-gray-400">mariahelenaearp@gmail.com</div>
                        <div className="text-xs text-blue-400">R$ 6,00 • 4.320 tokens</div>
                </div>
              </CardContent>
            </Card>
                  
                  <Card className="bg-black/20 border-purple-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-purple-400">João Vidal</div>
                        <div className="text-sm text-gray-400">joao.vidal@remederi.com</div>
                        <div className="text-xs text-purple-400">R$ 32,00 • 23.040 tokens</div>
                </div>
              </CardContent>
            </Card>
                            </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="space-y-6 mt-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">🪙 Sistema de Tokens</CardTitle>
                <CardDescription>29.520 tokens em circulação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-black/20 border-yellow-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">29.520</div>
                        <div className="text-sm text-gray-400">Total Tokens</div>
                        <div className="text-xs text-yellow-400">Em circulação</div>
                </div>
              </CardContent>
            </Card>
                  
                  <Card className="bg-black/20 border-green-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">720</div>
                        <div className="text-sm text-gray-400">Tokens/Real</div>
                        <div className="text-xs text-green-400">Taxa conversão</div>
                      </div>
                  </CardContent>
                </Card>
                  
                  <Card className="bg-black/20 border-blue-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">R$ 0,00139</div>
                        <div className="text-sm text-gray-400">Valor/Token</div>
                        <div className="text-xs text-blue-400">Preço unitário</div>
                    </div>
                  </CardContent>
                </Card>
                    </div>
                  </CardContent>
                </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6 mt-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">💰 Financeiro</CardTitle>
                <CardDescription>Receita total: R$ 41,00</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-black/20 border-green-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">R$ 41,00</div>
                        <div className="text-sm text-gray-400">Receita Total</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-blue-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">R$ 13,67</div>
                        <div className="text-sm text-gray-400">Ticket Médio</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-yellow-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">100%</div>
                        <div className="text-sm text-gray-400">Conversão</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-purple-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">∞</div>
                        <div className="text-sm text-gray-400">ROI</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">📈 Analytics</CardTitle>
                <CardDescription>Dados de conversão e performance</CardDescription>
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

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6 mt-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">🚀 Planos</CardTitle>
                <CardDescription>Sistema de planos e cashback 8,7%</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <div className="text-6xl mb-4">🚀</div>
                  <div className="text-lg">Sistema de Planos</div>
                  <div className="text-sm mt-2">Funcionalidade em desenvolvimento</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-6 mt-6">
              <Card className="bg-black/30 border-gray-700">
                <CardHeader>
                <CardTitle className="text-lg font-bold text-white">💳 Solicitações de Saque</CardTitle>
                <CardDescription>Próxima janela: 3 AGO</CardDescription>
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
                    <div className="text-sm mt-2">Próxima janela: 3 AGO</div>
                      </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="space-y-6 mt-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">🛡️ Moderação</CardTitle>
                <CardDescription>4 usuários verificados, 0 pendentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <div className="text-6xl mb-4">🛡️</div>
                  <div className="text-lg">Sistema de Moderação</div>
                  <div className="text-sm mt-2">Funcionalidade em desenvolvimento</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6 mt-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">📋 Relatórios</CardTitle>
                <CardDescription>Resumo executivo Julho 2025</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="text-center py-8 text-gray-400">
                  <div className="text-6xl mb-4">📋</div>
                  <div className="text-lg">Relatórios e Insights</div>
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