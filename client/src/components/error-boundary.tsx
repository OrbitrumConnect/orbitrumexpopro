import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 Error Boundary capturou erro:', error, errorInfo);
    
    // Log para monitoramento
    try {
      if (typeof window !== 'undefined' && window.navigator.sendBeacon) {
        window.navigator.sendBeacon('/api/errors', JSON.stringify({
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href
        }));
      }
    } catch (e) {
      // Falha no envio do erro não deve quebrar a aplicação
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-space-dark">
          <div className="glassmorphism rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Oops! Algo deu errado</h2>
            <p className="text-gray-300 mb-6">
              Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full neon-button"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar Página
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Ir para Início
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-400 cursor-pointer">
                  Detalhes do Erro (Dev)
                </summary>
                <pre className="text-xs text-red-300 mt-2 overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}