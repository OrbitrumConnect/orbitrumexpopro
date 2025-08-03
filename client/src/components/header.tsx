import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { Gamepad2, Menu, Users, Home, LogOut, X, Wallet, Shield, User as UserIcon, Coins, UserPlus, FileText, Book, Rocket, HelpCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { WalletModal } from "./wallet-modal";
import React from "react";
import { LoginModal } from "./login-modal";
import { HowItWorksModal } from "./HowItWorksModal";


import { useAuth } from "@/hooks/useAuth";
import { PlanExpiryTimer } from "./plan-expiry-timer";
import { forceLogout } from "@/utils/force-logout";

interface HeaderProps {
  onOpenGame?: () => void;
  onOpenPlans?: () => void;
}

export function Header({ onOpenGame, onOpenPlans }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);


  const isMobile = useIsMobile();
  
  // Escutar evento para abrir modal de login admin
  useEffect(() => {
    const handleOpenAdminLogin = () => setLoginModalOpen(true);
    window.addEventListener('openAdminLogin', handleOpenAdminLogin);
    return () => window.removeEventListener('openAdminLogin', handleOpenAdminLogin);
  }, []);
  const [location] = useLocation();
  const { isAuthenticated, user: authUser, logout, login } = useAuth();
  
  // CACHE GLOBAL - Uma única requisição para toda aplicação
  const demoUser = React.useMemo(() => {
    if (isAuthenticated) return null;
    
    // Retornar dados fixos para evitar ANY requisição
    return {
      id: 1,
      username: "demo_user",
      tokens: 0,
      tokensEarned: 0,
      tokensSpent: 0,
      plan: "free",
      planExpiry: null
    };
  }, [isAuthenticated]);

  // Usar usuário autenticado ou demo
  const user = isAuthenticated ? authUser : demoUser;

  // Debug removido para performance em produção

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 p-2 sm:p-4 transition-all duration-300" style={{ transform: 'scale(1.06)' }}>
        <nav className="flex justify-between items-center glassmorphism rounded-full px-3 sm:px-6 py-2 sm:py-3 max-w-6xl mx-auto backdrop-blur-sm bg-black/90 sm:bg-black/95">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--electric-blue)]" />
            <span className="font-bold text-sm sm:text-xl neon-text">Orbtrum Connect</span>
            <span className="text-[9.5px] sm:text-[10.2px] bg-blue-500 bg-opacity-30 border border-blue-400 px-1 sm:px-1.5 py-0.5 sm:py-0.5 rounded text-blue-200 font-semibold">
              BETA
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-3 md:space-x-6">
            <Link href="/" className={`text-white hover:text-[var(--neon-cyan)] transition-colors flex items-center space-x-1 text-sm ${location === '/' ? 'text-[var(--neon-cyan)]' : ''}`}>
              <Home className="h-4 w-4" />
              <span>Orbit</span>
            </Link>
            <Link href="/teams" className={`text-white hover:text-[var(--neon-cyan)] transition-colors flex items-center space-x-1 text-sm ${location === '/teams' ? 'text-[var(--neon-cyan)]' : ''}`}>
              <Users className="h-4 w-4" />
              <span>Teams</span>
            </Link>
            {isAuthenticated && (
              <Link 
                href={`/dashboard-${authUser?.userType === 'professional' ? 'professional' : 'client'}?tab=tokens`}
                className="text-white hover:text-[var(--neon-cyan)] transition-colors flex items-center space-x-1 text-sm"
              >
                <Coins className="h-4 w-4" />
                <span>+Tokens</span>
              </Link>
            )}
            {isAuthenticated && (
              <Link 
                href="/dashboard-selector" 
                onClick={() => console.log('🚀 CLIQUE DASHBOARD - Navegando para /dashboard-selector')}
                className={`text-white hover:text-[var(--neon-cyan)] transition-colors flex items-center space-x-1 text-sm ${location.startsWith('/dashboard') ? 'text-[var(--neon-cyan)]' : ''}`}
              >
                <UserIcon className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            )}
            <Link href="/admin" className={`text-white hover:text-[var(--neon-cyan)] transition-colors flex items-center space-x-1 text-sm ${location === '/admin' ? 'text-[var(--neon-cyan)]' : ''}`}>
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Link>
            
            <button 
              onClick={() => setHowItWorksOpen(true)}
              className="text-white hover:text-[var(--neon-cyan)] transition-colors flex items-center space-x-1 text-sm"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Como Funciona</span>
            </button>
            
            <Link href="/jogo">
              <Button className="neon-button rounded-full font-semibold px-1.5 py-1 text-xs scale-[0.6]">
                <Gamepad2 className="mr-0.5 h-2.5 w-2.5" />
                JOGAR
              </Button>
            </Link>
            
            {/* Botão Telegram - Desktop */}
            <Button
              onClick={() => window.open('https://t.me/orbitrumconnect_bot', '_blank')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-lg transition-all duration-300 hover:shadow-blue-500/25 scale-[0.8]"
              size="sm"
            >
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169 1.858-.896 6.728-.896 6.728-.896 6.728-1.268 2.053-1.268 2.053-.896 6.728-1.268 2.053-1.607-.076-.423-.292-.896-6.728-1.268-2.053-.896-6.728-1.268-2.053-1.607.076z"/>
                </svg>
                <span className="text-xs font-medium">Telegram</span>
              </div>
            </Button>
          </div>
          
          {/* Mobile/Desktop Right Section */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-4">
            {/* Botão Jogar sempre visível em mobile */}
            <div className="sm:hidden">
              <Link href="/jogo">
                <Button className="neon-button px-1 py-1 text-[9px] rounded-full scale-[0.6] font-medium">
                  <Gamepad2 className="h-2.5 w-2.5" />
                </Button>
              </Link>
            </div>
            
            {isAuthenticated ? (
              <>
                {/* Botão Dashboard Selector - acesso aos 3 dashboards para admin */}
                {authUser?.email === 'passosmir4@gmail.com' && (
                  <Link 
                    href="/dashboard-selector"
                    className="glassmorphism px-1.5 py-1 text-xs rounded-full hover:bg-orange-500/20 hover:text-orange-400 transition-colors border border-orange-500/30 font-semibold admin-button-mobile scale-75"
                  >
                    <Shield className="h-3 w-3" />
                  </Link>
                )}

                {/* Timer de expiração do plano */}
                {user?.plan !== 'free' && user && 'planExpiryDate' in user && (
                  <PlanExpiryTimer 
                    planExpiryDate={user.planExpiryDate ? user.planExpiryDate.toString() : undefined} 
                    plan={user.plan} 
                    compact={true} 
                  />
                )}



                {/* Botão Carteira - Admin tem carteira administrativa */}
                <button 
                  onClick={() => setWalletModalOpen(true)}
                  className="glassmorphism px-1.5 py-1 sm:px-2 md:px-3 rounded-full text-[11px] sm:text-xs hover:bg-white/10 transition-colors border border-cyan-500/30 shadow-lg"
                >
                  <Wallet className="h-3 w-3 sm:h-4 sm:w-4 inline mr-0.5 text-[var(--neon-cyan)]" />
                  <span className="hidden xs:inline text-[11px] sm:text-xs font-medium">
                    {authUser?.email === 'passosmir4@gmail.com' 
                      ? '10.000' // Admin com carteira administrativa
                      : (user?.tokens ?? 0) // Carteira normal
                    }
                  </span>
                </button>
                
                {/* Botão Logout - Apenas desktop */}
                <div className="hidden sm:block">
                  <Button 
                    onClick={() => {
                      logout();
                      forceLogout();
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 hover:bg-yellow-500/30 hover:border-yellow-400/60 hover:text-yellow-200 transition-all rounded-full shadow-lg hover:shadow-yellow-400/25 scale-[0.9]"
                    style={{ 
                      boxShadow: '0 0 8px rgba(251, 191, 36, 0.15)',
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1" />
                    Sair
                  </Button>
                </div>

              </>
            ) : (
              /* Botões quando não autenticado */
              <div className="flex items-center gap-1 sm:gap-2">

                <Button 
                  onClick={() => setLoginModalOpen(true)}
                  className="neon-button px-1 py-0.5 text-[10px] rounded-full scale-85"
                >
                  <LogOut className="h-2.5 w-2.5 mr-0.5" />
                  <span className="hidden xs:inline">ENTRAR</span>
                </Button>
              </div>
            )}
            
            {/* Mobile Menu Button */}
            {isMobile && (
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 rounded-full glassmorphism hover:bg-white/10 transition-colors border border-white/20 shadow-lg"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ y: "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="fixed top-16 right-2 left-2 max-w-xs mx-auto glassmorphism rounded-xl border border-[var(--neon-cyan)]/30 overflow-hidden scale-[0.85]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 space-y-1">
                {/* Home */}
                <Link 
                  href="/" 
                  className={`text-white flex items-center space-x-2 p-2 rounded-lg hover:bg-[var(--neon-cyan)]/10 transition-all duration-300 ${location === '/' ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]' : 'hover:text-[var(--neon-cyan)]'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="h-4 w-4" />
                  <span className="font-medium text-sm">Orbit</span>
                </Link>

                {/* Teams */}
                <Link 
                  href="/teams" 
                  className={`text-white flex items-center space-x-2 p-2 rounded-lg hover:bg-[var(--neon-cyan)]/10 transition-all duration-300 ${location === '/teams' ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]' : 'hover:text-[var(--neon-cyan)]'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-sm">Teams</span>
                </Link>

                {/* Dashboard - apenas para usuários autenticados */}
                {isAuthenticated && (
                  <Link 
                    href={`/dashboard-${authUser?.userType === 'professional' ? 'professional' : 'client'}`}
                    className={`text-white flex items-center space-x-2 p-2 rounded-lg hover:bg-[var(--neon-cyan)]/10 transition-all duration-300 ${location.includes('/dashboard') ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]' : 'hover:text-[var(--neon-cyan)]'}`}
                    onClick={() => {
                      console.log('🚀 CLIQUE DASHBOARD MOBILE - Navegando para dashboard');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <UserIcon className="h-4 w-4" />
                    <span className="font-medium text-sm">Dashboard</span>
                  </Link>
                )}

                {/* Carteira - apenas para usuários autenticados */}
                {isAuthenticated && (
                  <button 
                    onClick={() => {
                      setWalletModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-1.5 p-1.5 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 transition-all duration-300 w-full text-left border border-emerald-500/30 scale-85"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    <span className="font-medium text-xs">Carteira</span>
                  </button>
                )}

                {/* +Tokens - apenas para usuários autenticados */}
                {isAuthenticated && (
                  <Link 
                    href={`/dashboard-${authUser?.userType === 'professional' ? 'professional' : 'client'}?tab=tokens`}
                    className="flex items-center space-x-1.5 p-1.5 rounded-lg hover:bg-purple-500/10 hover:text-purple-400 transition-all duration-300 border border-purple-500/30 scale-85"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Coins className="h-3.5 w-3.5" />
                    <span className="font-medium text-xs">+Tokens</span>
                  </Link>
                )}

                {/* Cadastro Profissional */}
                <Link 
                  href="/cadastro" 
                  className="text-white flex items-center space-x-2 p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="font-medium text-sm">Cadastro Profissional</span>
                </Link>

                {/* Telegram Bot */}
                <button 
                  onClick={() => {
                    window.open('https://t.me/orbitrumconnect_bot', '_blank');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-1.5 p-1.5 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-300 border border-blue-500/30 w-full text-left scale-85"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169 1.858-.896 6.728-.896 6.728-.896 6.728-1.268 2.053-1.268 2.053-.896 6.728-1.268 2.053-1.607-.076-.423-.292-.896-6.728-1.268-2.053-.896-6.728-1.268-2.053-1.607.076z"/>
                  </svg>
                  <span className="font-medium text-xs">Telegram</span>
                </button>

                {/* Como Funciona */}
                <button 
                  onClick={() => {
                    setHowItWorksOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-1.5 p-1.5 rounded-lg hover:bg-purple-500/10 hover:text-purple-400 transition-all duration-300 w-full text-left border border-purple-500/30 scale-85"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span className="font-medium text-xs">Como Funciona</span>
                </button>

                {/* Planos */}
                <button 
                  onClick={() => {
                    onOpenPlans?.();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-1.5 p-1.5 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 transition-all duration-300 w-full text-left border border-cyan-500/30 scale-85"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  <span className="font-medium text-xs">Planos</span>
                </button>

                {/* Game */}
                <button 
                  onClick={() => {
                    onOpenGame?.();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-1.5 p-1.5 rounded-lg hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-300 w-full text-left border border-yellow-500/30 scale-85"
                >
                  <Gamepad2 className="h-3.5 w-3.5" />
                  <span className="font-medium text-xs">Jogo</span>
                </button>

                {/* Separator */}
                <div className="border-t border-gray-600/30 my-2" />

                {/* Política Geral - Links agrupados */}
                <div className="bg-gray-500/5 rounded-lg p-2 border border-gray-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-400 font-medium">Política & Termos</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <Link 
                      href="/termos" 
                      className="flex flex-col items-center p-1.5 rounded hover:bg-gray-500/10 hover:text-gray-300 transition-all duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FileText className="h-3 w-3 mb-1" />
                      <span className="text-xs text-center">Termos</span>
                    </Link>
                    <Link 
                      href="/privacidade" 
                      className="flex flex-col items-center p-1.5 rounded hover:bg-gray-500/10 hover:text-gray-300 transition-all duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-3 w-3 mb-1" />
                      <span className="text-xs text-center">Privacidade</span>
                    </Link>
                    <Link 
                      href="/regras" 
                      className="flex flex-col items-center p-1.5 rounded hover:bg-gray-500/10 hover:text-gray-300 transition-all duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Book className="h-3 w-3 mb-1" />
                      <span className="text-xs text-center">Regras</span>
                    </Link>
                  </div>
                </div>

                {/* Sistema Status */}
                <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg border border-green-500/30">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm">Sistema Online</span>
                  </div>
                  <span className="text-xs text-gray-400">BETA</span>
                </div>

                {/* Admin - apenas para admin master */}
                {authUser?.email === 'passosmir4@gmail.com' && (
                  <Link 
                    href="/admin" 
                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-orange-500/10 hover:text-orange-400 transition-all duration-300 border border-orange-500/30 scale-[0.8]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span className="font-medium text-xs">Admin</span>
                  </Link>
                )}

                {/* Separator */}
                <div className="border-t border-gray-600/30 my-1" />

                {/* Login/Logout Mobile */}
                {isAuthenticated ? (
                  <button 
                    onClick={() => {
                      logout();
                      forceLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 p-2 rounded-lg bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 hover:bg-yellow-500/30 transition-all duration-300 w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium text-sm">Sair</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setLoginModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] hover:text-white transition-all duration-300 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium text-sm">Entrar</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={walletModalOpen} 
        onClose={() => setWalletModalOpen(false)} 
      />

      {/* Login Modal - só quando solicitado */}
      <LoginModal 
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={(userData, rememberMe = false) => {
          console.log('✅ Login success, user data:', userData);
          login(userData, rememberMe); // Usar login do AuthContext com opção "lembrar"
          setLoginModalOpen(false);
        }}
      />

      {/* How It Works Modal */}
      <HowItWorksModal 
        isOpen={howItWorksOpen} 
        onClose={() => setHowItWorksOpen(false)}
      />

    </>
  );
}
