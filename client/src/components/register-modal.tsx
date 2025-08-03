import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Mail, User, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  fullName: string;
  phone: string;
  acceptTerms: boolean;
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<RegisterData>({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    phone: "",
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (data: Omit<RegisterData, 'confirmPassword'>) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Conta criada!",
          description: data.requiresVerification 
            ? "Verifique seu email para ativar a conta."
            : "Sua conta foi criada com sucesso!",
        });
        onClose();
        if (data.requiresVerification) {
          toast({
            title: "Verificação necessária",
            description: "Enviamos um link de verificação para seu email.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Erro no cadastro",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar conta",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptTerms) {
      toast({
        title: "Erro",
        description: "Você deve aceitar os termos de uso",
        variant: "destructive",
      });
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    registerMutation.mutate(registerData);
  };

  const updateField = (field: keyof RegisterData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/95 border border-[var(--neon-cyan)]/50 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-white">
            Criar Conta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Completo */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-[var(--neon-cyan)]">
              Nome Completo *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className="pl-10 bg-black/50 border-gray-600 focus:border-[var(--neon-cyan)] text-white placeholder-gray-400"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-[var(--neon-cyan)]">
              Nome de Usuário *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="username"
                type="text"
                placeholder="usuario123"
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value)}
                className="pl-10 bg-black/50 border-gray-600 focus:border-[var(--neon-cyan)] text-white placeholder-gray-400"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[var(--neon-cyan)]">
              E-mail *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="pl-10 bg-black/50 border-gray-600 focus:border-[var(--neon-cyan)] text-white placeholder-gray-400"
                required
              />
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[var(--neon-cyan)]">
              Telefone (opcional)
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="pl-10 bg-black/50 border-gray-600 focus:border-[var(--neon-cyan)] text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[var(--neon-cyan)]">
              Senha *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="pl-10 pr-10 bg-black/50 border-gray-600 focus:border-[var(--neon-cyan)] text-white placeholder-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[var(--neon-cyan)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[var(--neon-cyan)]">
              Confirmar Senha *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                className="pl-10 pr-10 bg-black/50 border-gray-600 focus:border-[var(--neon-cyan)] text-white placeholder-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[var(--neon-cyan)]"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Termos */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => updateField('acceptTerms', checked as boolean)}
              className="border-[var(--neon-cyan)]"
            />
            <Label htmlFor="terms" className="text-sm text-gray-300">
              Aceito os{" "}
              <a href="/termos" target="_blank" className="text-[var(--neon-cyan)] hover:underline">
                termos de uso
              </a>{" "}
              e{" "}
              <a href="/privacidade" target="_blank" className="text-[var(--neon-cyan)] hover:underline">
                política de privacidade
              </a>
            </Label>
          </div>

          {/* Botões */}
          <div className="flex flex-col space-y-3 pt-4">
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/80 text-black font-semibold"
            >
              {registerMutation.isPending ? "Criando..." : "Criar Conta"}
            </Button>

            <div className="text-center">
              <span className="text-gray-400 text-sm">
                Já tem uma conta?{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-[var(--neon-cyan)] hover:underline"
                >
                  Fazer login
                </button>
              </span>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}