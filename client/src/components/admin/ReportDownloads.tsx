import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Table, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReportDownloads() {
  const [loading, setLoading] = useState<{ pdf: boolean; excel: boolean }>({
    pdf: false,
    excel: false
  });
  const { toast } = useToast();

  const downloadReport = async (type: 'pdf' | 'excel') => {
    try {
      setLoading(prev => ({ ...prev, [type]: true }));
      
      const response = await fetch(`/api/admin/reports/${type}`, {
        method: 'GET',
        headers: {
          'Accept': type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao baixar relatório: ${response.statusText}`);
      }

      // Obter o nome do arquivo do header ou criar um padrão
      const disposition = response.headers.get('content-disposition');
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `orbitrum-relatorio-${new Date().toISOString().split('T')[0]}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;

      // Converter resposta para blob
      const blob = await response.blob();
      
      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Limpar recursos
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Concluído",
        description: `Relatório ${type.toUpperCase()} baixado com sucesso!`,
        variant: "default",
      });

    } catch (error) {
      console.error(`Erro ao baixar relatório ${type}:`, error);
      toast({
        title: "Erro no Download",
        description: `Falha ao baixar relatório ${type.toUpperCase()}. Tente novamente.`,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Relatório PDF */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <FileText className="h-5 w-5" />
            Relatório PDF
          </CardTitle>
          <CardDescription className="text-slate-400">
            Relatório executivo completo em formato PDF para apresentações e arquivamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <p>• Resumo executivo com métricas principais</p>
              <p>• Análise de crescimento e performance</p>
              <p>• Top profissionais e distribuição geográfica</p>
              <p>• Formatação profissional para relatórios</p>
            </div>
            
            <Button 
              onClick={() => downloadReport('pdf')}
              disabled={loading.pdf}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              {loading.pdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Relatório PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Relatório Excel */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Table className="h-5 w-5" />
            Relatório Excel
          </CardTitle>
          <CardDescription className="text-slate-400">
            Planilha Excel com múltiplas abas para análise detalhada de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <p>• Múltiplas abas organizadas por categoria</p>
              <p>• Dados brutos para análises personalizadas</p>
              <p>• Tabelas dinâmicas e gráficos integrados</p>
              <p>• Compatível com Excel, Google Sheets, LibreOffice</p>
            </div>
            
            <Button 
              onClick={() => downloadReport('excel')}
              disabled={loading.excel}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading.excel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Excel...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Relatório Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card className="md:col-span-2 border-slate-700 bg-slate-800/30">
        <CardHeader>
          <CardTitle className="text-slate-300 text-lg">📊 Sobre os Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-400">
            <div>
              <h4 className="font-semibold text-slate-300 mb-2">🔄 Frequência</h4>
              <p>Dados atualizados em tempo real. Recomendamos baixar relatórios semanalmente para acompanhamento de tendências.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-300 mb-2">📈 Métricas Incluídas</h4>
              <p>Usuários, receita, saques, profissionais ativos, distribuição geográfica, performance do sistema e transações.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-300 mb-2">🔒 Segurança</h4>
              <p>Relatórios contêm dados sensíveis. Armazene com segurança e compartilhe apenas com pessoal autorizado.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}