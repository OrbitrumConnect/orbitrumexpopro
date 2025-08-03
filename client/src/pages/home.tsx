import { StarfieldBackground } from "@/components/starfield-background";
import { Header } from "@/components/header";
import { OrbitSystem } from "@/components/orbit-system";
import { MatrixFooter } from "@/components/matrix-footer";
import { CreditSystem } from "@/components/credit-system";

import { ProfessionalModal } from "@/components/professional-modal";
import { PlansModal } from "@/components/plans-modal";
import { PlansTrigger } from "@/components/plans-trigger";
import { LoginModal } from "@/components/login-modal";
import { ProfessionalCategoryModal } from "@/components/professional-category-modal";
import { FreePlanLimits } from "@/components/free-plan-limits";

import { useState, useEffect, useRef } from "react";

export default function Home() {

  const [professionalModalOpen, setProfessionalModalOpen] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [autoOpenSearch, setAutoOpenSearch] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [pendingProfessionalData, setPendingProfessionalData] = useState<{email: string, userData: any} | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);


  // Detectar parâmetro de busca automática na URL e login Google
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Auto search
    if (urlParams.get('search') === 'true') {
      console.log('🚀 AUTO SEARCH - Parâmetro detectado, abrindo busca automaticamente');
      setAutoOpenSearch(true);
    }
    
    // Google login success
    if (urlParams.get('google_login') === 'success') {
      const userType = urlParams.get('type');
      const userEmail = urlParams.get('email');
      
      console.log(`✅ Login Google bem-sucedido como ${userType}, email: ${userEmail}`);
      
      // Se é profissional e precisa completar categoria
      if (userType === 'professional' && urlParams.get('needs_category') === 'true') {
        console.log('👔 Profissional precisa escolher categoria');
        setPendingProfessionalData({
          email: userEmail || 'user@gmail.com',
          userData: { userType: 'professional' }
        });
        setCategoryModalOpen(true);
        // Limpar parâmetros mas manter modal aberto
        window.history.replaceState({}, '', window.location.pathname);
        return;
      } else {
        console.log(`✅ ${userType === 'professional' ? '👔 Profissional' : '👤 Cliente'} logado via Google`);
        // Recarregar a página para atualizar o estado de autenticação
        window.location.href = '/';
        return;
      }
    }
    
    // Limpar parâmetros da URL
    if (urlParams.toString()) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);



  const handleOpenProfessional = (id: number) => {
    console.log('🚀 FUNÇÃO handleOpenProfessional CHAMADA COM ID:', id);
    console.log('🚀 Estado ANTES:', { professionalModalOpen, selectedProfessionalId });
    setSelectedProfessionalId(id);
    setProfessionalModalOpen(true);
    console.log('🚀 Estados DEFINIDOS - Modal: true, ID:', id);
  };

  const handleCloseProfessional = () => {
    setProfessionalModalOpen(false);
    setSelectedProfessionalId(null);
  };

  const handleOpenPlans = () => {
    setPlansModalOpen(true);
  };

  const handleClosePlans = () => {
    setPlansModalOpen(false);
  };

  const handleOpenLogin = () => {
    setLoginModalOpen(true);
  };

  const handleCloseLogin = () => {
    setLoginModalOpen(false);
  };

  const handleCompleteProfessionalCategory = async (category: string, specialty: string) => {
    try {
      console.log('📝 Completando cadastro profissional:', { category, specialty });
      
      const response = await fetch('/api/auth/complete-professional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingProfessionalData?.email,
          category,
          specialty
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Cadastro profissional completado');
        setCategoryModalOpen(false);
        setPendingProfessionalData(null);
        // Recarregar para mostrar usuário logado
        window.location.href = '/';
      } else {
        console.error('❌ Erro ao completar cadastro:', data.message);
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
    }
  };

  const handleCancelProfessionalCategory = () => {
    setCategoryModalOpen(false);
    setPendingProfessionalData(null);
    console.log('❌ Cadastro profissional cancelado');
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <StarfieldBackground />
      <Header 
        onOpenGame={() => window.location.href = '/jogo'}
        onOpenPlans={() => setPlansModalOpen(true)}
      />
      
      {/* Texto de instrução espacial */}
      <div className="smoke-trail-text">
        <span className="hover:text-yellow-400 hover:drop-shadow-[0_0_8px_rgba(255,255,0,0.3)] transition-all duration-300">
          Conecte-se com profissionais próximos
        </span>
        <span className="ml-2 hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.3)] transition-all duration-300" 
              style={{ fontSize: '0.9em' }}>
          Clique no Cérebro
        </span>
      </div>
      
      <main className="min-h-screen flex items-center justify-center relative pt-16 sm:pt-8 md:pt-12 pb-20 sm:pb-8 md:pb-12">
        <div className="w-full h-full max-w-full max-h-[85vh] sm:max-h-[95vh] flex items-center justify-center px-1 md:px-2">
          <OrbitSystem 
            onOpenProfessional={handleOpenProfessional} 
            onOpenLogin={handleOpenLogin}
            autoOpenSearch={autoOpenSearch}
            onSearchOpened={() => setAutoOpenSearch(false)}
            onSearchStateChange={setIsSearchActive}
          />
        </div>
      </main>
      <MatrixFooter />
      <CreditSystem isSearchActive={isSearchActive} />
      <PlansTrigger onClick={handleOpenPlans} isSearchActive={isSearchActive} />
      
      {/* Sistema de Limitações Free Orbitrum */}
      <FreePlanLimits onUpgrade={handleOpenPlans} />

      

      
      {professionalModalOpen && selectedProfessionalId && (
        <ProfessionalModal 
          isOpen={professionalModalOpen}
          onClose={handleCloseProfessional}
          professionalId={selectedProfessionalId}
        />
      )}
      
      <PlansModal 
        isOpen={plansModalOpen}
        onClose={handleClosePlans}
        onOpenLogin={handleOpenLogin}
      />

      <LoginModal 
        isOpen={loginModalOpen}
        onClose={handleCloseLogin}
        onSuccess={() => {}}
      />

      {/* Modal de categoria profissional */}
      <ProfessionalCategoryModal
        isOpen={categoryModalOpen}
        onComplete={handleCompleteProfessionalCategory}
        onCancel={handleCancelProfessionalCategory}
        userEmail={pendingProfessionalData?.email || ""}
      />
    </div>
  );
}
