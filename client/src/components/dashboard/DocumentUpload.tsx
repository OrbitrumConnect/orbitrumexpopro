import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Camera, Home, CheckCircle, AlertCircle, Clock, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface DocumentUploadProps {
  user: any;
  title?: string;
  description?: string;
}

interface DocumentFile {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  file: File | null;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
}

export function DocumentUpload({ user, title, description }: DocumentUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [documents, setDocuments] = useState<DocumentFile[]>([
    {
      type: 'selfie',
      name: 'Selfie com Documento',
      description: 'Foto sua segurando RG ou CNH ao lado do rosto',
      icon: <Camera className="w-5 h-5" />,
      required: true,
      file: null,
      status: 'pending'
    },
    {
      type: 'id_document',
      name: 'Documento de Identidade',
      description: 'RG, CNH ou Passaporte (frente e verso)',
      icon: <FileText className="w-5 h-5" />,
      required: true,
      file: null,
      status: 'pending'
    },
    {
      type: 'proof_residence',
      name: 'Comprovante de Residência',
      description: 'Conta de luz, água, telefone (máximo 3 meses)',
      icon: <Home className="w-5 h-5" />,
      required: true,
      file: null,
      status: 'pending'
    }
  ]);

  // Query para buscar status dos documentos
  const { data: documentsStatus, isLoading } = useQuery({
    queryKey: ['/api/users/documents-status', user?.id],
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const response = await fetch(`/api/users/documents-status?userId=${user.id}`);
      if (!response.ok) throw new Error('Erro ao buscar status dos documentos');
      return response.json();
    }
  });

  // Mutation para upload de documentos
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/users/documents/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro no upload');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Documentos Enviados!",
        description: "Seus documentos foram enviados para análise. Aguarde a aprovação para liberar compra de planos.",
        variant: "default"
      });
      
      // Resetar arquivos selecionados
      setDocuments(prev => prev.map(doc => ({ ...doc, file: null, status: 'submitted' })));
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/users/documents-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no Upload",
        description: error.message || "Não foi possível enviar os documentos. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleFileChange = (type: string, file: File | null) => {
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    setDocuments(prev =>
      prev.map(doc =>
        doc.type === type ? { ...doc, file } : doc
      )
    );
  };

  const handleUpload = async () => {
    const filesToUpload = documents.filter(doc => doc.file);
    
    if (filesToUpload.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione pelo menos um documento para enviar",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('userId', user.id.toString());
    
    filesToUpload.forEach(doc => {
      if (doc.file) {
        formData.append(doc.type, doc.file);
      }
    });

    uploadMutation.mutate(formData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'submitted':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeitado</Badge>;
      case 'submitted':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Em Análise</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Pendente</Badge>;
    }
  };

  // Atualizar status dos documentos se houver dados do backend
  const documentsWithStatus = documents.map(doc => {
    const backendStatus = documentsStatus?.[doc.type];
    return {
      ...doc,
      status: backendStatus || doc.status
    };
  });

  const canMakePurchases = documentsStatus?.canMakePurchases || false;
  const overallStatus = documentsStatus?.status || 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-semibold text-white">
            {title || "Verificação de Documentos"}
          </h3>
        </div>
        <p className="text-gray-300 text-sm">
          {description || "Envie seus documentos para liberar a compra de planos pagos"}
        </p>
      </div>

      {/* Status Global */}
      {overallStatus !== 'pending' && (
        <div className={`p-4 rounded-lg border ${
          canMakePurchases 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
          <div className="flex items-center space-x-3">
            {getStatusIcon(overallStatus)}
            <div>
              <p className="font-medium text-white">
                {canMakePurchases ? 'Documentos Aprovados!' : 'Documentos em Análise'}
              </p>
              <p className="text-sm text-gray-300">
                {canMakePurchases 
                  ? 'Você já pode comprar planos pagos' 
                  : 'Aguarde a aprovação para liberar compras'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Documentos */}
      <div className="space-y-4">
        {documentsWithStatus.map((doc, index) => (
          <motion.div
            key={doc.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glassmorphism p-4 rounded-lg border border-gray-700"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="text-cyan-400">
                  {doc.icon}
                </div>
                <div>
                  <h4 className="font-medium text-white">{doc.name}</h4>
                  <p className="text-sm text-gray-400">{doc.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(doc.status)}
                {getStatusBadge(doc.status)}
              </div>
            </div>

            {/* Upload Area */}
            {doc.status !== 'approved' && (
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-cyan-500/50 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFileChange(doc.type, file);
                  }}
                  className="hidden"
                  id={`${doc.type}-upload`}
                />
                <label htmlFor={`${doc.type}-upload`} className="cursor-pointer">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    {doc.file ? doc.file.name : 'Clique para selecionar arquivo'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF até 5MB</p>
                </label>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Botao de Upload */}
      {overallStatus !== 'approved' && (
        <Button
          onClick={handleUpload}
          disabled={uploadMutation.isPending || documents.every(doc => !doc.file)}
          className="w-full neon-button bg-cyan-600 hover:bg-cyan-700"
        >
          {uploadMutation.isPending ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Enviando Documentos...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Enviar Documentos
            </>
          )}
        </Button>
      )}

      {/* Informações Adicionais */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>🔒 Seus documentos são protegidos pela LGPD</p>
        <p>⏱️ Análise realizada em até 24 horas</p>
        <p>📧 Você receberá notificação por email</p>
      </div>
    </motion.div>
  );
}