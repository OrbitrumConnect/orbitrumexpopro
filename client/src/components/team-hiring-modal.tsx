import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Calculator, CreditCard, Zap, TrendingDown } from "lucide-react";

const teamHiringSchema = z.object({
  projectTitle: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  projectDescription: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
});

type TeamHiringForm = z.infer<typeof teamHiringSchema>;

interface Professional {
  id: number;
  name: string;
  title: string;
  avatar: string;
  hourlyRate: number;
  services: string[];
}

interface TeamHiringModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionals: Professional[];
  totalTokens: number;
  userId: number;
}

export function TeamHiringModal({ 
  isOpen, 
  onClose, 
  professionals, 
  totalTokens, 
  userId 
}: TeamHiringModalProps) {
  const [discountInfo, setDiscountInfo] = useState<{
    percentage: number;
    amount: number;
    finalAmount: number;
  } | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TeamHiringForm>({
    resolver: zodResolver(teamHiringSchema),
    defaultValues: {
      projectTitle: "",
      projectDescription: "",
    },
  });

  // Calcular desconto em tempo real
  const calculateDiscount = async () => {
    try {
      const response = await fetch(`/api/team-hiring/calculate-discount/${professionals.length}`);
      const data = await response.json();
      
      const discountAmount = Math.floor(totalTokens * (data.discountPercentage / 100));
      const finalAmount = totalTokens - discountAmount;
      
      setDiscountInfo({
        percentage: data.discountPercentage,
        amount: discountAmount,
        finalAmount
      });
    } catch (error) {
      console.error("Erro ao calcular desconto:", error);
    }
  };

  // Calcular desconto quando modal abrir
  useEffect(() => {
    if (isOpen && professionals.length > 0) {
      calculateDiscount();
    }
  }, [isOpen, professionals.length]);

  const createTeamHiringMutation = useMutation({
    mutationFn: async (data: TeamHiringForm) => {
      const response = await fetch("/api/team-hiring", {
        method: "POST",
        body: JSON.stringify({
          userId,
          professionals: JSON.stringify(professionals.map(p => ({
            id: p.id,
            name: p.name,
            title: p.title,
            hourlyRate: p.hourlyRate,
            services: p.services
          }))),
          projectTitle: data.projectTitle,
          projectDescription: data.projectDescription,
          totalTokens,
          discountPercentage: discountInfo?.percentage || 0,
          discountAmount: discountInfo?.amount || 0,
          finalAmount: discountInfo?.finalAmount || totalTokens
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🤝 Equipe Contratada!",
        description: (data as any)?.message || "Sua equipe foi contratada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "team-hirings"] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro na contratação",
        description: error.message || "Falha ao contratar equipe",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeamHiringForm) => {
    createTeamHiringMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900/95 via-blue-900/95 to-cyan-900/95 backdrop-blur-lg border border-cyan-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            Contratar Equipe Profissional
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo da Equipe */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-cyan-500/20">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Profissionais Selecionados ({professionals.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {professionals.map((professional) => (
                <div key={professional.id} className="flex items-center gap-3 bg-gray-700/30 rounded-lg p-3">
                  <img
                    src={professional.avatar}
                    alt={professional.name}
                    className="w-12 h-12 rounded-full border-2 border-cyan-500/30"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{professional.name}</h4>
                    <p className="text-sm text-gray-300">{professional.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                        {professional.hourlyRate} tokens/h
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cálculo de Custos */}
          <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg p-4 border border-cyan-500/30">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Resumo Financeiro
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Custo Total Original:
                </span>
                <span className="text-white font-semibold">{totalTokens.toLocaleString()} tokens</span>
              </div>
              
              {discountInfo && discountInfo.percentage > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-green-400 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Desconto ({discountInfo.percentage}%):
                    </span>
                    <span className="text-green-400 font-semibold">-{discountInfo.amount.toLocaleString()} tokens</span>
                  </div>
                  
                  <div className="border-t border-cyan-500/20 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-cyan-400 flex items-center gap-2 font-semibold">
                        <Zap className="w-4 h-4" />
                        Total Final:
                      </span>
                      <span className="text-cyan-400 font-bold text-lg">{discountInfo.finalAmount.toLocaleString()} tokens</span>
                    </div>
                  </div>
                </>
              )}
              
              {discountInfo && discountInfo.percentage === 0 && (
                <div className="text-center py-2">
                  <p className="text-gray-400 text-sm">
                    💡 Adicione mais profissionais para obter desconto:
                  </p>
                  <p className="text-cyan-400 text-sm font-medium">
                    5+ profissionais = 15% desconto | 10+ profissionais = 20% desconto
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Formulário do Projeto */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="projectTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cyan-400">Título do Projeto *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Desenvolvimento de aplicativo mobile"
                        className="bg-gray-800/50 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-400"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cyan-400">Descrição do Projeto *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descreva detalhadamente o projeto, objetivos, prazos e expectativas..."
                        rows={4}
                        className="bg-gray-800/50 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-400"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700/50"
                >
                  Cancelar
                </Button>
                
                <Button
                  type="submit"
                  disabled={createTeamHiringMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold"
                >
                  {createTeamHiringMutation.isPending ? (
                    "Processando..."
                  ) : (
                    <>
                      🤝 Contratar Equipe
                      {discountInfo && discountInfo.finalAmount && (
                        <span className="ml-2 font-bold">
                          ({discountInfo.finalAmount.toLocaleString()} tokens)
                        </span>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}