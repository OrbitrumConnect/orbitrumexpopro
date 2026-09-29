import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
// import { User } from '../../shared/schema';

// Enriquece o usuário com o registro de public.users (papel, admin_level, id real).
// Defensivo: qualquer falha só retorna o user como está — nunca quebra a sessão.
async function enriquecerComPerfil(u: any): Promise<any> {
  try {
    const sid = u?.id || u?.supabase_id;
    if (!sid) return u;
    const { data: row } = await supabase.from('users').select('*').eq('supabase_id', sid).maybeSingle();
    if (!row) return u;
    return {
      ...u,
      ...row,
      email: u.email ?? (row as any).email,
      isAdmin: ((row as any).admin_level ?? 0) >= 1 || (row as any).user_type === 'admin',
    };
  } catch {
    return u;
  }
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (userData: any, rememberMe?: boolean) => void;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Performance: Memoizar funções para evitar re-renders

  // Verificar se há sessão salva no localStorage
  useEffect(() => {
    const savedAuth = localStorage.getItem("orbtrum_auth");
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        if (authData.user && authData.timestamp) {
          // Verificar expiração baseada em "lembrar" ou timestamp
          const isExpired = authData.expiresAt ? 
            Date.now() > authData.expiresAt : 
            (Date.now() - authData.timestamp) > (24 * 60 * 60 * 1000);
            
          if (!isExpired) {
            setUser(authData.user);
            setIsAuthenticated(true);
            setShowLoginModal(false);
            console.log(`🔐 Sessão restaurada: ${authData.rememberMe ? '30 dias' : '24 horas'}`);
            // Re-enriquece a sessão salva com o perfil do banco (papel/admin/id real).
            enriquecerComPerfil(authData.user).then(u => {
              if (u !== authData.user) {
                setUser(u);
                try {
                  localStorage.setItem("orbtrum_auth", JSON.stringify({ ...authData, user: u }));
                } catch {}
              }
            });
            return;
          } else {
            console.log('🕒 Sessão expirada, removendo...');
            localStorage.removeItem("orbtrum_auth");
          }
        }
      } catch (error) {
        console.log('Erro ao recuperar sessão:', error);
      }
    }
    
    // Se não há sessão válida, não mostrar modal automaticamente
    setIsAuthenticated(false);
    setUser(null);
    setShowLoginModal(false);
  }, []);

  // Funções memoizadas para performance
  const login = useCallback((userData: any, rememberMe: boolean = false) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowLoginModal(false);
    
    // Salvar no localStorage com duração baseada em "lembrar"
    const sessionData = {
      user: userData,
      timestamp: Date.now(),
      rememberMe: rememberMe,
      // Se "lembrar" = 30 dias, senão = 24 horas
      expiresAt: Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
    };
    
    localStorage.setItem("orbtrum_auth", JSON.stringify(sessionData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("orbtrum_auth");
    setShowLoginModal(true);
  }, []);

  // Memoizar o valor do context para evitar re-renders
  const contextValue = useMemo(() => ({
    isAuthenticated,
    user,
    login,
    logout,
    showLoginModal,
    setShowLoginModal,
  }), [isAuthenticated, user, login, logout, showLoginModal]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
} 