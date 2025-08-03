import { useAuth } from "@/hooks/useAuth";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";

export default function ClientDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  
  console.log('🚀 DASHBOARD CLIENT PAGE - Auth:', isAuthenticated, 'User:', user?.username);

  // Use dados diretos do auth do Supabase se autenticado
  const displayUser = isAuthenticated && user ? {
    id: user.id,
    username: user.username,
    email: user.email,
    userType: "client",
    tokens: user.tokens || 0,
    plan: user.plan || "free"
  } : {
    id: 1,
    username: "Usuário Demo", 
    email: "demo@orbitrum.com",
    userType: "client",
    tokens: 3000,
    plan: "pro"
  };

  console.log('🚀 CLIENT DASHBOARD - User:', displayUser.username);

  return <ClientDashboard user={displayUser} />;
}