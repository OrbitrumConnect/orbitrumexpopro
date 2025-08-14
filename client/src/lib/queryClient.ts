import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Pequeno roteador: converte chaves '/api/*' em chamadas Supabase
async function queryKeyToData(keyString: string): Promise<any> {
  // Profissionais - lista
  if (keyString === "/api/professionals") {
    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .order("id", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  // Profissionais - detalhe
  const profDetail = keyString.match(/^\/api\/professionals\/(\d+)$/);
  if (profDetail) {
    const id = Number(profDetail[1]);
    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data ?? null;
  }

  // Serviços do profissional
  const profServices = keyString.match(/^\/api\/professionals\/(\d+)\/services$/);
  if (profServices) {
    const id = Number(profServices[1]);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("professional_id", id)
      .order("id", { ascending: true });
    if (error) throw error;
    return { services: data ?? [] };
  }

  // Limites do plano gratuito (fallback local; pode ser migrado para tabela se existir)
  if (keyString === "/api/free-plan/limits") {
    return { dailyMessages: 10, remaining: 10, canUse: true };
  }

  // Endpoints ainda não mapeados: retornar vazio para não quebrar UI
  if (keyString.startsWith("/api/")) {
    return null;
  }

  // Fallback para a estratégia antiga (fetch direto da URL da key)
  const res = await fetch(keyString, {
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return await res.json();
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Se ainda houver usos de '/api/*' para mutations, por ora retornamos 400 claro
  if (url.startsWith("/api/")) {
    throw new Error(`Endpoint não disponível: ${url}. A lógica deve usar Supabase diretamente.`);
  }
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
    const keyString = Array.isArray(queryKey) ? queryKey.join("/") : String(queryKey);

    // Novo caminho: resolver via supabase quando a key simula '/api/*'
    if (keyString.startsWith("/api/")) {
      return (await queryKeyToData(keyString)) as any;
    }

    const res = await fetch(keyString, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as any;
    }

    await throwIfResNotOk(res);
    return (await res.json()) as any;
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
