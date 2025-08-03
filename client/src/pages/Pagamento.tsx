import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, QrCode, Sparkles, Crown, Star, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
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
}

const PLANS: Plan[] = [
  {
    id: 'basico',
    name: 'Básico',
    price: 7.00,
    tokens: 7000,
    yield: 8.7,
    bonus: 3,
    features: ['7.000 créditos iniciais', 'Benefícios mensais conforme pool', 'Bônus por atividade'],
    icon: Sparkles,
    color: 'bg-blue-500'
  },
  {
    id: 'standard', 
    name: 'Standard',
    price: 14.00,
    tokens: 14000,
    yield: 8.7,
    bonus: 4,
    features: ['14.000 créditos iniciais', 'Cashback até 8,7% mensal', 'Bônus atividade até 4%'],
    icon: Star,
    color: 'bg-purple-500'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 21.00,
    tokens: 21000,
    yield: 8.7,
    bonus: 5,
    features: ['21.000 créditos iniciais', 'Cashback até 8,7% mensal', 'Bônus atividade até 5%'],
    icon: Crown,
    color: 'bg-cyan-500'
  },
  {
    id: 'max',
    name: 'Max',
    price: 30.00,
    tokens: 30000,
    yield: 8.7,
    bonus: 5,
    features: ['30.000 créditos iniciais', 'Cashback até 8,7% mensal', 'Todos os recursos'],
    icon: Zap,
    color: 'bg-green-500'
  }
];

export default function Pagamento() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const { toast } = useToast();

  // Pegar parâmetro do plano da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('plano');
    if (planId) {
      const plan = PLANS.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
      }
    }
  }, []);

  const generatePixMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/payment/generate-pix', { plan: planId });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setPixData(data);
      toast({
        title: "PIX Gerado",
        description: "Código PIX criado com sucesso. Efetue o pagamento para ativar seu plano.",
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
          title: "Erro",
          description: "Não foi possível gerar o PIX. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  });

  const checkPaymentMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await apiRequest('POST', '/api/payment/check-status', { transactionId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === 'confirmed') {
        toast({
          title: "Pagamento Confirmado!",
          description: `Plano ${selectedPlan?.name} ativado com sucesso. ${selectedPlan?.tokens} tokens creditados.`,
        });
        // Redirecionar ou atualizar página
        setTimeout(() => window.location.href = '/', 2000);
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
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setPixData(null);
  };

  const generatePix = () => {
    if (selectedPlan) {
      generatePixMutation.mutate(selectedPlan.id);
    }
  };

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (pixData?.transactionId) {
      const interval = setInterval(() => {
        checkPaymentMutation.mutate(pixData.transactionId);
      }, 10000); // Verifica a cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [pixData?.transactionId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-black p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Pagamento PIX
          </h1>
          <p className="text-gray-300 text-lg">
            Finalize sua assinatura do Orbitrum Connect
          </p>
        </div>

        {!selectedPlan ? (
          // Plano não encontrado
          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="pt-6">
                <p className="text-white mb-4">Plano não encontrado.</p>
                <Button onClick={() => window.location.href = '/'}>
                  Voltar ao Início
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : !pixData ? (
          // Confirmação do plano
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader className="text-center">
                <CardTitle className="text-white text-2xl">
                  Confirmar Plano {selectedPlan.name}
                </CardTitle>
                <CardDescription>
                  Revise os detalhes do seu plano antes de prosseguir
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
                      <span className="text-gray-400">Cashback:</span>
                      <p className="text-green-400 font-bold">Até 8,7% mensal</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => window.history.back()}
                  >
                    Voltar
                  </Button>
                  <Button 
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    onClick={generatePix}
                    disabled={generatePixMutation.isPending}
                  >
                    {generatePixMutation.isPending ? 'Gerando PIX...' : 'Gerar PIX'}
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
                  {pixData.qrCodeBase64 ? (
                    <div className="mb-4">
                      <img 
                        src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                        alt="QR Code PIX"
                        className="w-32 h-32 mx-auto mb-4 border border-gray-600 rounded"
                      />
                      <p className="text-gray-400 mb-4">
                        Escaneie o QR Code ou copie a chave PIX
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <QrCode className="w-32 h-32 text-gray-500 mx-auto mb-4 opacity-50" />
                      <p className="text-yellow-400 mb-4 text-sm">
                        QR Code não disponível - use a chave PIX abaixo
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400">Chave PIX:</p>
                      {pixData.fallback && (
                        <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                          Direto
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-sm text-white bg-gray-900 p-2 rounded">
                        {pixData.pixKey || 'empresa@orbitrum.com'}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyPixKey}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="mt-3 p-3 bg-cyan-900/30 rounded border-l-2 border-cyan-500">
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Valor:</span>
                          <span className="text-cyan-400 font-semibold">R$ {selectedPlan.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">ID da Transação:</span>
                          <span className="text-white font-mono text-xs">{pixData.transactionId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400">
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