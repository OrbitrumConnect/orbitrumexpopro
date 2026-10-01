import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Star, Zap, Crown, Shield, Calculator, TrendingUp, FileText, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePlanValidation } from "@/hooks/usePlanValidation";

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin?: () => void;
}

// Dados dos planos - Sistema de Cashback (conforme dossiê oficial)
const planos = {
  freeOrbitrum: {
    preco: 0,
    creditosIniciais: 0,
    cashbackMensal: 0,
    bonusJogoMax: 0,
    limiteGameMensal: 0,
    timesMes: 0,
    mensagensMes: 0,
    limitacoes: {
      planetasPorDia: 2, // 2 planetas a cada 3 dias
      buscasIAMensal: 10, // 10 buscas IA por mês
      perfisPorDia: 1,
      mensagensRecebidasMensal: 2,
      podeEnviarMensagens: false,
      acessoDashboard: "basico",
      semCashback: true,
      semRelatorios: true,
      semDestaque: true
    }
  },
  explorador: { 
    preco: 7, 
    creditosIniciais: 7000, 
    cashbackMensal: 0,        // Sem cashback (conforme dossiê)
    bonusJogoMax: 0,          // Sem bônus
    limiteGameMensal: 0,      // Sem limite específico
    timesMes: 3,              // 3 times por mês
    mensagensMes: 5           // 5 mensagens por mês
  },
  conector: { 
    preco: 14, 
    creditosIniciais: 14000, 
    cashbackMensal: 0.02,     // 2% cashback (conforme dossiê)
    bonusJogoMax: 0.027,      // Saque 2.7% (conforme dossiê)
    limiteGameMensal: 0.02,   // 2% limite mensal
    timesMes: 5,              // 5 times por mês
    mensagensMes: 15          // 15 mensagens por mês
  },
  orbitrumPro: { 
    preco: 21, 
    creditosIniciais: 21000, 
    cashbackMensal: 0.045,    // 4.5% cashback (conforme dossiê)
    bonusJogoMax: 0.055,      // Saque 5.5% (conforme dossiê)
    limiteGameMensal: 0.045,  // 4.5% limite mensal
    timesMes: 8,              // 8 times por mês
    mensagensMes: 30,         // 30 mensagens por mês
    jogosPorDia: 3            // 3 jogos por dia (conforme dossiê)
  },
  orbitrumMax: { 
    preco: 30, 
    creditosIniciais: 30000, 
    cashbackMensal: 0.087,    // 8.7% cashback mensal (conforme dossiê)
    bonusJogoMax: 0.087,      // Saque 8.7% (conforme dossiê)
    limiteGameMensal: 0.087,  // 8.7% limite mensal
    timesMes: -1,             // Ilimitado
    mensagensMes: -1,         // Ilimitado
    jogosPorDia: -1           // Full (conforme dossiê)
  }
};

// Função para calcular cashback mensal máximo
function cashbackMensalMaximo(plano: typeof planos.orbitrumMax) {
  return Math.round(plano.creditosIniciais * plano.cashbackMensal);
}

// Função para calcular bônus máximo por atividade
function bonusAtividadeMaximo(plano: typeof planos.orbitrumMax) {
  return Math.round(plano.creditosIniciais * plano.bonusJogoMax);
}

// Função para calcular limite mensal de atividade
function limiteAtividadeMensal(plano: typeof planos.orbitrumMax) {
  return Math.round(plano.creditosIniciais * plano.limiteGameMensal);
}

