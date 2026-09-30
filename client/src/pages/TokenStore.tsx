import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Coins, Zap, Star, Sparkles, Crown, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { DocumentVerificationModal } from "@/components/document-verification-modal";
import Sidebar from "@/components/Sidebar";

interface TokenPackage {
  id: string;
  name: string;
  price: number;
  baseTokens: number;
  bonusTokens: number;
  totalTokens: number;
  icon: React.ReactNode;
  popular?: boolean;
}

const tokenPackages: TokenPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    price: 3,
    baseTokens: 1800,
    bonusTokens: 600,
    totalTokens: 2400,
    icon: <Coins className="w-6 h-6" />
  },
  {
    id: "pro",
    name: "Pro Boost",
    price: 6,
    baseTokens: 3600,
    bonusTokens: 1650,
    totalTokens: 5250,
    icon: <Zap className="w-6 h-6" />
  },
  {
    id: "max",
    name: "Max Expansion",
    price: 9,
    baseTokens: 5400,
    bonusTokens: 2600,
    totalTokens: 8000,
    icon: <Star className="w-6 h-6" />,
    popular: true
  },
  {
    id: "premium",
    name: "Orbit Premium",
    price: 18,
    baseTokens: 10800,
    bonusTokens: 5700,
    totalTokens: 16500,
    icon: <Sparkles className="w-6 h-6" />
  },
  {
    id: "galaxy",
    name: "Galaxy Vault",
    price: 32,
    baseTokens: 19200,
    bonusTokens: 10000,
    totalTokens: 29200,
    icon: <Crown className="w-6 h-6" />
  }
];

