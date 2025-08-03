import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

// Hook otimizado para queries com cache inteligente
export function useOptimizedQuery<T>(
  queryKey: string | readonly unknown[],
  options?: Omit<UseQueryOptions<T>, 'queryKey'>
): UseQueryResult<T> {
  
  // Cache times baseado no tipo de dados
  const optimizedOptions = useMemo(() => {
    const keyString = Array.isArray(queryKey) ? queryKey.join('/') : String(queryKey);
    
    let staleTime = 10 * 60 * 1000; // Default 10 minutos
    let gcTime = 30 * 60 * 1000; // Default 30 minutos
    
    // Otimizações específicas por tipo de dados
    if (keyString.includes('professionals')) {
      staleTime = 20 * 60 * 1000; // 20 minutos - dados menos dinâmicos
      gcTime = 60 * 60 * 1000; // 1 hora
    } else if (keyString.includes('wallet') || keyString.includes('tokens')) {
      staleTime = 5 * 60 * 1000; // 5 minutos - dados financeiros
      gcTime = 15 * 60 * 1000; // 15 minutos
    } else if (keyString.includes('notifications')) {
      staleTime = 2 * 60 * 1000; // 2 minutos - notificações
      gcTime = 10 * 60 * 1000; // 10 minutos
    } else if (keyString.includes('users')) {
      staleTime = 15 * 60 * 1000; // 15 minutos - dados de usuário
      gcTime = 45 * 60 * 1000; // 45 minutos
    }

    return {
      staleTime,
      gcTime,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1, // Apenas 1 retry para otimizar performance
      retryDelay: 500,
      ...options,
    };
  }, [queryKey, options]);

  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    ...optimizedOptions,
  } as UseQueryOptions<T>);
}

// Hook para queries que raramente mudam
export function useStaticQuery<T>(
  queryKey: string | readonly unknown[],
  options?: Omit<UseQueryOptions<T>, 'queryKey'>
): UseQueryResult<T> {
  return useOptimizedQuery(queryKey, {
    staleTime: Infinity, // Cache infinito
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
    ...options,
  });
}

// Hook para queries que mudam frequentemente
export function useDynamicQuery<T>(
  queryKey: string | readonly unknown[],
  options?: Omit<UseQueryOptions<T>, 'queryKey'>
): UseQueryResult<T> {
  return useOptimizedQuery(queryKey, {
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  });
}