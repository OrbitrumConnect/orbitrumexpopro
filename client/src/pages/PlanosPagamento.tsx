import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, QrCode, Sparkles, Crown, Star, Zap, ArrowLeft, CreditCard } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { DocumentVerificationModal } from '@/components/document-verification-modal';

interface Plan {
  id: string;
  name: string;
  price: number;
  tokens: number;
  yield: number;
  bonus: number;
  features: string[];
  icon: any;
  color: string;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'explorador',
    name: 'Explorador',
    price: 7.00,
    tokens: 7000,
    yield: 0,
    bonus: 0,
    features: ['3 times/mês', '5 mensagens/mês', 'Acesso aos jogos', 'Plano entrada', 'Exploração básica'],
    icon: Sparkles,
    color: 'bg-blue-500',
    highlight: false
  },
  {
    id: 'conector', 
    name: 'Conector',
    price: 14.00,
    tokens: 14000,
    yield: 2,
    bonus: 2.7,
    features: ['5 times/mês', '15 mensagens/mês', 'Cashback 2%', 'Saque 2,7%', 'Conexões moderadas'],
    icon: Star,
    color: 'bg-purple-500',
    highlight: false
  },
  {
    id: 'orbitrumPro',
    name: 'Orbitrum Pro',
    price: 21.00,
    tokens: 21000,
    yield: 4.5,
    bonus: 5.5,
    features: ['8 times/mês', '30 mensagens/mês', '3 jogos/dia', 'Cashback 4,5%', 'Saque 5,5%'],
    icon: Crown,
    color: 'bg-cyan-500',
    highlight: true
  },
  {
    id: 'orbitrumMax',
    name: 'Orbitrum Max',
    price: 30.00,
    tokens: 30000,
    yield: 8.7,
    bonus: 8.7,
    features: ['Times ilimitados', 'Mensagens ilimitadas', 'Jogos full', 'Cashback 8,7%', 'Saque 8,7%'],
    icon: Zap,
    color: 'bg-green-500',
    highlight: false
  }
];