export default function TokenStore() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const { data: userWallet } = useQuery({
    queryKey: ["/api/users/1/wallet"],
    enabled: isAuthenticated
  });
  
  const userTokens = userWallet ? ((userWallet as any).tokensPlano + (userWallet as any).tokensComprados + (userWallet as any).tokensGanhos) : 0;

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const response = await apiRequest("POST", "/api/payment/generate-pix", { 
        plan: packageId,
        type: 'tokens' 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.paymentUrl) {
        // Redirecionar para o Mercado Pago
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "Erro no Pagamento",
          description: "Não foi possível gerar o link de pagamento",
          variant: "destructive"
        });
      }
      setSelectedPackage(null);
    },
    onError: (error: Error) => {
      // VERIFICAR SE É ERRO DE DOCUMENTOS NÃO VERIFICADOS
      if (error.message.includes("Documentos não verificados") || error.message.includes("DOCUMENTS_NOT_VERIFIED")) {
        toast({
          title: "Documentos Pendentes",
          description: "Para comprar tokens, você precisa verificar seus documentos primeiro.",
          variant: "destructive"
        });
        
        // Mostrar modal personalizado após 2 segundos
        setTimeout(() => {
          setShowDocumentModal(true);
        }, 1500);
      } else {
        toast({
          title: "Erro na Compra",
          description: error.message,
          variant: "destructive"
        });
      }
      setSelectedPackage(null);
    }
  });

  const handlePurchase = (packageId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Necessário",
        description: "Faça login para comprar tokens",
        variant: "destructive"
      });
      return;
    }
    setSelectedPackage(packageId);
    purchaseMutation.mutate(packageId);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Loja de Tokens
            </h1>
            <p className="text-gray-400">Faça login para comprar tokens e expandir suas possibilidades</p>
          </div>
          
          <Card className="bg-black/30 border-gray-700 text-center p-8">
            <CardContent>
              <Coins className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <h3 className="text-xl font-bold mb-2">Login Necessário</h3>
              <p className="text-gray-400 mb-4">Para comprar tokens, você precisa estar logado na plataforma</p>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% -10%, #06223B, #020D18 55%, #00060F)', color: '#F4FAFF', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 14px clamp(18px, 14vw, 56px)', borderBottom: '1px solid rgba(0,174,255,0.18)', background: 'rgba(4,17,31,0.82)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Coins size={18} /> Orbit Credits
            </div>
            <div style={{ fontSize: 13, color: '#91A9BD' }}>Saldo: {userTokens.toLocaleString()} tokens</div>
          </div>
          <Link href="/">
            <button style={{ background: 'none', border: '1px solid rgba(0,174,255,0.18)', borderRadius: 8, padding: '6px 12px', color: '#91A9BD', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Início
            </button>
          </Link>
        </header>
      <div className="p-4 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Loja de Tokens Orbit
          </h1>
          <p className="text-gray-400 mb-2 text-sm sm:text-base">Expanda suas possibilidades com mais tokens</p>
        </div>

        {/* Informações importantes - Mobile Optimized */}
        <Card className="bg-black/30 border-cyan-500/30 mb-4 sm:mb-8">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-cyan-400 flex items-center gap-2 text-sm sm:text-base">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-300 p-3 sm:p-6 pt-0">
            <p>✨ Todos os pacotes incluem <strong className="text-cyan-400">bônus gratuito</strong></p>
            <p>🔒 Tokens comprados <strong>não expiram</strong> e são acumulativos</p>
            <p>⚠️ Você precisa ter um <strong className="text-yellow-400">plano ativo</strong> para usar os tokens</p>
            <p>💰 Tokens comprados não entram no pool de cashback (apenas tokens ganhos)</p>
            <p>🎯 Use tokens para IA, contratação de profissionais e upgrades</p>
          </CardContent>
        </Card>

        {/* Grid de pacotes - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6 mb-8">
          {tokenPackages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative bg-black/40 border-gray-700 hover:border-cyan-500/50 transition-all duration-300 transform hover:scale-105 ${
                pkg.popular ? 'border-cyan-500 ring-2 ring-cyan-500/20' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3 py-1">
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2 sm:pb-4 p-3 sm:p-6">
                <div className="flex justify-center mb-1 sm:mb-2 text-cyan-400">
                  <div className="w-5 h-5 sm:w-6 sm:h-6">{pkg.icon}</div>
                </div>
                <CardTitle className="text-base sm:text-lg text-white">{pkg.name}</CardTitle>
                <CardDescription className="text-gray-400 text-xs sm:text-sm">
                  {pkg.baseTokens.toLocaleString()} + {pkg.bonusTokens.toLocaleString()} bônus
                </CardDescription>
              </CardHeader>
              
              <CardContent className="text-center space-y-2 sm:space-y-4 p-3 sm:p-6 pt-0">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-1">
                    R$ {pkg.price}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">
                    {pkg.totalTokens.toLocaleString()} tokens
                  </div>
                </div>
                
                <div className="space-y-0.5 sm:space-y-1 text-xs text-gray-400">
                  <div>Base: {pkg.baseTokens.toLocaleString()}</div>
                  <div className="text-green-400">Bônus: +{pkg.bonusTokens.toLocaleString()}</div>
                </div>
                
                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchaseMutation.isPending && selectedPackage === pkg.id}
                  className={`w-full text-xs sm:text-sm py-2 sm:py-3 ${
                    pkg.popular 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  } transition-all duration-200 text-white font-medium`}
                >
                  {purchaseMutation.isPending && selectedPackage === pkg.id ? (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Processando...</span>
                      <span className="sm:hidden">...</span>
                    </div>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Comprar Agora</span>
                      <span className="sm:hidden">Comprar</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparação com planos */}
        <Card className="bg-black/30 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <Star className="w-5 h-5" />
              💡 Dica de Economia
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-300">
            <p className="mb-2">
              <strong className="text-yellow-400">Planos mensais</strong> incluem benefícios adicionais além dos tokens:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="text-cyan-400 font-bold">Básico R$ 7</div>
                <div>7.000 tokens/mês</div>
                <div className="text-green-400">R$ 0,001/token</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="text-cyan-400 font-bold">Standard R$ 14</div>
                <div>14.000 tokens/mês</div>
                <div className="text-green-400">R$ 0,001/token</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="text-cyan-400 font-bold">Pro R$ 21</div>
                <div>21.000 tokens/mês</div>
                <div className="text-green-400">R$ 0,001/token</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="text-cyan-400 font-bold">Max R$ 30</div>
                <div>30.000 tokens/mês</div>
                <div className="text-green-400">R$ 0,001/token</div>
              </div>
            </div>
            <p className="mt-3 text-yellow-400">
              ✨ Benefícios dos planos: Cashback mensal (3-5%), acesso a Teams, tokens via jogos, renovação automática.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de Verificação de Documentos */}
      <DocumentVerificationModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onConfirm={() => {
          setShowDocumentModal(false);
          window.location.href = '/verificacao-documentos';
        }}
        title="Documentos Pendentes"
        description="Para comprar tokens, você precisa verificar seus documentos primeiro."
      />
    </div>
    </div>
    </div>
  );
}