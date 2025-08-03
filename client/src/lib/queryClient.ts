import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // OTIMIZAÇÕES EXTREMAS
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false, // CRÍTICO: previne refetch desnecessário
      staleTime: 30 * 60 * 1000, // 30 minutos padrão
      gcTime: 60 * 60 * 1000, // 1 hora no cache
      retry: false, // SEM retry por padrão
      retryOnMount: false,
      networkMode: 'online',
      // Só notificar mudanças essenciais
      notifyOnChangeProps: ['data', 'error', 'isLoading'],
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    },
  },
});

// Função para configurar limpeza automática de cache
export function setupCacheCleanup() {
  setInterval(() => {
    const queries = queryClient.getQueryCache().getAll();
    let removedCount = 0;
    
    queries.forEach(query => {
      // Remove queries com mais de 1 hora sem uso
      if (query.state.dataUpdatedAt < Date.now() - 60 * 60 * 1000) {
        queryClient.getQueryCache().remove(query);
        removedCount++;
      }
    });
    
    if (removedCount > 0) {
      console.log(`🧹 ${removedCount} queries antigas removidas do cache`);
    }
  }, 10 * 60 * 1000); // A cada 10 minutos
}
