import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, AlertCircle, Clock, FileText, Camera, Home, User } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DocumentUpload {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  file: File | null;
  uploaded: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

export default function DocumentVerification() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    {
      type: 'selfie',
      name: 'Selfie com Documento',
      description: 'Foto sua segurando RG ou CNH ao lado do rosto',
      icon: <Camera className="w-6 h-6" />,
      required: true,
      file: null,
      uploaded: false,
      status: 'pending'
    },
    {
      type: 'id_document',
      name: 'Documento de Identidade',
      description: 'RG, CNH ou Passaporte (frente e verso)',
      icon: <FileText className="w-6 h-6" />,
      required: true,
      file: null,
      uploaded: false,
      status: 'pending'
    },
    {
      type: 'proof_residence',
      name: 'Comprovante de Residência',
      description: 'Conta de luz, água, telefone (máximo 3 meses)',
      icon: <Home className="w-6 h-6" />,
      required: true,
      file: null,
      uploaded: false,
      status: 'pending'
    }
  ]);

  // Buscar status dos documentos
  const { data: documentsStatus } = useQuery({
    queryKey: ['/api/users/documents-status'],
    enabled: isAuthenticated
  });

  // Mutation para upload de documentos
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await fetch('/api/users/upload-document', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: () => {
      toast({
        title: "Documento enviado!",
        description: "Seu documento foi enviado para análise.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/documents-status'] });
    },
    onError: () => {
      toast({
        title: "Erro no upload",
        description: "Erro ao enviar documento. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (documentType: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Apenas JPG, PNG ou PDF são aceitos.",
        variant: "destructive"
      });
      return;
    }

    setDocuments(prev => prev.map(doc => 
      doc.type === documentType 
        ? { ...doc, file, uploaded: false }
        : doc
    ));
  };

  const handleUpload = async (documentType: string) => {
    const document = documents.find(doc => doc.type === documentType);
    if (!document?.file) return;

    const formData = new FormData();
    formData.append('document', document.file);
    formData.append('type', documentType);
    formData.append('userId', user?.id || '1');

    uploadMutation.mutate(formData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'submitted':
        return <Badge variant="secondary">Em Análise</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020914' }}>
        <Card className="glassmorphism max-w-md border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-white text-center">
              <User className="w-8 h-8 mx-auto mb-2" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-gray-300">
            <p>Faça login para acessar a verificação de documentos.</p>
            <Button className="mt-4 neon-button" onClick={() => window.location.href = '/login'}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#020914' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🛡️ Verificação de Documentos
          </h1>
          <p className="text-gray-300 text-lg">
            Para realizar compras na plataforma, precisamos verificar sua identidade
          </p>
        </div>

        {/* Status Geral */}
        <Card className="glassmorphism border-cyan-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              {getStatusIcon((documentsStatus as any)?.status || 'pending')}
              <span className="ml-2">Status da Verificação</span>
                              {getStatusBadge((documentsStatus as any)?.status || 'pending')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            {(documentsStatus as any)?.status === 'approved' ? (
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                <p className="text-green-400 font-medium">
                  ✅ Documentos aprovados! Você pode realizar compras na plataforma.
                </p>
              </div>
            ) : (documentsStatus as any)?.status === 'rejected' ? (
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                <p className="text-red-400 font-medium">
                  ❌ Documentos rejeitados. Por favor, envie novamente.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                <p className="text-yellow-400 font-medium">
                  ⏳ Envie seus documentos para aprovação e liberar compras.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Documentos */}
        <div className="grid gap-6">
          {documents.map((document) => (
            <Card key={document.type} className="glassmorphism border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  {document.icon}
                  <span className="ml-3">{document.name}</span>
                  {document.required && <Badge variant="outline" className="ml-2">Obrigatório</Badge>}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {document.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id={`file-${document.type}`}
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(document.type, file);
                      }}
                    />
                    <label htmlFor={`file-${document.type}`} className="cursor-pointer">
                      <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                      <p className="text-gray-300">
                        {document.file ? document.file.name : 'Clique para selecionar arquivo'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        JPG, PNG ou PDF (máx. 10MB)
                      </p>
                    </label>
                  </div>

                  {/* Upload Button */}
                  {document.file && (
                    <Button
                      className="w-full neon-button"
                      onClick={() => handleUpload(document.type)}
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? 'Enviando...' : 'Enviar Documento'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instruções */}
        <Card className="glassmorphism border-cyan-500/30 mt-8">
          <CardHeader>
            <CardTitle className="text-white">📋 Instruções Importantes</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-2">
            <p>• As fotos devem estar nítidas e legíveis</p>
            <p>• Documentos não podem estar vencidos</p>
            <p>• Comprovante de residência de até 3 meses</p>
            <p>• A análise pode levar até 24 horas</p>
            <p>• Você será notificado por email sobre o resultado</p>
          </CardContent>
        </Card>

        {/* Botão Voltar */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-600/20"
            onClick={() => window.history.back()}
          >
            ← Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}