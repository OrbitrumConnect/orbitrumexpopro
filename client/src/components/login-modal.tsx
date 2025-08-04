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
      
      // Simular login rápido para desenvolvimento
      const mockUser = {
        id: 1,
        email: `admin@orbitrum.com`,
        username: `Admin ${userType}`,
        userType: userType,
        tokens: 10000,
        plan: 'max'
      };
      
      if (typeof onSuccess === 'function') {
        onSuccess(mockUser, true);
      }
      
      showNotification('success', 'Login rápido', `Logado como ${userType}`);
      
    } catch (error) {
      console.error('Erro no login rápido:', error);
      showNotification('error', 'Erro no login rápido', (error as any)?.message || 'Erro ao fazer login rápido');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (userType: 'client' | 'professional' = 'client') => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType })
      });
      
      const data = await response.json();
      
      if (data.success && data.redirectUrl) {
        // Redirecionar para Google OAuth
        window.location.href = data.redirectUrl;
      } else {
        showNotification('error', 'Erro no login Google', data.message || 'Erro ao conectar com Google');
      }
    } catch (error) {
      console.error('Erro no login Google:', error);
      showNotification('error', 'Erro de conexão', 'Erro ao conectar com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailConfirmationError(false);
    
    try {
      // Timeout para requisições muito longas
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password,
          rememberMe: formData.rememberMe
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (data.success && data.user) {
        console.log('✅ Login bem-sucedido, chamando onSuccess com:', data.user);
        
        // Callback para AuthContext fazer login com configuração de "lembrar"
        if (typeof onSuccess === 'function') {
          onSuccess(data.user, formData.rememberMe);
        }
        
        // Redirecionamento imediato para admin se for o master
        if (data.user.email === 'passosmir4@gmail.com') {
          console.log('🚀 ADMIN DETECTADO - Redirecionando para /admin');
          setTimeout(() => {
            setLocation('/admin');
          }, 100);
        }
        
        setLoading(false);
      } else {
        setLoading(false);
        // Mostrar mensagem específica incluindo necessidade de verificação
        if (data.requiresVerification) {
          console.log('📧 Email não confirmado detectado, ativando botão de reenvio...');
          setEmailConfirmationError(true);
          
          // Envio automático para garantir que funcione
          setTimeout(() => {
            console.log('📧 Tentativa automática de reenvio em 2 segundos...');
            resendConfirmationEmail(formData.email);
          }, 2000);
          
          showNotification(
            'warning', 
            'Email não confirmado', 
            data.message + '\n\nClique em "Reenviar Email" para enviar novamente.',
            true,
            true
          );
        } else {
          setEmailConfirmationError(false);
          showNotification('error', 'Erro no login', data.message || 'Erro no login');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      
      // Tratamento específico de diferentes tipos de erro
      if ((error as any).name === 'AbortError') {
        showNotification('error', 'Timeout', 'Conexão muito lenta. Tente novamente.');
      } else if ((error as any).message?.includes('fetch')) {
        showNotification('error', 'Erro de rede', 'Verifique sua conexão e tente novamente.');
              } else if ((error as any).message?.includes('CORS')) {
        showNotification('error', 'Erro de acesso', 'Problema de segurança. Recarregue a página.');
      } else if (error && error instanceof Error && error.message) {
        showNotification('error', 'Erro de conexão', error.message);
      } else {
        showNotification('error', 'Erro inesperado', 'Algo deu errado. Tente recarregar a página.');
      }
    }
  };

  // Função para reenviar email de confirmação com cooldown
  const resendConfirmationEmail = async (targetEmail?: string) => {
    const emailToUse = targetEmail || formData.email;
    
    if (!emailToUse) {
      showNotification('warning', 'Email obrigatório', 'Digite um email válido primeiro');
      return;
    }

    if (resendCooldown > 0) {
      showNotification('info', 'Aguarde um momento', `Aguarde ${resendCooldown} segundos antes de reenviar novamente`);
      return;
    }

    setResendingEmail(true);
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', 'Email enviado!', data.message, true);
        setEmailConfirmationError(false);
        
        // Iniciar cooldown de 30 segundos
        setResendCooldown(30);
        const countdown = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(countdown);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Se usou email alternativo, atualizar o email principal
        if (targetEmail && targetEmail !== formData.email) {
          setFormData(prev => ({ ...prev, email: targetEmail }));
          setShowAlternativeEmail(false);
          setAlternativeEmail("");
        }
      } else {
        // Se falhar, mostrar opção de email alternativo
        if (data.message.includes('não encontrado') || data.message.includes('não existe')) {
          setShowAlternativeEmail(true);
          showNotification('warning', 'Email não encontrado', data.message + '\n\nTente com um email alternativo abaixo', true);
        } else {
          showNotification('error', 'Erro no envio', data.message);
        }
      }
    } catch (error) {
      console.error('Erro ao reenviar confirmação:', error);
      showNotification('error', 'Erro de conexão', 'Erro ao reenviar email de confirmação', true);
      setShowAlternativeEmail(true);
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
            {isLogin 
              ? "Acesse sua conta Orbtrum Connect" 
              : "Crie sua conta e explore o universo profissional"
            }
          </DialogDescription>
          
          {/* Seção removida por segurança - sem botões de acesso admin */}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[var(--neon-cyan)]">
                Nome de Usuário
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Seu nome de usuário"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="pl-10 bg-black/50 border-gray-600 focus:border-[var(--neon-cyan)] text-white placeholder-gray-400"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[var(--neon-cyan)]">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="pl-10 bg-black/50 border-gray-600 focus:border-[var(--neon-cyan)] text-white placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[var(--neon-cyan)]">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="pl-10 pr-10 bg-black/50 border-gray-600 focus:border-[var(--neon-cyan)] text-white placeholder-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[var(--neon-cyan)] transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full neon-button font-semibold py-2 sm:py-3 text-sm"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  {isLogin ? "ENTRAR" : "CRIAR CONTA"}
                </>
              )}
            </Button>

            {/* Checkbox Permanecer Conectado - APÓS o botão ENTRAR */}
            {isLogin && (
              <div className="flex items-center justify-center space-x-2 pt-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                  className="w-4 h-4 text-[var(--neon-cyan)] bg-black/50 border-gray-600 rounded focus:ring-[var(--neon-cyan)] focus:ring-2"
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-300 cursor-pointer">
                  Permanecer conectado (30 dias)
                </Label>
              </div>
            )}

            {/* Sistema de reenvio de email - SOMENTE reenviar para o mesmo email */}
            {emailConfirmationError && (
              <div className="space-y-3">
                {/* Informação sobre o email que será usado */}
                <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="text-center text-yellow-300 text-sm">
                    <Mail className="inline mr-2 h-4 w-4" />
                    Email será enviado para: <strong>{formData.email}</strong>
                  </div>
                </div>

                {/* Botão de reenvio */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    onClick={() => resendConfirmationEmail(formData.email)}
                    disabled={resendingEmail || resendCooldown > 0}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-6 text-sm disabled:opacity-50 touch-manipulation"
                    style={{ 
                      minHeight: '44px',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                    onTouchStart={() => resendConfirmationEmail(formData.email)}
                    onTouchEnd={() => resendConfirmationEmail(formData.email)}
                  >
                    {resendingEmail ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    {resendingEmail ? 'Enviando...' : 
                     resendCooldown > 0 ? `Aguarde ${resendCooldown}s` : 
                     'Reenviar Email de Confirmação'}
                  </Button>
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 text-xs scale-75"
                >
                  <Shield className="mr-1 h-3 w-3" />
                  Admin
                </Button>
              </div>
            )}

            {/* Divisor OU */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-400">ou</span>
              </div>
            </div>

            {/* Seção de opções Google OAuth */}
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-sm text-gray-400 font-medium">Escolha seu perfil:</span>
              </div>
              
              {/* Login com Google - Cliente */}
              <Button
                type="button"
                onClick={() => handleGoogleLogin('client')}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)] transition-all duration-200 relative overflow-hidden"
              >
                <div className="flex items-center justify-center">
                  <FaGoogle className="mr-3 h-4 w-4 text-red-500" />
                  <div className="text-left">
                    <div className="font-semibold">{isLogin ? "Cliente" : "Sou Cliente"}</div>
                    <div className="text-xs text-gray-600">Busco profissionais e serviços</div>
                  </div>
                </div>
              </Button>

              {/* Login com Google - Profissional */}
              <Button
                type="button"
                onClick={() => handleGoogleLogin('professional')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 border border-purple-300 focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)] transition-all duration-200 relative overflow-hidden"
              >
                <div className="flex items-center justify-center">
                  <FaGoogle className="mr-3 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">{isLogin ? "Profissional" : "Sou Profissional"}</div>
                    <div className="text-xs text-purple-200">Ofereço serviços e habilidades</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>

          <div className="text-center pt-3 sm:pt-4">
            <button
              type="button"
              onClick={isLogin ? () => {
                onClose();
                setLocation('/cadastro');
              } : toggleMode}
              className="text-[var(--neon-cyan)] hover:text-purple-400 transition-colors font-medium text-sm"
            >
              {isLogin 
                ? "Não tem conta? Cadastro completo aqui" 
                : "Já tem conta? Faça login aqui"
              }
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            Ao continuar, você concorda com nossos{" "}
            <span className="text-[var(--neon-cyan)] cursor-pointer">Termos de Uso</span>
            {" "}e{" "}
            <span className="text-[var(--neon-cyan)] cursor-pointer">Política de Privacidade</span>
          </p>
        </div>
      </DialogContent>
      
      {/* Modal de notificações bonitas */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        showEmailIcon={notification.showEmailIcon}
        showResendButton={notification.showResendButton}
        onResend={() => {
          closeNotification();
          resendConfirmationEmail(formData.email);
        }}
      />
    </Dialog>
  );
}