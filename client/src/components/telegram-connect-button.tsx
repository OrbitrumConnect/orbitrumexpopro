import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TelegramCode {
  code: string;
  expires_in: number;
  message: string;
}

export function TelegramConnectButton() {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateCodeMutation = useMutation({
    mutationFn: () => apiRequest('/api/telegram/generate-code', 'POST', { userId: 1 }),
    onSuccess: () => {
      setShowModal(true);
      toast({
        title: "Código gerado!",
        description: "Use este código no Telegram para conectar sua conta."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao gerar código. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const { data: telegramCode } = useQuery<TelegramCode>({
    queryKey: ['telegram-code'],
    queryFn: async () => {
      const result = await generateCodeMutation.mutateAsync();
      return result as TelegramCode;
    },
    enabled: false,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });

  const handleGenerateCode = () => {
    generateCodeMutation.mutate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copiado!",
        description: "Código copiado para a área de transferência."
      });
    });
  };

  const openTelegram = () => {
    window.open('https://t.me/orbitrum_bot', '_blank');
  };

  if (!showModal) {
    return (
      <Button 
        onClick={handleGenerateCode}
        disabled={generateCodeMutation.isPending}
        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium"
      >
        {generateCodeMutation.isPending ? "Gerando..." : "📱 Conectar Telegram"}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-slate-900 border-cyan-500/30">
        <CardHeader className="text-center">
          <CardTitle className="text-cyan-400">🤖 Conectar Telegram</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-white mb-4">
              Use este código no Telegram para conectar sua conta:
            </p>
            
            <div className="bg-slate-800 p-4 rounded-lg border border-cyan-500/30">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono text-cyan-400 tracking-wider">
                  {(telegramCode as any)?.code || 'ABC123'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard((telegramCode as any)?.code || 'ABC123')}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-gray-400 mt-2">
              ⏰ Expira em {Math.floor(((telegramCode as any)?.expires_in || 600) / 60)} minutos
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-white">📱 Passos:</h4>
            <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
              <li>Abra o Telegram e procure por @orbitrum_bot</li>
              <li>Digite: <code className="bg-slate-800 px-2 py-1 rounded text-cyan-400">/login {(telegramCode as any)?.code || 'ABC123'}</code></li>
              <li>Pronto! Sua conta estará conectada</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={openTelegram}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <ExternalLink size={16} className="mr-2" />
              Abrir Telegram
            </Button>
            <Button 
              onClick={() => setShowModal(false)}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-slate-800"
            >
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}