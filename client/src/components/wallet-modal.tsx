import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, TrendingUp, TrendingDown, History, ArrowUpCircle, Info, Shield, ShoppingBag, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
// import type { WalletView } from "@shared/token-operations";
import { useAuth } from "@/hooks/useAuth";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<'tokens-comprados' | 'planos-cashback' | 'history' | 'detailed' | 'transactions'>('tokens-comprados');
  const { user: authUser } = useAuth();
  
  // Admin tem wallet especial
  const isAdmin = authUser?.email === 'passosmir4@gmail.com';
  
  // Query para carteira sem auto-refresh
  const { data: wallet, isLoading } = useQuery<any>({
    queryKey: isAdmin ? ["/api/admin/wallet"] : ["/api/users/wallet", authUser?.email],
    enabled: isOpen && (isAdmin || !!authUser?.email),
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
    retry: 2,
    gcTime: 1000, // Cache mínimo para performance
    queryFn: async () => {
      if (isAdmin) {
        const response = await fetch('/api/admin/wallet');
        if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
        return response.json();
      }
      
      // Para usuários normais, usar endpoint por email
      const response = await fetch('/api/wallet/user', {
        headers: {
          'User-Email': authUser?.email || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    }
  });

  const { data: history = [] } = useQuery({
    queryKey: ["/api/users", authUser?.email, "token-history"],
    enabled: isOpen && activeTab === 'history' && !isAdmin && !!authUser?.email,
    staleTime: 5 * 60 * 1000, // Cache de 5 minutos para histórico
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    gcTime: 10 * 60 * 1000,
  });

  // Query para informações detalhadas da carteira
  const { data: walletDetailed, isLoading: isLoadingDetailed } = useQuery({
    queryKey: ["/api/wallet/detailed", authUser?.id || 1],
    enabled: isOpen && (activeTab === 'detailed' || activeTab === 'transactions'),
    staleTime: 1 * 60 * 1000, // Cache por 1 minuto
    queryFn: async () => {
      const userId = authUser?.id || 1;
      const response = await fetch(`/api/wallet/detailed/${userId}`);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    }
  });

  // Query para histórico de transações
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["/api/wallet/transactions", authUser?.id || 1],
    enabled: isOpen && activeTab === 'transactions',
    staleTime: 1 * 60 * 1000,
    queryFn: async () => {
      const userId = authUser?.id || 1;
      const response = await fetch(`/api/wallet/transactions/${userId}`);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    }
  });

  if (!isOpen) return null;

  // Admin tem carteira administrativa especial
  if (isAdmin && wallet) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glassmorphism rounded-lg max-w-md w-full p-4 sm:p-6 scale-[0.75] sm:scale-[0.87]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-purple-400" />
                <div>
                  <h2 className="text-xl font-bold text-purple-400">Carteira Administrativa</h2>
                  <p className="text-sm text-gray-400">Plano Max - Recarga Semanal</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/30">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {wallet.saldoTotal?.toLocaleString() || '10.000'}
                  </div>
                  <p className="text-sm text-gray-400">Tokens Disponíveis</p>
                  <p className="text-xs text-purple-300 mt-1">🔄 Recarga automática toda semana</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-cyan-400">
                    {wallet.utilizacaoSemana?.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-gray-400">Utilizados esta semana</p>
                </div>
                <div className="bg-black/40 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">
                    {wallet.proximaRecarga || 'Domingo'}
                  </div>
                  <p className="text-xs text-gray-400">Próxima recarga</p>
                </div>
              </div>

              <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30">
                <div className="flex items-center gap-2 text-sm text-purple-300">
                  <Info className="h-4 w-4" />
                  <span>Finalidade: Apenas para jogos e testes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-cyan-300 mt-1">
                  <Shield className="h-4 w-4" />
                  <span>Jogos ilimitados sem custo</span>
                </div>
              </div>

              <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30">
                <div className="flex items-center gap-2 text-sm text-red-300">
                  <Info className="h-4 w-4" />
                  <span>⚠️ LIMITAÇÃO: Não válido para serviços profissionais</span>
                </div>
                <div className="text-xs text-red-400 mt-1">
                  Para contratar serviços, use dinheiro real através dos planos pagos
                </div>
              </div>

              <Button onClick={onClose} className="neon-button w-full">
                Entendi
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glassmorphism rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto scale-[0.7] sm:scale-[0.87]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              {isAdmin ? (
                <Shield className="h-6 w-6 text-orange-400" />
              ) : (
                <Wallet className="h-6 w-6 text-[var(--neon-cyan)]" />
              )}
              <h2 className="text-2xl font-bold neon-text">
                {isAdmin ? 'Informações Admin' : 'Carteira de Tokens'}
              </h2>
              {isAdmin && (
                <span className="text-xs bg-orange-500/20 border border-orange-400 px-2 py-1 rounded text-orange-300">
                  ADMIN
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Tabs - 5 abas compactas */}
          <div className="flex border-b border-gray-700 overflow-x-auto">
            <button
              className={`flex-1 px-1 sm:px-3 py-2 text-[9px] sm:text-xs font-medium transition-colors ${
                activeTab === 'tokens-comprados'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('tokens-comprados')}
            >
              <ShoppingBag className="h-3 w-3 inline mr-1" />
              <span className="hidden xs:inline">Tokens</span>
            </button>
            <button
              className={`flex-1 px-1 sm:px-3 py-2 text-[9px] sm:text-xs font-medium transition-colors ${
                activeTab === 'planos-cashback'
                  ? 'text-[var(--neon-cyan)] border-b-2 border-[var(--neon-cyan)]'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('planos-cashback')}
            >
              <Wallet className="h-3 w-3 inline mr-1" />
              <span className="hidden xs:inline">Planos</span>
            </button>
            <button
              className={`flex-1 px-1 sm:px-3 py-2 text-[9px] sm:text-xs font-medium transition-colors ${
                activeTab === 'detailed'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('detailed')}
            >
              <Info className="h-3 w-3 inline mr-1" />
              <span className="hidden xs:inline">Info</span>
            </button>
            <button
              className={`flex-1 px-1 sm:px-3 py-2 text-[9px] sm:text-xs font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('transactions')}
            >
              <Coins className="h-3 w-3 inline mr-1" />
              <span className="hidden xs:inline">Trans</span>
            </button>
            <button
              className={`flex-1 px-1 sm:px-3 py-2 text-[9px] sm:text-xs font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-gray-300 border-b-2 border-gray-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('history')}
            >
              <History className="h-3 w-3 inline mr-1" />
              <span className="hidden xs:inline">Hist</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-6">
            {activeTab === 'tokens-comprados' && (
              <div className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-400">Carregando carteira...</p>
                  </div>
                ) : wallet ? (
                  <>
                    {/* Saldo Tokens Comprados */}
                    <div className="text-center mb-4 sm:mb-6">
                      <h3 className="text-sm sm:text-lg text-purple-400 mb-2">💳 Tokens Comprados</h3>
                      <p className="text-2xl sm:text-4xl font-bold text-purple-400">{wallet.tokensComprados.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-400">tokens disponíveis</p>
                    </div>
                    
                    {/* Características dos Tokens Comprados */}
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-3 sm:p-6 rounded-lg border border-purple-500/30">
                      <div className="flex items-center gap-3 mb-3 sm:mb-4">
                        <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                        <h3 className="text-lg sm:text-xl font-bold text-white">Tokens para Serviços</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-green-400">Válido para contratar profissionais</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-green-400">Disponível imediatamente após compra</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <span className="text-red-400">Não gera cashback de 8,7%</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <span className="text-red-400">Não permite tokens em jogos</span>
                        </div>
                      </div>
                    </div>
                    
                    {wallet.tokensComprados === 0 && (
                      <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30 text-center">
                        <ShoppingBag className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-purple-400 mb-2">Nenhum Token Comprado</h3>
                        <p className="text-sm text-gray-400 mb-4">
                          Compre tokens para começar a contratar profissionais
                        </p>
                        <Button 
                          onClick={() => {
                            // Redirecionar para loja de tokens
                            window.location.href = '/#/tokens';
                          }} 
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          💳 Comprar Tokens
                        </Button>
                      </div>
                    )}
                    
                    {/* Informações sobre valores */}
                    <div className="bg-purple-900/10 rounded-lg p-4 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-semibold text-purple-400">Valores de Referência</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                        <div>R$ 3,00 = 2.160 tokens</div>
                        <div>R$ 6,00 = 4.320 tokens</div>
                        <div>R$ 9,00 = 6.480 tokens</div>
                        <div>R$ 18,00 = 12.960 tokens</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Não foi possível carregar os dados da carteira</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'planos-cashback' && (
              <div className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-[var(--neon-cyan)] border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-400">Carregando carteira...</p>
                  </div>
                ) : wallet ? (
                  <>
                    {/* Saldo Carteira de Planos */}
                    <div className="text-center mb-4 sm:mb-6">
                      <h3 className="text-sm sm:text-lg text-[var(--neon-cyan)] mb-2">🎯 Carteira de Planos</h3>
                      <p className="text-2xl sm:text-4xl font-bold text-[var(--neon-cyan)]">{(wallet.tokensPlano + wallet.tokensGanhos).toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-400">tokens com cashback</p>
                    </div>
                    
                    {/* Características da Carteira de Planos */}
                    <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-3 sm:p-6 rounded-lg border border-cyan-500/30">
                      <div className="flex items-center gap-3 mb-3 sm:mb-4">
                        <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--neon-cyan)]" />
                        <h3 className="text-lg sm:text-xl font-bold text-white">Sistema de Cashback</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-green-400">Acumula 8,7% cashback mensal</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-green-400">Ganhe tokens jogando</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-green-400">Válido para contratar serviços</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                          <span className="text-cyan-400">Saque no dia 3 de cada mês</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Divisão Planos vs Jogos */}
                    {(wallet.tokensPlano > 0 || wallet.tokensGanhos > 0) ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/30 text-center">
                          <Wallet className="h-8 w-8 text-[var(--neon-cyan)] mx-auto mb-2" />
                          <div className="text-2xl font-bold text-[var(--neon-cyan)]">{wallet.tokensPlano.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">Tokens do Plano</div>
                        </div>
                        <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30 text-center">
                          <Coins className="h-8 w-8 text-green-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-400">{wallet.tokensGanhos.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">Ganhos em Jogos</div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-900/20 rounded-lg p-6 border border-gray-500/30 text-center">
                        <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-400 mb-2">Sem Plano Ativo</h3>
                        <p className="text-sm text-gray-400 mb-4">
                          Adquira um plano para começar a acumular cashback
                        </p>
                        <Button 
                          onClick={() => {
                            // Redirecionar para planos
                            window.location.href = '/#/planos';
                          }} 
                          className="bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          📋 Ver Planos
                        </Button>
                      </div>
                    )}
                    
                    {/* Informações sobre cashback */}
                    <div className="bg-cyan-900/10 rounded-lg p-4 border border-cyan-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-[var(--neon-cyan)]" />
                        <span className="text-sm font-semibold text-[var(--neon-cyan)]">Sistema de Cashback</span>
                      </div>
                      <div className="space-y-2 text-xs text-gray-400">
                        <div>• Explorador (R$ 7): 5% cashback + 3% extra</div>
                        <div>• Conector (R$ 14): 10% cashback + 4% extra</div>
                        <div>• Orbit Pro (R$ 21): 15% cashback + 5% extra</div>
                        <div>• Orbit Max (R$ 30): 20% cashback + 5% extra</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Não foi possível carregar os dados da carteira</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg text-gray-300 mb-2">📋 Histórico de Transações</h3>
                  <p className="text-sm text-gray-400">Todas as movimentações da sua carteira</p>
                </div>
                
                <div className="text-center py-8">
                  <History className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-400 mb-2">Em Breve</h4>
                  <p className="text-sm text-gray-500">
                    O histórico detalhado de transações será implementado na próxima atualização
                  </p>
                  <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-500/20">
                    <p className="text-xs text-blue-400 mb-2">
                      O histórico incluirá:
                    </p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Compras de tokens via PIX</li>
                      <li>• Contratações de profissionais</li>
                      <li>• Tokens ganhos em jogos</li>
                      <li>• Cashback mensal acumulado</li>
                      <li>• Saques realizados</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ABA DETAILED - INFORMAÇÕES DETALHADAS */}
            {activeTab === 'detailed' && (
              <div className="space-y-4">
                {isLoadingDetailed ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-400">Carregando informações...</p>
                  </div>
                ) : walletDetailed ? (
                  <>
                    {/* Header com informações do usuário */}
                    <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 p-4 rounded-lg border border-blue-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <Info className="h-5 w-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-white">Informações da Conta</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">Nome:</span>
                          <p className="text-white font-medium">{walletDetailed.userName}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Plano:</span>
                          <p className="text-blue-400 font-medium">{walletDetailed.userPlan.toUpperCase()}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Tipo:</span>
                          <p className="text-gray-300">{walletDetailed.userType}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Total Tokens:</span>
                          <p className="text-blue-400 font-bold">{walletDetailed.tokens.total.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Distribuição de tokens */}
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
                      <h4 className="text-md font-semibold text-white mb-3">Distribuição de Tokens</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-purple-400">Tokens Comprados:</span>
                          <span className="text-purple-400 font-bold">{walletDetailed.tokens.comprados.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-400">Tokens de Planos:</span>
                          <span className="text-cyan-400 font-bold">{walletDetailed.tokens.planos.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-400">Tokens Ganhos:</span>
                          <span className="text-green-400 font-bold">{walletDetailed.tokens.ganhos.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Informações financeiras */}
                    <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                      <h4 className="text-md font-semibold text-yellow-400 mb-3">Resumo Financeiro</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">Total Investido:</span>
                          <p className="text-yellow-400 font-bold">R$ {walletDetailed.financeiro.totalInvestido}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Valor Planos:</span>
                          <p className="text-yellow-400 font-bold">R$ {walletDetailed.financeiro.valorPlanosGastos.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Plano Ativo:</span>
                          <p className={walletDetailed.financeiro.planoAtivo ? "text-green-400" : "text-red-400"}>
                            {walletDetailed.financeiro.planoAtivo ? "SIM" : "NÃO"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Dias Restantes:</span>
                          <p className="text-cyan-400 font-bold">{walletDetailed.financeiro.diasRestantes}</p>
                        </div>
                      </div>
                    </div>

                    {/* Sistema de cashback */}
                    {walletDetailed.cashback.elegivel && (
                      <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                        <h4 className="text-md font-semibold text-green-400 mb-3">Sistema de Cashback</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Percentual Mensal:</span>
                            <span className="text-green-400 font-bold">{walletDetailed.cashback.percentualMensal}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Próximo Pagamento:</span>
                            <span className="text-green-400">{walletDetailed.cashback.proximoPagamento}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Estimativa Mensal:</span>
                            <span className="text-green-400 font-bold">R$ {walletDetailed.cashback.estimativaMensal}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Estatísticas de uso */}
                    <div className="bg-indigo-500/10 p-4 rounded-lg border border-indigo-500/30">
                      <h4 className="text-md font-semibold text-indigo-400 mb-3">Estatísticas de Uso</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">Jogos Jogados:</span>
                          <p className="text-indigo-400 font-bold">{walletDetailed.estatisticas.jogosJogados}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Tokens do Jogo:</span>
                          <p className="text-indigo-400 font-bold">{walletDetailed.estatisticas.tokensGanhosJogos}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Serviços Contratados:</span>
                          <p className="text-indigo-400 font-bold">{walletDetailed.estatisticas.servicosContratados}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Profissionais:</span>
                          <p className="text-indigo-400 font-bold">{walletDetailed.estatisticas.profissionaisConectados}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-400 mb-2">Informações Indisponíveis</h3>
                    <p className="text-sm text-gray-500">Não foi possível carregar os detalhes da carteira</p>
                  </div>
                )}
              </div>
            )}

            {/* ABA TRANSACTIONS - HISTÓRICO DE TRANSAÇÕES */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                {isLoadingTransactions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-400">Carregando transações...</p>
                  </div>
                ) : transactions?.transactions?.length > 0 ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <Coins className="h-5 w-5 text-yellow-400" />
                      <h3 className="text-lg font-bold text-white">Histórico de Transações</h3>
                      <span className="text-xs bg-yellow-500/20 border border-yellow-400 px-2 py-1 rounded text-yellow-300">
                        {transactions.total} transações
                      </span>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {transactions.transactions.map((transaction: any) => (
                        <div key={transaction.id} className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-sm font-semibold text-white">{transaction.descricao}</h4>
                              <p className="text-xs text-gray-400">
                                {new Date(transaction.data).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-yellow-400">{transaction.valor}</p>
                              {transaction.tokens > 0 && (
                                <p className="text-xs text-gray-400">{transaction.tokens.toLocaleString()} tokens</p>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`text-xs px-2 py-1 rounded ${
                              transaction.tipo === 'compra_tokens' ? 'bg-purple-500/20 text-purple-400' :
                              transaction.tipo === 'assinatura_plano' ? 'bg-cyan-500/20 text-cyan-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {transaction.tipo.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`text-xs ${
                              transaction.status === 'concluido' ? 'text-green-400' :
                              transaction.status === 'ativo' ? 'text-blue-400' : 'text-gray-400'
                            }`}>
                              {transaction.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-400 mb-2">Nenhuma Transação</h3>
                    <p className="text-sm text-gray-500">Você ainda não possui transações registradas</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}