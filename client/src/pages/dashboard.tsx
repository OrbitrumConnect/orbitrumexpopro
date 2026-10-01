import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from '@/lib/isAdmin';
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      // Admin master vai diretamente para dashboard admin
      if (isAdminUser(user)) {
        setLocation('/admin');
        return;
      }
      setLocation('/dashboard-selector');
    }
  }, [setLocation, user]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#020914', position: 'relative', zIndex: 1 }}>
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
        <div className="text-white">Redirecionando para seleção de dashboard...</div>
      </div>
    </div>
  );
}