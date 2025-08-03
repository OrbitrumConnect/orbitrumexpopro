import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      // Admin master vai diretamente para dashboard admin
      if (user?.email === 'passosmir4@gmail.com') {
        console.log('🚀 ADMIN MASTER - Redirecionando diretamente para /admin');
        setLocation('/admin');
        return;
      }
      
      // Outros usuários vão para seletor
      console.log('🚀 REDIRECIONANDO para seletor de dashboard');
      setLocation('/dashboard-selector');
    }
  }, [isLoading, setLocation, user]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center" style={{ position: 'relative', zIndex: 1 }}>
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
        <div className="text-white">Redirecionando para seleção de dashboard...</div>
      </div>
    </div>
  );
}