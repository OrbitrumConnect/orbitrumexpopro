import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Link } from 'wouter';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Erro capturado pelo ErrorBoundary:', error);
    console.error('ℹ️ Informações do erro:', errorInfo);
    
    // Salvar erro para análise (não quebrar o app)
    try {
      localStorage.setItem('lastError', JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      }));
    } catch (storageError) {
      console.warn('Não foi possível salvar o erro no localStorage:', storageError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Interface de erro padrão otimizada para mobile
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <Card className="glassmorphism border-red-500/30 max-w-md w-full">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <CardTitle className="text-red-400 text-lg sm:text-xl">
                Ops! Algo deu errado
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4 text-center">
              <p className="text-gray-300 text-sm sm:text-base">
                Ocorreu um erro inesperado. Não se preocupe, seus dados estão seguros.
              </p>
              
              {this.state.error && (
                <details className="text-xs text-gray-400 text-left bg-gray-800/50 p-3 rounded border border-gray-700/30">
                  <summary className="cursor-pointer text-gray-300 mb-2">
                    Detalhes técnicos
                  </summary>
                  <pre className="whitespace-pre-wrap break-all">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              
              <div className="space-y-3 pt-4">
                <Button
                  onClick={this.handleRetry}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full border-gray-600/30 text-gray-300 hover:bg-gray-700/50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Recarregar Página
                </Button>
                
                <Link href="/">
                  <Button
                    variant="ghost"
                    className="w-full text-gray-400 hover:text-cyan-400"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Voltar ao Início
                  </Button>
                </Link>
              </div>
              
              <div className="pt-4 border-t border-gray-700/30">
                <p className="text-xs text-gray-500">
                  Se o problema persistir, recarregue a página ou entre em contato.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;