export function PlansModal({ isOpen, onClose, onOpenLogin }: PlansModalProps) {
  const [activeTab, setActiveTab] = useState<'plans' | 'rules'>('plans');
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const { canPurchase, reason, daysRemaining } = usePlanValidation();

  const planData = [
    {
      id: "freeOrbitrum",
      name: "Free Orbitrum",
      price: "R$ 0,00",
      period: "/mês",
      credits: "0",
      data: planos.freeOrbitrum,
      icon: () => <span className="text-2xl">🚀</span>,
      features: [
        "2 planetas a cada 3 dias",
        "10 buscas IA por mês",
        "1 perfil por dia",
        "2 mensagens recebidas/mês",
        "Dashboard básico"
      ],
      color: "from-cyan-400 to-cyan-500",
      borderColor: "border-cyan-400",
      popular: false,
      description: "Explore a galáxia profissional gratuitamente"
    },
    {
      id: "explorador",
      name: "Start",
      price: "R$ 7,00",
      period: "/mês",
      credits: "7.000",
      data: planos.explorador,
      icon: Shield,
      features: [
        "7.000 créditos iniciais",
        "3 times por mês",
        "5 mensagens por mês",
        "Acesso aos jogos",
        "Plano entrada"
      ],
      color: "from-gray-500 to-gray-600",
      borderColor: "border-gray-500",
      popular: false,
      description: "Plano entrada para explorar"
    },
    {
      id: "conector",
      name: "Conector",
      price: "R$ 14,00",
      period: "/mês",
      credits: "14.000",
      data: planos.conector,
      icon: Star,
      features: [
        "14.000 créditos iniciais",
        "5 times por mês",
        "15 mensagens por mês",
        "Cashback: 2%",
        "Saque: 2,7%"
      ],
      color: "from-blue-500 to-cyan-500",
      borderColor: "border-blue-400",
      popular: true,
      description: "Conexões moderadas"
    },
    {
      id: "orbitrumPro",
      name: "Orbitrum Pro",
      price: "R$ 21,00",
      period: "/mês",
      credits: "21.000",
      data: planos.orbitrumPro,
      icon: Zap,
      features: [
        "21.000 créditos iniciais",
        "8 times por mês",
        "30 mensagens por mês",
        "3 jogos por dia",
        "Cashback: 4,5% | Saque: 5,5%"
      ],
      color: "from-purple-500 to-pink-500",
      borderColor: "border-purple-400",
      popular: false,
      description: "Profissional avançado"
    },
    {
      id: "orbitrumMax",
      name: "Orbitrum Max",
      price: "R$ 30,00",
      period: "/mês",
      credits: "30.000",
      data: planos.orbitrumMax,
      icon: Crown,
      features: [
        "30.000 créditos iniciais",
        "Times ilimitados",
        "Mensagens ilimitadas",
        "Jogos full",
        "Cashback: 8,7% | Saque: 8,7%"
      ],
      color: "from-yellow-500 to-orange-500",
      borderColor: "border-yellow-400",
      popular: false,
      description: "Máximo poder orbital"
    }
  ];

  const calculateCashbackData = (plano: typeof planos.orbitrumMax) => {
    return {
      cashbackMensal: cashbackMensalMaximo(plano),
      bonusAtividade: bonusAtividadeMaximo(plano),
      limiteAtividade: limiteAtividadeMensal(plano)
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glassmorphism rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold neon-text">Orbitrum</h2>
                <p className="text-gray-300 text-sm mt-1">Plataforma de intermediação profissional</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex justify-center mb-6">
              <div className="glassmorphism rounded-lg p-1 flex space-x-1">
                <Button
                  variant={activeTab === 'plans' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('plans')}
                  className={`px-6 py-2 text-sm ${
                    activeTab === 'plans' 
                      ? 'neon-button' 
                      : 'text-gray-400 hover:text-white bg-transparent'
                  }`}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Planos
                </Button>
                <Button
                  variant={activeTab === 'rules' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('rules')}
                  className={`px-6 py-2 text-sm ${
                    activeTab === 'rules' 
                      ? 'neon-button' 
                      : 'text-gray-400 hover:text-white bg-transparent'
                  }`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Regras
                </Button>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'plans' ? (
              <>
                {/* Status Notice */}
                <div className="bg-blue-500 bg-opacity-20 border border-blue-400 rounded-lg p-3 mb-6">
                  <p className="text-blue-300 text-sm font-semibold text-center">
                    BETA
                  </p>
                </div>

            {/* BLOQUEIO DE PLANO - Aviso quando usuário tem plano ativo */}
            {isAuthenticated && user?.plan !== 'free' && !canPurchase && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-red-400" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-400">Plano Ativo - Compra Bloqueada</h3>
                    <p className="text-sm text-gray-300">{reason}</p>
                    {daysRemaining && (
                      <p className="text-xs text-gray-400 mt-1">
                        {daysRemaining} dias restantes até poder adquirir um novo plano
                      </p>
                    )}
                    <p className="text-xs text-cyan-400 mt-2">
                      💡 Você pode comprar tokens extras na loja "+Tokens"
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    onClick={() => {
                      onClose();
                      // Navegar para loja de tokens
                      const tokensTab = document.querySelector('[data-tab="tokens"]') as HTMLElement;
                      if (tokensTab) {
                        tokensTab.click();
                      }
                    }}
                  >
                    Ver +Tokens
                  </Button>
                </div>
              </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {planData.map((plan) => {
                const Icon = plan.icon;
                const cashbackData = calculateCashbackData(plan.data as any);
                
                return (
                  <motion.div
                    key={plan.id}
                    className={`relative glassmorphism rounded-xl p-4 border-2 ${plan.borderColor} ${
                      plan.popular ? 'ring-2 ring-cyan-400 ring-opacity-50' : ''
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          MAIS POPULAR
                        </span>
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className="text-center mb-4">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-lg neon-text">{plan.name}</h3>
                      <div className="flex items-baseline justify-center">
                        <span className="text-2xl font-bold text-white">{plan.price}</span>
                        <span className="text-sm text-gray-400 ml-1">{plan.period}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{plan.description}</p>
                      <p className="text-xs text-cyan-400 mt-1">Tokens para uso da plataforma apenas</p>
                    </div>

                    {/* Credits Display */}
                    <div className="bg-black bg-opacity-30 rounded-lg p-3 mb-4">
                      <div className="text-center mb-2">
                        <div className="text-[var(--neon-cyan)] font-bold text-xl">{plan.credits}</div>
                        <div className="text-xs text-gray-400">créditos iniciais</div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-gray-300">
                          <span>Cashback mensal:</span>
                          <span className="text-green-400 font-semibold">{cashbackData.cashbackMensal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Bônus atividade:</span>
                          <span className="text-yellow-400 font-semibold">{cashbackData.bonusAtividade.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Limite mensal:</span>
                          <span className="text-cyan-400 font-semibold">{cashbackData.limiteAtividade.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-1.5 mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-xs">
                          <Check className="h-3 w-3 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <Button
                      className={`w-full ${plan.popular ? 'neon-button' : 'bg-white bg-opacity-10 hover:bg-opacity-20'}`}
                      size="sm"
                      onClick={() => {
                        console.log('🔍 CLICK PLAN - User Plan:', user?.plan, 'Button Plan:', plan.id, 'Are Equal:', user?.plan === plan.id);
                        
                        if (!isAuthenticated) {
                          // Usuário não logado - direcionar para login
                          console.log('🔐 Usuário não logado - direcionando para login');
                          onClose();
                          onOpenLogin?.();
                        } else if (user?.plan === plan.id) {
                          // Usuário já tem esse plano
                          console.log('✅ Usuário já possui este plano:', plan.id);
                          toast({
                            title: "Plano Atual",
                            description: `Você já possui o plano ${plan.name}.`,
                          });
                        } else {
                          // BLOQUEIO TOTAL: Verificar se pode comprar novo plano
                          if (!canPurchase) {
                            toast({
                              title: "Plano Ativo - Compra Bloqueada",
                              description: reason || `Você possui um plano ativo. Novos planos só podem ser adquiridos após a expiração completa.`,
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          console.log('✅ Usuário pode comprar - direcionando para pagamento:', plan.id);
                          onClose();
                          window.location.href = `/pagamento?plano=${plan.id}`;
                        }
                      }}
                    >
                      {!isAuthenticated ? (
                        <div className="flex items-center justify-center text-white">
                          <LogIn className="h-4 w-4 mr-2" />
                          <span className="font-semibold">Fazer Login</span>
                        </div>
                      ) : user?.plan === plan.id ? (
                        <div className="flex items-center justify-center">
                          ✅ Plano Atual
                        </div>
                      ) : !canPurchase && user?.plan !== 'free' ? (
                        <div className="flex items-center justify-center text-gray-400">
                          🔒 Bloqueado
                        </div>
                      ) : (
                        'Selecionar Plano'
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            {/* Cashback Rules & Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="glassmorphism rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
                  <span className="font-semibold text-white">Sistema de Cashback</span>
                </div>
                <p className="text-gray-300">Cashback baseado no uso da plataforma. Máximo 8,7% ao mês conforme atividade.</p>
              </div>
              <div className="glassmorphism rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Zap className="h-5 w-5 text-yellow-400 mr-2" />
                  <span className="font-semibold text-white">Regras de Atividade</span>
                </div>
                <p className="text-gray-300">50s por partida, 17+ acertos ganham bônus, 3 atividades/dia máximo</p>
              </div>
              <div className="glassmorphism rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Star className="h-5 w-5 text-cyan-400 mr-2" />
                  <span className="font-semibold text-white">Benefícios</span>
                </div>
                <p className="text-gray-300">Créditos nunca expiram. Cashback baseado em engajamento real.</p>
              </div>
            </div>
              </>
            ) : (
              /* Rules Tab Content */
              <div className="max-h-[70vh] overflow-y-auto">
                <div className="glassmorphism rounded-lg p-6">
                  <h3 className="text-2xl font-bold neon-text mb-4 text-center">
                    Termos e Regras da Plataforma
                  </h3>
                  
                  <div className="space-y-6 text-gray-300">
                    {/* 1. Introdução */}
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">1. Introdução</h4>
                      <p className="text-sm leading-relaxed">
                        A Orbitrum Services ("plataforma") é uma ferramenta digital que conecta usuários a profissionais 
                        autônomos que oferecem diversos serviços especializados. Nosso papel é oferecer infraestrutura, sistema 
                        de créditos (tokens) e ferramentas para facilitar essa conexão, sem prestar os serviços profissionais 
                        diretamente.
                      </p>
                    </div>

                    {/* 2. Papel da Plataforma */}
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">2. Papel da Plataforma e Limitações</h4>
                      <ul className="text-sm space-y-2 leading-relaxed">
                        <li>• A plataforma atua exclusivamente como intermediadora, não sendo prestadora direta dos serviços.</li>
                        <li>• Não garantimos nem prometemos resultados, lucros, qualidade ou cumprimento dos serviços contratados.</li>
                        <li>• Toda negociação, contratação, entrega e pagamento dos serviços é feita diretamente entre o usuário e o profissional.</li>
                        <li>• A plataforma não se responsabiliza por qualquer dano, perda, inadimplência ou insatisfação decorrente da relação entre usuário e profissional.</li>
                        <li>• Reservamo-nos o direito de suspender ou banir usuários e profissionais que violem os termos, pratiquem fraudes, condutas abusivas, ilegais ou prejudiquem terceiros.</li>
                      </ul>
                    </div>

                    {/* 3. Uso dos Tokens */}
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">3. Uso dos Tokens</h4>
                      <ul className="text-sm space-y-2 leading-relaxed">
                        <li>• Tokens são créditos virtuais para acessar funcionalidades e serviços dentro da plataforma, como contato, agendamento, consultorias e cursos.</li>
                        <li>• O custo em tokens corresponde ao uso da plataforma, não ao pagamento pelo serviço profissional em si.</li>
                        <li>• Tokens não são moeda corrente e não podem ser trocados por dinheiro fora das regras internas da plataforma.</li>
                        <li>• Tokens adquiridos podem expirar conforme regras do plano contratado, com aviso prévio ao usuário.</li>
                        <li>• Não nos responsabilizamos por perdas de tokens devido a expiração, mau uso ou violação das regras.</li>
                      </ul>
                    </div>

                    {/* 4. Sistema de Jogos e Tokens */}
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">4. Sistema de Jogos e Tokens</h4>
                      <ul className="text-sm space-y-2 leading-relaxed">
                        <li>• <strong>Custo de Entrada:</strong> Cada partida consome 250 tokens diretamente da carteira do plano ativo.</li>
                        <li>• <strong>Objetivo do Jogo:</strong> Alcançar 350 tokens ou mais durante a partida para ganhar o prêmio.</li>
                        <li>• <strong>Prêmio por Vitória:</strong> Tokens ganhos acima de 350 são depositados na carteira do plano e contam para o cashback mensal.</li>
                        <li>• <strong>Regra de Perda:</strong> Caso não atinja 350 tokens, os 250 tokens de entrada são perdidos definitivamente.</li>
                        <li>• <strong>Origem dos Tokens:</strong> Apenas tokens da carteira do plano podem ser usados (não tokens comprados).</li>
                        <li>• <strong>Limite Diário:</strong> Máximo de 3 partidas por dia para evitar uso excessivo.</li>
                        <li>• <strong>Natureza Recreativa:</strong> Os jogos são atividades de entretenimento e engajamento, não investimento.</li>
                        <li>• Usuários podem adquirir tokens adicionais para uso extra, que também estão sujeitos às mesmas regras.</li>
                      </ul>
                    </div>

                    {/* 4. Conduta e Responsabilidade */}
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">4. Conduta e Responsabilidade</h4>
                      <ul className="text-sm space-y-2 leading-relaxed">
                        <li>• Usuários e profissionais devem agir com honestidade, boa-fé e respeito às leis vigentes.</li>
                        <li>• É proibido usar a plataforma para atividades ilícitas, fraudulentas, abusivas ou que violem direitos de terceiros.</li>
                        <li>• A plataforma pode coletar dados para garantir a segurança, prevenir fraudes e garantir o bom uso do sistema.</li>
                        <li>• Denúncias e reclamações serão avaliadas, e medidas poderão ser tomadas, inclusive suspensão ou exclusão de contas.</li>
                      </ul>
                    </div>

                    {/* 5. Privacidade e Proteção de Dados */}
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">5. Privacidade e Proteção de Dados</h4>
                      <ul className="text-sm space-y-2 leading-relaxed">
                        <li>• Tratamos dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD).</li>
                        <li>• Dados coletados serão usados para operação da plataforma, comunicação e melhoria do serviço.</li>
                        <li>• Usuários têm direito de acesso, correção, exclusão e portabilidade de seus dados, mediante solicitação.</li>
                        <li>• A política completa de privacidade está disponível no app.</li>
                      </ul>
                    </div>

                    {/* 6. Planos, Pagamentos e Reembolsos */}
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">6. Planos, Pagamentos e Reembolsos</h4>
                      <ul className="text-sm space-y-2 leading-relaxed">
                        <li>• Os valores e benefícios de cada plano são claramente informados no app.</li>
                        <li>• A plataforma pode alterar planos, preços e condições, com aviso prévio aos usuários.</li>
                        <li>• Reembolsos, quando aplicáveis, seguem a política descrita no app, respeitando legislação vigente.</li>
                        <li>• Limites de saque, cashback e outras regras financeiras são detalhados no app.</li>
                      </ul>
                    </div>

                    {/* 7. Segurança e Comunicação */}
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">7. Segurança e Comunicação</h4>
                      <ul className="text-sm space-y-2 leading-relaxed">
                        <li>• Recomendamos que usuários e profissionais usem as ferramentas de comunicação da plataforma para maior segurança.</li>
                        <li>• Não nos responsabilizamos por comunicações fora da plataforma ou por acordos realizados diretamente entre as partes.</li>
                        <li>• Medidas de segurança serão adotadas para proteger dados e prevenir acessos não autorizados.</li>
                      </ul>
                    </div>

                    {/* 8. Vigência, Alterações e Aceitação */}
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">8. Vigência, Alterações e Aceitação</h4>
                      <ul className="text-sm space-y-2 leading-relaxed">
                        <li>• Estes termos vigorarão enquanto o usuário utilizar a plataforma.</li>
                        <li>• Alterações serão comunicadas com antecedência, e a continuidade do uso implicará aceitação.</li>
                        <li>• Em caso de discordância, o usuário deve cessar o uso da plataforma.</li>
                      </ul>
                    </div>

                    {/* 9. Disposições Gerais */}
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">9. Disposições Gerais</h4>
                      <ul className="text-sm space-y-2 leading-relaxed">
                        <li>• Estes termos são regidos pelas leis brasileiras.</li>
                        <li>• Qualquer litígio será solucionado preferencialmente por mediação, ou no foro da comarca do usuário.</li>
                        <li>• A plataforma reserva-se o direito de modificar funcionalidades e serviços a qualquer momento.</li>
                      </ul>
                    </div>

                    {/* Aceitação */}
                    <div className="bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-4 mt-6">
                      <p className="text-red-300 text-sm font-semibold text-center">
                        Ao usar a plataforma Orbitrum Services, você reconhece e aceita integralmente estes termos e regras.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}