export default function PlanosPagamento() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'generating' | 'waiting' | 'confirmed'>('idle');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const { toast } = useToast();

  const generatePixMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/payment/generate-pix', { 
        plan: planId,
        provider: 'mercadopago' 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setPixData(data);
      setPaymentStatus('waiting');
      toast({
        title: "PIX Gerado com Sucesso",
        description: "Escaneie o QR Code ou copie a chave PIX para efetuar o pagamento.",
      });
    },
    onError: (error: Error) => {
      // VERIFICAR SE É ERRO DE DOCUMENTOS NÃO VERIFICADOS
      if (error.message.includes("Documentos não verificados") || error.message.includes("DOCUMENTS_NOT_VERIFIED")) {
        toast({
          title: "Documentos Pendentes", 
          description: "Para comprar planos, você precisa verificar seus documentos primeiro.",
          variant: "destructive"
        });
        
        // Mostrar modal personalizado após 2 segundos
        setTimeout(() => {
          setShowDocumentModal(true);
        }, 1500);
      } else {
        toast({
          title: "Erro ao Gerar PIX",
          description: "Não foi possível gerar o PIX. Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
      }
      setPaymentStatus('idle');
    }
  });

  const checkPaymentMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await apiRequest('POST', '/api/payment/check-status', { transactionId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === 'confirmed') {
        setPaymentStatus('confirmed');
        toast({
          title: "Pagamento Confirmado!",
          description: `Plano ${selectedPlan?.name} ativado com sucesso. ${selectedPlan?.tokens.toLocaleString()} tokens creditados.`,
        });
        setTimeout(() => window.location.href = '/', 3000);
      }
    }
  });

  const copyPixKey = () => {
    if (pixData?.pixKey) {
      navigator.clipboard.writeText(pixData.pixKey);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Chave PIX copiada para a área de transferência",
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const selectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setPixData(null);
    setPaymentStatus('idle');
  };

  const generatePix = () => {
    if (selectedPlan) {
      setPaymentStatus('generating');
      generatePixMutation.mutate(selectedPlan.id);
    }
  };

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (pixData?.transactionId && paymentStatus === 'waiting') {
      const interval = setInterval(() => {
        checkPaymentMutation.mutate(pixData.transactionId);
      }, 8000); // Verifica a cada 8 segundos

      return () => clearInterval(interval);
    }
  }, [pixData?.transactionId, paymentStatus]);

  if (paymentStatus === 'confirmed') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-900/50 border-green-500">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-white text-2xl">Pagamento Confirmado!</CardTitle>
            <CardDescription className="text-green-400">
              Plano {selectedPlan?.name} ativado com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <p className="text-gray-300 mb-2">Tokens creditados:</p>
              <p className="text-cyan-400 text-2xl font-bold">
                {selectedPlan?.tokens.toLocaleString()}
              </p>
            </div>
            <p className="text-gray-400 text-sm">
              Redirecionando para o app em 3 segundos...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-black p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao App</span>
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Orbitrum Connect
            </h1>
            <p className="text-gray-300 text-lg">
              Escolha seu plano e desbloqueie o poder completo
            </p>
            <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-200 text-sm">
                <strong>⚠️ IMPORTANTE:</strong> Plataforma de networking profissional. 
                Tokens e cashbacks são benefícios de uso, não produtos financeiros.
                <span className="text-xs block mt-1">✅ Sistema 100% conforme CVM e LGPD - Atualizado 17/07/2025</span>
              </p>
            </div>
          </div>
          <div className="w-24"></div> {/* Spacer */}
        </div>

        {!selectedPlan ? (
          // Grade de planos
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const IconComponent = plan.icon;
              return (
                <Card 
                  key={plan.id}
                  className={`relative bg-gray-900/50 border-gray-700 hover:border-cyan-400 transition-all duration-300 cursor-pointer hover:scale-105 ${
                    plan.highlight ? 'ring-2 ring-cyan-400' : ''
                  }`}
                  onClick={() => selectPlan(plan)}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-cyan-500 text-white px-3 py-1">
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 rounded-full ${plan.color} flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-cyan-400">
                        R$ {plan.price.toFixed(2)}
                      </span>
                      <span className="text-gray-400">/mês</span>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Tokens:</span>
                        <span className="text-cyan-400 font-bold">{plan.tokens.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Benefícios:</span>
                        <span className="text-green-400 font-bold">Inclusos</span>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-400 flex items-center">
                          <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Button className={`w-full ${plan.highlight ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Escolher Plano
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : paymentStatus === 'idle' || paymentStatus === 'generating' ? (
          // Confirmação do plano
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader className="text-center">
                <CardTitle className="text-white text-2xl">
                  Confirmar Plano {selectedPlan.name}
                </CardTitle>
                <CardDescription>
                  Revise os detalhes do seu plano antes de prosseguir com o pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-800/50 p-6 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400">Plano:</span>
                      <p className="text-white font-bold">{selectedPlan.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Valor:</span>
                      <p className="text-cyan-400 font-bold">R$ {selectedPlan.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Tokens:</span>
                      <p className="text-white font-bold">{selectedPlan.tokens.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Benefícios:</span>
                      <p className="text-green-400 font-bold">Conforme plano</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setSelectedPlan(null)}
                    disabled={paymentStatus === 'generating'}
                  >
                    Voltar
                  </Button>
                  <Button 
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    onClick={generatePix}
                    disabled={paymentStatus === 'generating'}
                  >
                    {paymentStatus === 'generating' ? 'Gerando PIX...' : 'Gerar PIX'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Tela de pagamento PIX
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader className="text-center">
                <CardTitle className="text-white text-2xl">
                  Pagamento PIX
                </CardTitle>
                <CardDescription>
                  Efetue o pagamento para ativar seu plano {selectedPlan.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-800/50 p-6 rounded-lg text-center">
                  <QrCode className="w-32 h-32 text-cyan-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    Escaneie o QR Code abaixo ou copie a chave PIX
                  </p>
                  
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">Chave PIX (Copia e Cola):</p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-sm text-white bg-gray-900 p-3 rounded break-all">
                        {pixData?.pixKey || pixData?.qrCodeBase64 || 'Gerando...'}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyPixKey}
                        disabled={!pixData?.pixKey}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-400">
                    <p><strong>Valor:</strong> R$ {selectedPlan.price.toFixed(2)}</p>
                    <p><strong>Válido por:</strong> 30 minutos</p>
                  </div>
                </div>

                <div className="text-center">
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400 animate-pulse">
                    Aguardando pagamento...
                  </Badge>
                  <p className="text-gray-400 text-sm mt-2">
                    Verificando automaticamente. Seu plano será ativado assim que o pagamento for confirmado.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => {
                      setPixData(null);
                      setSelectedPlan(null);
                      setPaymentStatus('idle');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => checkPaymentMutation.mutate(pixData.transactionId)}
                    disabled={checkPaymentMutation.isPending}
                  >
                    {checkPaymentMutation.isPending ? 'Verificando...' : 'Verificar Pagamento'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Modal de Verificação de Documentos */}
      <DocumentVerificationModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onConfirm={() => {
          setShowDocumentModal(false);
          window.location.href = '/verificacao-documentos';
        }}
      />
    </div>
  );
}