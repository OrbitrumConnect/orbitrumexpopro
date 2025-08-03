import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  UserPlus, 
  X, 
  Star, 
  Calculator, 
  TrendingDown, 
  Zap,
  ChevronRight
} from "lucide-react";
import { TeamHiringModal } from "./team-hiring-modal";
import type { Professional } from "@shared/schema";

interface TeamSelectionSystemProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfessional?: Professional;
}

export function TeamSelectionSystem({ 
  isOpen, 
  onClose, 
  initialProfessional 
}: TeamSelectionSystemProps) {
  const [selectedProfessionals, setSelectedProfessionals] = useState<Professional[]>(
    initialProfessional ? [initialProfessional] : []
  );
  const [showHiringModal, setShowHiringModal] = useState(false);
  const { toast } = useToast();

  // Mock user ID - em produção seria obtido da autenticação
  const userId = 1;

  const { data: allProfessionals = [] } = useQuery<Professional[]>({
    queryKey: ["/api/professionals"],
    enabled: isOpen,
  });

  const addProfessional = (professional: Professional) => {
    if (selectedProfessionals.find(p => p.id === professional.id)) {
      toast({
        title: "⚠️ Profissional já selecionado",
        description: `${professional.name} já está na sua equipe`,
        variant: "destructive",
      });
      return;
    }

    if (selectedProfessionals.length >= 10) {
      toast({
        title: "⚠️ Limite de equipe atingido",
        description: "Máximo de 10 profissionais por equipe",
        variant: "destructive",
      });
      return;
    }

    setSelectedProfessionals(prev => [...prev, professional]);
    toast({
      title: "✅ Profissional adicionado",
      description: `${professional.name} foi adicionado à equipe`,
    });
  };

  const removeProfessional = (professionalId: number) => {
    setSelectedProfessionals(prev => prev.filter(p => p.id !== professionalId));
  };

  const calculateTotalCost = () => {
    return selectedProfessionals.reduce((total, prof) => total + (prof.hourlyRate * 40), 0); // 40h padrão
  };

  const calculateDiscount = () => {
    const count = selectedProfessionals.length;
    if (count >= 10) return 20;
    if (count >= 5) return 15;
    return 0;
  };

  const getDiscountInfo = () => {
    const total = calculateTotalCost();
    const discountPercentage = calculateDiscount();
    const discountAmount = Math.floor(total * (discountPercentage / 100));
    const finalAmount = total - discountAmount;

    return {
      total,
      discountPercentage,
      discountAmount,
      finalAmount
    };
  };

  const proceedToHiring = () => {
    if (selectedProfessionals.length === 0) {
      toast({
        title: "⚠️ Equipe vazia",
        description: "Selecione pelo menos 1 profissional",
        variant: "destructive",
      });
      return;
    }
    setShowHiringModal(true);
  };

  const handleHiringComplete = () => {
    setShowHiringModal(false);
    onClose();
    setSelectedProfessionals([]);
  };

  const discountInfo = getDiscountInfo();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden bg-gradient-to-br from-gray-900/95 via-blue-900/95 to-cyan-900/95 backdrop-blur-lg border border-cyan-500/30">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Montar Equipe Profissional
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(85vh-100px)]">
            {/* Equipe Selecionada */}
            <div className="lg:col-span-1">
              <Card className="bg-gray-800/50 border-cyan-500/30 sticky top-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-cyan-400 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Equipe Atual ({selectedProfessionals.length}/10)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedProfessionals.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">
                        Nenhum profissional selecionado
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedProfessionals.map((prof) => (
                          <div key={prof.id} className="flex items-center gap-2 bg-gray-700/30 rounded-lg p-2">
                            <img
                              src={prof.avatar}
                              alt={prof.name}
                              className="w-8 h-8 rounded-full border border-cyan-500/30"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white text-sm truncate">{prof.name}</p>
                              <p className="text-xs text-gray-300 truncate">{prof.title}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeProfessional(prof.id)}
                              className="text-red-400 hover:bg-red-500/10 h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Resumo de Custos */}
                      <div className="bg-gray-700/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-cyan-400 font-medium">
                          <Calculator className="w-4 h-4" />
                          Resumo Financeiro
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Custo total:</span>
                            <span className="text-white">{discountInfo.total.toLocaleString()} tokens</span>
                          </div>
                          
                          {discountInfo.discountPercentage > 0 && (
                            <div className="flex justify-between">
                              <span className="text-green-400 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />
                                Desconto ({discountInfo.discountPercentage}%):
                              </span>
                              <span className="text-green-400">-{discountInfo.discountAmount.toLocaleString()}</span>
                            </div>
                          )}
                          
                          <div className="border-t border-gray-600 pt-1">
                            <div className="flex justify-between font-semibold">
                              <span className="text-cyan-400 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                Total final:
                              </span>
                              <span className="text-cyan-400">{discountInfo.finalAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {selectedProfessionals.length < 5 && (
                          <div className="text-xs text-gray-400 text-center mt-2 p-2 bg-gray-800/50 rounded">
                            💡 5+ profissionais = 15% desconto<br />
                            10+ profissionais = 20% desconto
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={proceedToHiring}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold"
                        disabled={selectedProfessionals.length === 0}
                      >
                        Contratar Equipe
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Lista de Profissionais Disponíveis */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">
                Profissionais Disponíveis ({allProfessionals.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allProfessionals
                  .filter(prof => !selectedProfessionals.find(selected => selected.id === prof.id))
                  .map((prof) => (
                    <Card key={prof.id} className="bg-gray-800/30 border-gray-700/50 hover:border-cyan-500/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <img
                            src={prof.avatar}
                            alt={prof.name}
                            className="w-12 h-12 rounded-full border border-cyan-500/30"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{prof.name}</h4>
                            <p className="text-sm text-gray-300 truncate">{prof.title}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-400">{prof.rating}</span>
                              {(prof as any).isDemo && (
                                <Badge variant="outline" className="text-xs ml-2 bg-amber-500/10 text-amber-400 border-amber-500/30">
                                  Demo
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-center">
                            <div className="text-cyan-400 font-semibold mb-2">
                              {prof.hourlyRate} tokens/h
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addProfessional(prof)}
                              className="w-full bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/30"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Adicionar à Equipe
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Contratação da Equipe */}
      {showHiringModal && (
        <TeamHiringModal
          isOpen={showHiringModal}
          onClose={() => setShowHiringModal(false)}
          professionals={selectedProfessionals as any}
          totalTokens={discountInfo.finalAmount}
          userId={userId}
        />
      )}
    </>
  );
}