import { useState, useEffect } from "react";
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
  defaultMode?: 'login' | 'register';
}

export function LoginModal({ isOpen, onClose, onSuccess, defaultMode = 'login' }: LoginModalProps) {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  useEffect(() => { setIsLogin(defaultMode === 'login'); }, [defaultMode]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    rememberMe: false,
    userType: "" as "" | "client" | "professional",
    profession: "",
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

      const authUser = data.user;
      if (authUser) {
        // Enriquece com o registro de public.users via RPC get_my_profile()
        // (SECURITY DEFINER, pela sessão recém-criada do login).
        let perfil: any = {};
        try {
          const { data: row } = await supabase.rpc('get_my_profile');
          if (row) perfil = row;
        } catch (e) {
          console.warn('Perfil de public.users não carregado:', e);
        }
        const user = {
          ...authUser,
          ...perfil,
          id: authUser.id, // mantém o UUID do Supabase
          id_interno: perfil.id, // id numérico de public.users
          email: authUser.email,
          isAdmin: (perfil.admin_level ?? 0) >= 1 || perfil.user_type === 'admin',
        };
        onSuccess?.(user, formData.rememberMe);
        // Vai pra HOME logado (admin acessa o painel pela sidebar). Antes ia direto pra /admin
        // em 100ms, mas o isAuthenticated ainda não tinha propagado → AdminDashboard rebatia pra
        // '/' ("não autenticado") e parecia que o login falhava. Home é determinística.
        setLocation('/');
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
    setFormData({ email: "", password: "", username: "", rememberMe: false, userType: "", profession: "" });
    setEmailConfirmationError(false);
    setShowAlternativeEmail(false);
    setAlternativeEmail("");
    setResendCooldown(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md mx-auto text-white overflow-y-auto max-h-[90vh] sm:max-h-none" style={{ background: '#020914', border: '1px solid rgba(0,174,255,0.25)' }}>
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00E5FF, #00AEEF)' }}
          >
            <Rocket className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
          </motion.div>
          <DialogTitle className="text-xl sm:text-2xl font-bold" style={{ color: '#00E5FF' }}>
            {isLogin ? "Bem-vindo de volta" : "Cadastre-se grátis"}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base" style={{ color: '#91A9BD' }}>
            {isLogin ? "Acesse sua conta Orbitrum" : "Entre na rede e conecte-se com profissionais reais"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label className="text-cyan-400">Eu sou</Label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([['client', 'Cliente'], ['professional', 'Profissional']] as const).map(([type, label]) => (
                    <button key={type} type="button" onClick={() => setFormData(prev => ({ ...prev, userType: type }))}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background: formData.userType === type ? 'linear-gradient(135deg, #00E5FF, #00AEEF)' : 'transparent',
                        color: formData.userType === type ? '#012' : '#91A9BD',
                        border: formData.userType === type ? 'none' : '1px solid rgba(0,174,255,0.25)',
                      }}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-cyan-400">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="username" type="text" placeholder="Seu nome" value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} className="pl-10 border-gray-700 focus:border-cyan-400 text-white placeholder-gray-400" required={!isLogin} />
                </div>
              </div>
              {formData.userType === 'professional' && (
                <div className="space-y-2">
                  <Label htmlFor="profession" className="text-cyan-400">Sua profissão</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="profession" type="text" placeholder="Ex: Eletricista, Pintor, Diarista..." value={formData.profession} onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))} className="pl-10 border-gray-700 focus:border-cyan-400 text-white placeholder-gray-400" />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-cyan-400">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input id="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="pl-10 border-gray-700 focus:border-cyan-400 text-white placeholder-gray-400" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-cyan-400">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} className="pl-10 pr-10 border-gray-700 focus:border-cyan-400 text-white placeholder-gray-400" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Button type="submit" disabled={loading} className="w-full font-semibold py-2 sm:py-3 text-sm" style={{ background: 'linear-gradient(135deg, #00E5FF, #00AEEF)', color: '#012', border: 'none' }}>
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  {isLogin ? "ENTRAR" : "CRIAR CONTA"}
                </>
              )}
            </Button>

            <button type="button" onClick={toggleMode}
              style={{ width: '100%', background: isLogin ? 'rgba(0,229,255,0.08)' : 'none', border: `1px solid ${isLogin ? 'rgba(0,229,255,0.25)' : 'rgba(0,174,255,0.15)'}`, borderRadius: 12, padding: '12px 16px', color: '#91A9BD', fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
              {isLogin ? (
                <>Não tem conta? <span style={{ color: '#00E5FF', fontWeight: 700, fontSize: 15 }}>Cadastre-se grátis</span></>
              ) : (
                <>Já tem conta? <span style={{ color: '#00E5FF', fontWeight: 600 }}>Entrar</span></>
              )}
            </button>

            {isLogin && (
              <div className="flex items-center justify-center space-x-2 pt-1">
                <input id="rememberMe" type="checkbox" checked={formData.rememberMe} onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))} className="w-4 h-4 text-cyan-400 border-gray-700 rounded focus:ring-cyan-400 focus:ring-2" />
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
            <Button type="button" onClick={() => handleGoogleLogin('client')} disabled={loading} className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-200 relative overflow-hidden">
              <div className="flex items-center justify-center"><FaGoogle className="mr-3 h-4 w-4 text-red-500" /><div className="text-left"><div className="font-semibold">{isLogin ? "Cliente" : "Sou Cliente"}</div><div className="text-xs text-gray-600">Busco profissionais e serviços</div></div></div>
            </Button>
            <Button type="button" onClick={() => handleGoogleLogin('professional')} disabled={loading} className="w-full text-white font-medium py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-200 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #00AEEF, #0077B6)', border: '1px solid rgba(0,174,255,0.3)' }}>
              <div className="flex items-center justify-center"><FaGoogle className="mr-3 h-4 w-4" /><div className="text-left"><div className="font-semibold">{isLogin ? "Profissional" : "Sou Profissional"}</div><div className="text-xs text-blue-200">Ofereço serviços e habilidades</div></div></div>
            </Button>
          </div>
        </form>

        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,174,255,0.15)' }}>
          <p className="text-xs text-center" style={{ color: '#607A91' }}>Ao continuar, você concorda com nossos <span style={{ color: '#00E5FF', cursor: 'pointer' }}>Termos de Uso</span> e <span style={{ color: '#00E5FF', cursor: 'pointer' }}>Política de Privacidade</span></p>
        </div>
      </DialogContent>

      <NotificationModal isOpen={notification.isOpen} onClose={closeNotification} type={notification.type} title={notification.title} message={notification.message} showEmailIcon={notification.showEmailIcon} showResendButton={notification.showResendButton} onResend={() => { closeNotification(); resendConfirmationEmail(formData.email); }} />
    </Dialog>
  );
}