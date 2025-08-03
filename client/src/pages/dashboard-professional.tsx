import { useAuth } from "@/hooks/useAuth";
import { ProfessionalDashboard } from "@/components/dashboard/professional-dashboard";

export default function ProfessionalDashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center" style={{ position: 'relative', zIndex: 1 }}>
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Admin bypass - permitir acesso total ao dashboard profissional
  const isAdmin = user?.email === 'passosmir4@gmail.com' || user?.email === 'passossmir4@gmail.com';
  
  // Use dados diretos do auth do Supabase se autenticado
  const displayUser = isAuthenticated && user ? {
    id: user.id,
    username: user.username,
    email: user.email,
    userType: isAdmin ? "professional" : (user.userType || "professional"),
    tokens: user.tokens || 0,
    plan: user.plan || "free"
  } : {
    id: 1,
    username: "Profissional Demo", 
    email: "prof@orbitrum.com",
    userType: "professional",
    tokens: 5000,
    plan: "pro"
  };

  console.log('🚀 PROFESSIONAL DASHBOARD - User:', displayUser.username);

  return <ProfessionalDashboard user={displayUser} />;
}