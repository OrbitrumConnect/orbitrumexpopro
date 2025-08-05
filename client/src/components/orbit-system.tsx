import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { NeuralBrain } from "./neural-brain";
import { SimpleOrb } from "./simple-orb";
import { SearchBar } from "./search-bar";
import { SearchLimitModal } from "./search-limit-modal";
import { TeamSelectionSystem } from "./team-selection-system";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
// import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import type { Professional } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { PerformanceMonitor } from "@/utils/performance-monitor";

interface OrbitSystemProps {
  onOpenProfessional: (id: number) => void;
  onOpenLogin: () => void;
  autoOpenSearch?: boolean;
  onSearchOpened?: () => void;
  onSearchStateChange?: (isActive: boolean) => void;
}

// Memoizado para evitar re-renders desnecessários
const OrbitSystem = memo(({ onOpenProfessional, onOpenLogin, autoOpenSearch, onSearchOpened, onSearchStateChange }: OrbitSystemProps) => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Professional[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [accumulatedProfessionals, setAccumulatedProfessionals] = useState<Professional[]>([]);
  const [removedProfessionals, setRemovedProfessionals] = useState<Set<number>>(new Set());
  const [orbitKey, setOrbitKey] = useState(0); // Key para forçar re-render limpo
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showTeamSelection, setShowTeamSelection] = useState(false);

  const { isAuthenticated, user } = useAuth();
  
  // Admin bypass - verificar se é admin
  const isAdmin = user?.email === 'passosmir4@gmail.com' || user?.email === 'passossmir4@gmail.com';

  // Performance monitor - memoizado
  const performanceMonitor = useMemo(() => PerformanceMonitor.getInstance(), []);

  // Debounce search query - otimizado para reduzir chamadas
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-abrir busca otimizado
  const hasAutoOpened = useRef(false);
  useEffect(() => {
    if (autoOpenSearch && !hasAutoOpened.current) {
      setSearchExpanded(true);
      hasAutoOpened.current = true;
      onSearchOpened?.();
    }
    if (!autoOpenSearch) {
      hasAutoOpened.current = false;
    }
  }, [autoOpenSearch, onSearchOpened]);
  
  // Notificar mudanças no estado da busca
  useEffect(() => {
    onSearchStateChange?.(searchExpanded);
  }, [searchExpanded, onSearchStateChange]);


  // Hook para buscar profissionais via API
  const { data: allProfessionals = [], isLoading } = useQuery<Professional[]>({
    queryKey: ['/api/professionals'],
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // DADOS FALLBACK - Apenas para caso a API falhe
  const fallbackProfessionals = React.useMemo(() => [
    { 
      id: 1, 
      name: "Carlos Silva", 
      title: "Pintor Profissional", 
      rating: 4.8, 
      reviewCount: 234, 
      skills: ["Pintura Residencial", "Pintura Comercial"], 
      hourlyRate: 2500, 
      isDemo: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      orbitRing: 1,
      orbitPosition: 0,
      available: true
    },
    { 
      id: 2, 
      name: "Ana Santos", 
      title: "Desenvolvedora React", 
      rating: 4.9, 
      reviewCount: 189, 
      skills: ["React", "TypeScript", "Node.js"], 
      hourlyRate: 3000, 
      isDemo: true,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b2e5c5b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      orbitRing: 1,
      orbitPosition: 1,
      available: true
    },
    { 
      id: 3, 
      name: "Roberto Lima", 
      title: "Personal Trainer", 
      rating: 4.7, 
      reviewCount: 156, 
      skills: ["Musculação", "Cardio", "Nutrição"], 
      hourlyRate: 2000, 
      isDemo: true,
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      orbitRing: 1,
      orbitPosition: 2,
      available: true
    },
    { 
      id: 4, 
      name: "Maria Silva", 
      title: "Designer UI/UX", 
      rating: 4.8, 
      reviewCount: 201, 
      skills: ["Figma", "Adobe XD", "Photoshop"], 
      hourlyRate: 2800, 
      isDemo: true,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      orbitRing: 1,
      orbitPosition: 3,
      available: true
    },
    { 
      id: 5, 
      name: "José Santos", 
      title: "Eletricista", 
      rating: 4.9, 
      reviewCount: 178, 
      skills: ["Instalação Elétrica", "Manutenção"], 
      hourlyRate: 2200, 
      isDemo: true,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      orbitRing: 1,
      orbitPosition: 4,
      available: true
    },
    { 
      id: 6, 
      name: "Lucia Pereira", 
      title: "Advogada", 
      rating: 4.7, 
      reviewCount: 134, 
      skills: ["Direito Civil", "Trabalhista"], 
      hourlyRate: 3500, 
      isDemo: true,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      orbitRing: 2,
      orbitPosition: 0,
      available: true
    },
    { 
      id: 7, 
      name: "Pedro Costa", 
      title: "Jardineiro", 
      rating: 4.8, 
      reviewCount: 167, 
      skills: ["Paisagismo", "Manutenção"], 
      hourlyRate: 1800, 
      isDemo: true,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      orbitRing: 2,
      orbitPosition: 1,
      available: true
    },
    { 
      id: 8, 
      name: "Elena Rodriguez", 
      title: "Tradutora", 
      rating: 4.9, 
      reviewCount: 198, 
      skills: ["Inglês", "Espanhol", "Português"], 
      hourlyRate: 2600, 
      isDemo: true,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      orbitRing: 2,
      orbitPosition: 2,
      available: true
    },
    { 
      id: 9, 
      name: "Bruno Oliveira", 
      title: "Programador Python", 
      rating: 4.8, 
      reviewCount: 223, 
      skills: ["Python", "Django", "FastAPI"], 
      hourlyRate: 3200, 
      isDemo: true,
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      orbitRing: 2,
      orbitPosition: 3,
      available: true
    },
    { 
      id: 10, 
      name: "Carla Mendes", 
      title: "Psicóloga", 
      rating: 4.9, 
      reviewCount: 189, 
      skills: ["Terapia Cognitiva", "Ansiedade"], 
      hourlyRate: 2400, 
      isDemo: true,
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      orbitRing: 2,
      orbitPosition: 4,
      available: true
    }
  ], []);

  const handleBrainClick = () => {
    // ADMIN BYPASS: Admin pode pesquisar sem restrições
    if (isAdmin) {
      if (searchExpanded) {
        setSearchExpanded(false);
        setHasSearched(false);
        setAccumulatedProfessionals([]);
        setSearchQuery("");
        setSearchResults([]);
      } else {
        setSearchExpanded(true);
      }
      return;
    }

    // Bloquear pesquisa para usuários deslogados
    if (!isAuthenticated) {
      // Verificar se usuário free já usou pesquisa mensal
      const freeSearchUsed = localStorage.getItem('free_search_used');
      const currentMonth = new Date().getMonth() + '-' + new Date().getFullYear();
      
      if (freeSearchUsed === currentMonth) {
        setShowLimitModal(true);
        return;
      }
      
      // Marcar que a pesquisa foi usada este mês
      localStorage.setItem('free_search_used', currentMonth);
      
      // Permitir a pesquisa apenas uma vez
      setSearchExpanded(true);
      return;
    }

    if (searchExpanded) {
      // If closing search, reset to initial 10 best professionals
      setSearchExpanded(false);
      setHasSearched(false);
      setAccumulatedProfessionals([]);
      setSearchQuery("");
      setSearchResults([]);
      setOrbitKey(prev => prev + 1); // Forçar re-render completo
    } else {
      // Open search
      setSearchExpanded(true);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Smart search with typo tolerance
  const smartSearch = (text: string, query: string): boolean => {
    const normalize = (str: string) => str.toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]/g, '');

    const cleanText = normalize(text);
    const cleanQuery = normalize(query);
    
    // Direct match
    if (cleanText.includes(cleanQuery)) return true;
    
    // Partial word matches
    const words = cleanText.split(' ');
    for (const word of words) {
      if (word.includes(cleanQuery) || cleanQuery.includes(word)) return true;
    }
    
    // Simple typo tolerance for common mistakes
    const typoVariants = [
      cleanQuery.replace('ss', 's'),     // eletrisista -> eletrista
      cleanQuery.replace('s', 'ss'),     // eletrista -> eletrisista  
      cleanQuery.replace('z', 's'),      // mecanizo -> mecaniso
      cleanQuery.replace('s', 'z'),      // mecaniso -> mecanizo
      cleanQuery.replace('c', 'qu'),     // mecanico -> mequanico
      cleanQuery.replace('qu', 'c'),     // mequanico -> mecanico
    ];
    
    return typoVariants.some(variant => cleanText.includes(variant));
  };

  // Sistema inteligente: usar dados da API com fallback
  const availableProfessionals = (allProfessionals as any[]).length > 0 ? allProfessionals : fallbackProfessionals;

  // Update search results when query changes - usar API real
  useEffect(() => {
    if (debouncedQuery.trim()) {
      // Fazer busca real via API
      const searchProfessionals = async () => {
        try {
          const response = await fetch(`/api/professionals/search?q=${encodeURIComponent(debouncedQuery)}`);
          if (response.ok) {
            const apiResults = await response.json();
            console.log(`🔍 BUSCA API: "${debouncedQuery}" retornou ${apiResults.length} profissionais`);
            setSearchResults(apiResults.slice(0, 6)); // Máximo 6 profissionais
          } else {
            console.error('Erro na busca API:', response.status);
            // Busca fallback nos dados locais como backup
            const filtered = (availableProfessionals as any[]).filter((p: any) =>
              smartSearch(p.name, debouncedQuery) ||
              smartSearch(p.title, debouncedQuery) ||
              p.skills?.some((skill: any) => smartSearch(skill, debouncedQuery))
            ).slice(0, 6);
            setSearchResults(filtered);
          }
        } catch (error) {
          console.error('Erro ao buscar profissionais:', error);
          // Fallback para dados locais
          const filtered = availableProfessionals.filter(p =>
            smartSearch(p.name, debouncedQuery) ||
            smartSearch(p.title, debouncedQuery) ||
            p.skills?.some(skill => smartSearch(skill, debouncedQuery))
          ).slice(0, 6);
          setSearchResults(filtered);
        }
      };
      
      searchProfessionals();
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, availableProfessionals]);

  // Function to confirm search results and REPLACE all professionals
  const confirmSearchResults = useCallback(() => {
    if (searchResults.length > 0) {
      // SUBSTITUIR completamente os profissionais, limitando a 6
      setAccumulatedProfessionals(searchResults.slice(0, 6)); // Máximo 6 profissionais
      setHasSearched(true);
      setRemovedProfessionals(new Set()); // Reset removed list
      setOrbitKey(prev => prev + 1); // Forçar re-render limpo
      // Clear search after confirming
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [searchResults]);

  const handleRemoveProfessional = (id: number) => {
    setRemovedProfessionals(prev => new Set([...prev, id]));
  };
  
  // Separar profissionais reais dos demonstrativos
  const realProfessionals = availableProfessionals.filter(p => !p.isDemo);
  const demoProfessionals = availableProfessionals.filter(p => p.isDemo);
  
  let topProfessionals;
  if (realProfessionals.length >= 10) {
    // Se temos profissionais reais suficientes, usar apenas eles
    topProfessionals = realProfessionals
      .sort((a, b) => b.rating - a.rating)
      .slice(0, isAuthenticated ? 10 : 18);
  } else if (realProfessionals.length > 0) {
    // Se temos alguns profissionais reais, completar com demonstrativos
    const sortedReal = realProfessionals.sort((a, b) => b.rating - a.rating);
    const sortedDemo = demoProfessionals.sort((a, b) => b.rating - a.rating);
    const needed = (isAuthenticated ? 10 : 18) - sortedReal.length;
    topProfessionals = [...sortedReal, ...sortedDemo.slice(0, needed)];
  } else {
    // Se não temos profissionais reais, usar demonstrativos
    topProfessionals = demoProfessionals
      .sort((a, b) => b.rating - a.rating)
      .slice(0, isAuthenticated ? 10 : 18);
  }
  
  const displayProfessionals = (hasSearched ? accumulatedProfessionals : topProfessionals)
    .filter(prof => !removedProfessionals.has(prof.id));
  
  // Sistema funcionando: 10 melhores inicialmente, pesquisa substitui tudo

  // Distribute accumulated professionals across orbit rings
  let orbit1, orbit2, orbit3;
  
  // Distribuir profissionais igualmente nos 3 rings
  orbit1 = [];
  orbit2 = [];
  orbit3 = [];
  
  displayProfessionals.forEach((prof, index) => {
    const ring = (index % 3) + 1;
    if (ring === 1) orbit1.push(prof);
    else if (ring === 2) orbit2.push(prof);
    else orbit3.push(prof);
  });
  
  // Distribuição completa nos rings

  return (
    <div className="relative w-full h-full min-h-[90vh] max-h-[95vh] overflow-hidden scale-110" style={{ pointerEvents: 'none' }}>
      
      {/* Orbit Ring 1 - Clockwise */}
      <div className="absolute inset-0 flex items-center justify-center z-10" style={{ pointerEvents: 'none' }}>
        {orbit1.map((professional, index) => (
          <motion.div
            key={`${orbitKey}-ring1-${professional.id}-${index}`}
            className="orbit-ring-1 animate-orbit-cw absolute"
            style={{
              animationDelay: `${-index * 4 - Math.random() * 2}s`,
              '--initial-rotation': `${index * (360 / Math.max(orbit1.length, 1)) + (Math.random() - 0.5) * 30}deg`,
            } as React.CSSProperties}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              scale: hasSearched ? 1.1 : 1
            }}
            transition={{ 
              delay: index * 0.05,
              duration: 0.3,
              ease: "easeOut"
            }}
          >
            <SimpleOrb
              professional={professional}
              onClick={() => {
                console.log('CLICOU EM:', professional.name);
                onOpenProfessional(professional.id);
              }}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Orbit Ring 2 - Counter-clockwise */}
      <div className="absolute inset-0 flex items-center justify-center z-10" style={{ pointerEvents: 'none' }}>
        {orbit2.map((professional, index) => (
          <motion.div
            key={`${orbitKey}-ring2-${professional.id}-${index}`}
            className="orbit-ring-2 animate-orbit-ccw absolute"
            style={{
              animationDelay: `${-index * 5 - Math.random() * 3}s`,
              '--initial-rotation': `${index * (360 / Math.max(orbit2.length, 1)) + (Math.random() - 0.5) * 40}deg`,
            } as React.CSSProperties}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              scale: hasSearched ? 1.1 : 1
            }}
            transition={{ 
              delay: index * 0.05 + 0.2,
              duration: 0.3,
              ease: "easeOut"
            }}
          >
            <SimpleOrb
              professional={professional}
              onClick={() => {
                console.log('CLICOU EM:', professional.name);
                onOpenProfessional(professional.id);
              }}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Orbit Ring 3 - Clockwise (slow) */}
      <div className="absolute inset-0 flex items-center justify-center z-10" style={{ pointerEvents: 'none' }}>
        {orbit3.map((professional, index) => (
          <motion.div
            key={`${orbitKey}-ring3-${professional.id}-${index}`}
            className="orbit-ring-3 animate-orbit-slow absolute"
            style={{
              animationDelay: `${-index * 6 - Math.random() * 4}s`,
              '--initial-rotation': `${index * (360 / Math.max(orbit3.length, 1)) + (Math.random() - 0.5) * 50}deg`,
            } as React.CSSProperties}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              scale: hasSearched ? 1.1 : 1
            }}
            transition={{ 
              delay: index * 0.05 + 0.4,
              duration: 0.3,
              ease: "easeOut"
            }}
          >
            <SimpleOrb
              professional={professional}
              onClick={() => {
                console.log('CLICOU EM:', professional.name);
                onOpenProfessional(professional.id);
              }}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Central Neural Brain - Above orbits */}
      <div className="absolute inset-0 flex items-center justify-center z-45" style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center" style={{ pointerEvents: 'auto' }}>
          <NeuralBrain onClick={handleBrainClick} />
          
          {/* Search Bar - Below brain */}
          <div className="mt-8 relative z-50">
            <SearchBar 
              isExpanded={searchExpanded}
              onSearch={handleSearch}
              onClose={() => {
                setSearchExpanded(false);
                setSearchQuery("");
                setSearchResults([]);
                // Reset to initial 10 best when closing search
                setHasSearched(false);
                setAccumulatedProfessionals([]);
              }}
              onConfirm={() => {
                confirmSearchResults();
                setSearchExpanded(false);
              }}
            />
          </div>
        </div>
      </div>

      {/* Search Limit Modal */}
      <SearchLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onLogin={() => {
          setShowLimitModal(false);
          onOpenLogin();
        }}
      />



      {/* Sistema de Seleção de Equipes */}
      <TeamSelectionSystem
        isOpen={showTeamSelection}
        onClose={() => setShowTeamSelection(false)}
      />

    </div>
  );
});

// Exportar com displayName para debugging
OrbitSystem.displayName = 'OrbitSystem';

export { OrbitSystem };
