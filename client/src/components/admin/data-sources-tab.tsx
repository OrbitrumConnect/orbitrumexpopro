import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  RefreshCw, 
  Database, 
  Clock, 
  Activity,
  AlertCircle,
  CheckCircle,
  Users,
  DollarSign,
  UserCheck,
  Gamepad2,
  Server
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DataSource {
  id: string;
  name: string;
  description: string;
  lastUpdate: string;
  nextUpdate: string;
  status: 'active' | 'updating' | 'error';
  data: any;
  updateFrequency: string;
}

interface DataSourcesResponse {
  dataSources: DataSource[];
  currentTime: string;
  totalSources: number;
  activeSources: number;
}

export function DataSourcesTab() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const fetchDataSources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/data-sources');
      const data: DataSourcesResponse = await response.json();
      
      setDataSources(data.dataSources);
      setStats({
        currentTime: data.currentTime,
        totalSources: data.totalSources,
        activeSources: data.activeSources
      });
    } catch (error) {
      console.error('Erro ao buscar fontes de dados:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar fontes de dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataSources();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchDataSources, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateSource = async (sourceId: string) => {
    try {
      setUpdating(sourceId);
      const response = await fetch(`/api/admin/data-sources/${sourceId}/update`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        });
        await fetchDataSources();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar fonte de dados",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateAll = async () => {
    try {
      setUpdating('all');
      const response = await fetch('/api/admin/data-sources/update-all', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        });
        await fetchDataSources();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar todas as fontes",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getSourceIcon = (sourceId: string) => {
    switch (sourceId) {
      case 'usuarios':
        return <Users className="w-5 h-5" />;
      case 'financeiro':
        return <DollarSign className="w-5 h-5" />;
      case 'profissionais':
        return <UserCheck className="w-5 h-5" />;
      case 'jogos':
        return <Gamepad2 className="w-5 h-5" />;
      case 'sistema':
        return <Server className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'updating':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      updating: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      error: "bg-red-500/20 text-red-400 border-red-500/30"
    };

    const labels = {
      active: "Ativo",
      updating: "Atualizando",
      error: "Erro"
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || variants.active}>
        {labels[status as keyof typeof labels] || "Desconhecido"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-cyan-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Carregando fontes de dados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400">Fontes de Dados Diárias</h2>
          <p className="text-gray-400 text-sm">
            Última atualização: {stats?.currentTime} | {stats?.activeSources}/{stats?.totalSources} fontes ativas
          </p>
        </div>
        <Button
          onClick={handleUpdateAll}
          disabled={updating === 'all'}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {updating === 'all' ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Todas
            </>
          )}
        </Button>
      </div>

      {/* Grid de fontes de dados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dataSources.map((source) => (
          <Card key={source.id} className="bg-black/40 border-gray-700/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center text-cyan-400">
                    {getSourceIcon(source.id)}
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">{source.name}</CardTitle>
                    <p className="text-sm text-gray-400">{source.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(source.status)}
                  {getStatusBadge(source.status)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Informações de atualização */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Última atualização:</p>
                  <p className="text-white font-medium">{source.lastUpdate}</p>
                </div>
                <div>
                  <p className="text-gray-400">Próxima atualização:</p>
                  <p className="text-white font-medium">{source.nextUpdate}</p>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-gray-400">Frequência:</p>
                <p className="text-white font-medium">{source.updateFrequency}</p>
              </div>

              {/* Dados da fonte */}
              <div className="bg-gray-900/50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-cyan-400 mb-2">Dados Atuais:</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-1 text-xs">
                    {Object.entries(source.data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-white font-medium">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Botão de atualização individual */}
              <Button
                onClick={() => handleUpdateSource(source.id)}
                disabled={updating === source.id || source.status === 'updating'}
                variant="outline"
                size="sm"
                className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                {updating === source.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar Fonte
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações do sistema */}
      <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/10 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Sistema de Atualização Automática
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Horário de Atualização:</p>
              <p className="text-white font-medium">Diariamente às 00:00 (Brasília)</p>
            </div>
            <div>
              <p className="text-gray-400">Timezone:</p>
              <p className="text-white font-medium">America/Sao_Paulo</p>
            </div>
            <div>
              <p className="text-gray-400">Status do Sistema:</p>
              <p className="text-green-400 font-medium">🟢 Operacional</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
            <p className="text-blue-300 text-sm">
              ℹ️ As fontes de dados são atualizadas automaticamente todos os dias às 00:00 (horário de Brasília). 
              Você pode forçar uma atualização manual usando os botões acima quando necessário.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}