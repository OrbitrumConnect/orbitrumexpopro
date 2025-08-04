import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { 
  Coins, 
  Zap, 
  Star, 
  Sparkles, 
  Crown, 
  ShoppingCart,
  Info,
  ArrowRight,
  CheckCircle,
  Clock
} from "lucide-react";

interface TokenPackage {
  id: string;
  name: string;
  price: number;
  baseTokens: number;
  bonusTokens: number;
  totalTokens: number;
  icon: React.ReactNode;
  popular?: boolean;
  badge?: string;
  savings?: string;
}

const tokenPackages: TokenPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    price: 3,
    baseTokens: 1800,
    bonusTokens: 600,
    totalTokens: 2400,
    icon: <Coins className="w-6 h-6" />,
    badge: "Básico"
  },
  {
    id: "pro",
    name: "Pro Boost",
    price: 6,
    baseTokens: 3600,
    bonusTokens: 1650,
    totalTokens: 5250,
    icon: <Zap className="w-6 h-6" />,
    badge: "20% Bônus"
  },
  {
    id: "max",
    name: "Max Expansion",
    price: 9,
    baseTokens: 5400,
    bonusTokens: 2600,
    totalTokens: 8000,
    icon: <Star className="w-6 h-6" />,
    popular: true,
    badge: "Mais Popular",
    savings: "Economize R$ 1,50"
  },
  {
    id: "premium",
    name: "Orbit Premium",
    price: 18,
    baseTokens: 10800,
    bonusTokens: 5700,
    totalTokens: 16500,
    icon: <Sparkles className="w-6 h-6" />,
    badge: "25% Bônus",
    savings: "Economize R$ 4,50"
  },
  {
    id: "galaxy",
    name: "Galaxy Vault",
    price: 31,
    baseTokens: 18600,
    bonusTokens: 9650,
    totalTokens: 28250,
    icon: <Crown className="w-6 h-6" />,
    badge: "30% Bônus",
    savings: "Economize R$ 10,00"
  }
];

interface TokenStoreTabProps {
  user: any;
}

export function TokenStoreTab({ user }: TokenStoreTabProps) {
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Query para carteira atual
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['/api/wallet/user', user?.email],
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const response = await fetch('/api/wallet/user', {
        headers: {
          'User-Email': user.email,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    }
  });

  // Mutation para criar pagamento PIX
  const createPaymentMutation = useMutation({
    mutationFn: async (packageData: TokenPackage) => {
      return await apiRequest(`/api/payment/pix`, 'POST', JSON.stringify({
        userEmail: user.email,
        amount: packageData.price,
        tokens: packageData.totalTokens
      }));
    },
    onSuccess: (data, variables) => {
      toast({
        title: "PIX Gerado com Sucesso! 🎉",
        description: `QR Code criado para ${variables.name} - R$ ${variables.price},00`,
      });
      
      // Abrir modal de pagamento
      window.open(`/pagamento?id=${(data as any).id}`, '_blank');
      
      // Invalidar cache da carteira
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/user'] });
    },
    onError: () => {
      toast({
        title: "Erro ao Gerar PIX",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive"
      });
    }
  });

  const handlePurchase = async (packageData: TokenPackage) => {
    if (!user?.email) {
      toast({
        title: "Login Necessário",
        description: "Faça login para comprar tokens",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setSelectedPackage(packageData.id);

    try {
      await createPaymentMutation.mutateAsync(packageData);
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  const currentTokens = wallet?.saldoTotal || 0;
  const tokensComprados = wallet?.tokensComprados || 0;

  return (
    <div className="space-y-6">
      {/* Header da Loja */}
      <Card className="glassmorphism border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Loja de Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300">Saldo atual de tokens</p>
              <p className="text-2xl font-bold text-cyan-400">{currentTokens.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Tokens comprados</p>
              <p className="text-xl font-semibold text-purple-400">{tokensComprados.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
            <p className="text-cyan-400 text-sm">
              💡 <strong>Dica:</strong> Quanto maior o pacote, maior o bônus! Tokens nunca expiram.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pacotes de Tokens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokenPackages.map((pkg) => (
          <motion.div
            key={pkg.id}
            whileHover={{ scale: 1.02 }}
            className="relative"
          >
            <Card className={`glassmorphism transition-all duration-300 hover:border-cyan-400/50 ${
              pkg.popular ? 'border-yellow-400/50 shadow-yellow-400/20 shadow-lg' : 'border-gray-600/30'
            }`}>
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-yellow-500 text-black font-bold px-3">
                    ⭐ Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-3 bg-cyan-500/20 rounded-full text-cyan-400">
                    {pkg.icon}
                  </div>
                </div>
                <CardTitle className="text-lg text-white">{pkg.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-cyan-400">
                    R$ {pkg.price}
                  </div>
                  {pkg.savings && (
                    <p className="text-green-400 text-sm font-medium">
                      {pkg.savings}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Detalhes dos Tokens */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tokens base:</span>
                    <span className="text-white">{pkg.baseTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Bônus:</span>
                    <span className="text-green-400">+{pkg.bonusTokens.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-cyan-400">Total:</span>
                      <span className="text-cyan-400">{pkg.totalTokens.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Badge do pacote */}
                {pkg.badge && (
                  <Badge variant="outline" className="w-full justify-center border-cyan-400/30 text-cyan-400">
                    {pkg.badge}
                  </Badge>
                )}

                {/* Botão de Compra */}
                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={isProcessing && selectedPackage === pkg.id}
                  className={`w-full ${
                    pkg.popular 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                  } transition-all duration-300`}
                >
                  {isProcessing && selectedPackage === pkg.id ? (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      Gerando PIX...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Comprar PIX
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Informações Adicionais */}
      <Card className="glassmorphism border-gray-600/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="space-y-2 text-sm text-gray-300">
              <h4 className="font-semibold text-blue-400">Como funciona:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Pagamento instantâneo via PIX</li>
                <li>Tokens creditados automaticamente após confirmação</li>
                <li>Use tokens para contratar profissionais</li>
                <li>Tokens nunca expiram</li>
                <li>Compra mínima: R$ 3,00 (2.160 tokens)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status de Processamento */}
      {walletLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-gray-400">Carregando carteira...</span>
        </div>
      )}
    </div>
  );
}

export default TokenStoreTab;