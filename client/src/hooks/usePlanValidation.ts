import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface FreePlanLimits {
  monthlyAiSearches: number;
  planetViewsEvery3Days: number;
  dailyProfileViews: number;
  monthlyMessages: number;
  lastMonthlyReset: string;
  lastDailyReset: string;
  lastPlanetViewReset: string;
}

interface FreePlanStatus {
  isFreePlan: boolean;
  unlimited?: boolean;
  limits?: FreePlanLimits;
  planName?: string;
}

interface ConsumeResponse {
  success: boolean;
  consumed: boolean;
  remaining?: number;
  reason?: string;
  message?: string;
}

// Hook para obter status e limites do plano Free Orbitrum
export function useFreePlanStatus() {
  return useQuery<FreePlanStatus>({
    queryKey: ['/api/free-plan/limits'],
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para consumir uma busca de IA
export function useConsumeAiSearch() {
  const queryClient = useQueryClient();
  
  return useMutation<ConsumeResponse, Error>({
    mutationFn: async () => {
      const response = await fetch('/api/free-plan/consume/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/free-plan/limits'] });
    },
  });
}

// Hook para consumir uma visualização de planeta
export function useConsumePlanetView() {
  const queryClient = useQueryClient();
  
  return useMutation<ConsumeResponse, Error>({
    mutationFn: async () => {
      const response = await fetch('/api/free-plan/consume/planet-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/free-plan/limits'] });
    },
  });
}

// Hook para consumir uma visualização de perfil
export function useConsumeProfileView() {
  const queryClient = useQueryClient();
  
  return useMutation<ConsumeResponse, Error>({
    mutationFn: async () => {
      const response = await fetch('/api/free-plan/consume/profile-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/free-plan/limits'] });
    },
  });
}

// Hook para consumir uma mensagem recebida
export function useConsumeMessage() {
  const queryClient = useQueryClient();
  
  return useMutation<ConsumeResponse, Error>({
    mutationFn: async () => {
      const response = await fetch('/api/free-plan/consume/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/free-plan/limits'] });
    },
  });
}

// Função helper para verificar se uma ação está limitada
export function useCanPerformAction(actionType: 'aiSearch' | 'planetView' | 'profileView' | 'message') {
  const { data: planStatus } = useFreePlanStatus();
  
  if (!planStatus || !planStatus.isFreePlan || planStatus.unlimited) {
    return { canPerform: true, reason: null };
  }

  const limits = planStatus.limits;
  if (!limits) {
    return { canPerform: true, reason: null };
  }

  switch (actionType) {
    case 'aiSearch':
      return {
        canPerform: limits.monthlyAiSearches > 0,
        reason: limits.monthlyAiSearches <= 0 ? 'monthly_ai_searches_exceeded' : null,
        remaining: limits.monthlyAiSearches
      };
    case 'planetView':
      return {
        canPerform: limits.dailyPlanetViews > 0,
        reason: limits.dailyPlanetViews <= 0 ? 'daily_planet_views_exceeded' : null,
        remaining: limits.dailyPlanetViews
      };
    case 'profileView':
      return {
        canPerform: limits.dailyProfileViews > 0,
        reason: limits.dailyProfileViews <= 0 ? 'daily_profile_views_exceeded' : null,
        remaining: limits.dailyProfileViews
      };
    case 'message':
      return {
        canPerform: limits.monthlyMessages > 0,
        reason: limits.monthlyMessages <= 0 ? 'monthly_messages_exceeded' : null,
        remaining: limits.monthlyMessages
      };
    default:
      return { canPerform: true, reason: null };
  }
}

// Hook de validação de planos (mantido para compatibilidade)
export function usePlanValidation() {
  return {
    canPurchase: true,
    reason: null,
    daysRemaining: 0
  };
}