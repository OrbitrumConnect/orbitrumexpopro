import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/notification-modal";
import { Mail, Lock, User, Eye, EyeOff, Rocket, Shield } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData?: any, rememberMe?: boolean) => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    rememberMe: false
  });
  const [emailConfirmationError, setEmailConfirmationError] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showAlternativeEmail, setShowAlternativeEmail] = useState(false);
  const [alternativeEmail, setAlternativeEmail] = useState("");
  
  // Estado para notificações bonitas
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    showEmailIcon?: boolean;
    showResendButton?: boolean;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    showEmailIcon: false,
    showResendButton: false
  });

  // Função para mostrar notificações bonitas
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, showEmailIcon = false, showResendButton = false) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
      showEmailIcon,
      showResendButton
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const handleQuickLogin = async (userType: 'admin' | 'client' | 'professional') => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email || `admin@orbitrum.com`,
        password: formData.password || 'admin123',
      });
      if (error) throw error;

      const user = data.user || { email: formData.email || 'admin@orbitrum.com', userType, tokens: 10000, plan: 'max' };
      onSuccess?.(user, true);
      showNotification('success', 'Login rápido', `Logado como ${userType}`);
    } catch (error: any) {
      console.error('Erro no login rápido:', error);
      showNotification('error', 'Erro no login rápido', error?.message || 'Erro ao fazer login rápido');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (userType: 'client' | 'professional' = 'client') => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: { access_type: 'offline', prompt: 'consent' },
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      // O redirecionamento será feito pelo Supabase
    } catch (error: any) {
      console.error('Erro no login Google:', error);
      showNotification('error', 'Erro no login Google', error?.message || 'Erro ao conectar com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailConfirmationError(false);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;

      const user = data.user;
      if (user) {
        onSuccess?.(user, formData.rememberMe);
        if (user.email === 'passosmir4@gmail.com') {
          setTimeout(() => setLocation('/admin'), 100);
        }
      } else {
        showNotification('error', 'Erro no login', 'Usuário não encontrado');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = error?.message || 'Erro de conexão';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setEmailConfirmationError(true);
        showNotification('warning', 'Email não confirmado', 'Confirme seu email para continuar', true, true);
      } else {
        showNotification('error', 'Erro no login', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationEmail = async (targetEmail?: string) => {
    const emailToUse = targetEmail || formData.email;
    if (!emailToUse) {
      showNotification('warning', 'Email obrigatório', 'Digite um email válido primeiro');
      return;
    }
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: emailToUse });
      if (error) throw error;
      showNotification('success', 'Email enviado!', 'Verifique sua caixa de entrada', true);
      setEmailConfirmationError(false);
      setResendCooldown(30);
      const countdown = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(countdown); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      showNotification('error', 'Erro no envio', error?.message || 'Erro ao reenviar');
    } finally {
      setResendingEmail(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: "", password: "", username: "", rememberMe: false });
    setEmailConfirmationError(false);
    setShowAlternativeEmail(false);
    setAlternativeEmail("");
    setResendCooldown(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md mx-auto bg-black/95 border border-[var(--neon-cyan)]/30 text-white overflow-y-auto max-h-[90vh] sm:max-h-none">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[var(--neon-cyan)] to-purple-500 flex items-center justify-center"
          >
            <Rocket className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
          </motion.div>
          <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[var(--neon-cyan)] to-purple-400 bg-clip-text text-transparent">
            {isLogin ? "Bem-vindo de volta" : "Junte-se à Órbita"}
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-sm sm:text-base">
            {isLogin ? "Acesse sua conta Orbtrum Connect" : "Crie sua conta e explore o universo profissional"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[var(--neon-cyan)]">Nome de Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="username" type="text" placeholder="Seu nome de usuário" value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} className="pl-10 bg-black/50 border-gray-600 focus:border-[var(--neon-cyan)] text-white placeholder-gray-400" required={!isLogin} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[var(--neon-cyan)]">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input id="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="pl-10 bg-black/50 border-gray-600 focus:border-[var(--neon-cyan)] text-white placeholder-gray-400" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[var(--neon-cyan)]">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} className="pl-10 pr-10 bg-black/50 border-gray-600 focus:border-[var(--neon-cyan)] text-white placeholder-gray-400" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[var(--neon-cyan)] transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Button type="submit" disabled={loading} className="w-full neon-button font-semibold py-2 sm:py-3 text-sm">
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  {isLogin ? "ENTRAR" : "CRIAR CONTA"}
                </>
              )}
            </Button>

            {isLogin && (
              <div className="flex items-center justify-center space-x-2 pt-2">
                <input id="rememberMe" type="checkbox" checked={formData.rememberMe} onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))} className="w-4 h-4 text-[var(--neon-cyan)] bg-black/50 border-gray-600 rounded focus:ring-[var(--neon-cyan)] focus:ring-2" />
                <Label htmlFor="rememberMe" className="text-sm text-gray-300 cursor-pointer">Permanecer conectado (30 dias)</Label>
              </div>
            )}
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-600"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-black text-gray-400">ou</span></div>
          </div>

          <div className="space-y-3">
            <div className="text-center"><span className="text-sm text-gray-400 font-medium">Escolha seu perfil:</span></div>
            <Button type="button" onClick={() => handleGoogleLogin('client')} disabled={loading} className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)] transition-all duration-200 relative overflow-hidden">
              <div className="flex items-center justify-center"><FaGoogle className="mr-3 h-4 w-4 text-red-500" /><div className="text-left"><div className="font-semibold">{isLogin ? "Cliente" : "Sou Cliente"}</div><div className="text-xs text-gray-600">Busco profissionais e serviços</div></div></div>
            </Button>
            <Button type="button" onClick={() => handleGoogleLogin('professional')} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 border border-purple-300 focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)] transition-all duration-200 relative overflow-hidden">
              <div className="flex items-center justify-center"><FaGoogle className="mr-3 h-4 w-4" /><div className="text-left"><div className="font-semibold">{isLogin ? "Profissional" : "Sou Profissional"}</div><div className="text-xs text-purple-200">Ofereço serviços e habilidades</div></div></div>
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">Ao continuar, você concorda com nossos <span className="text-[var(--neon-cyan)] cursor-pointer">Termos de Uso</span> e <span className="text-[var(--neon-cyan)] cursor-pointer">Política de Privacidade</span></p>
        </div>
      </DialogContent>

      <NotificationModal isOpen={notification.isOpen} onClose={closeNotification} type={notification.type} title={notification.title} message={notification.message} showEmailIcon={notification.showEmailIcon} showResendButton={notification.showResendButton} onResend={() => { closeNotification(); resendConfirmationEmail(formData.email); }} />
    </Dialog>
  );
}