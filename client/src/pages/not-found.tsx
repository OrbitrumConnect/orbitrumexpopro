import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: '#020914' }}>
      <Card className="w-full max-w-md mx-4" style={{ background: 'rgba(3,18,32,0.85)', border: '1px solid rgba(0,174,255,0.25)' }}>
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <h1 className="text-2xl font-bold text-white">404 - Pagina nao encontrada</h1>
          </div>

          <p className="mt-4 text-sm text-gray-400">
            Esta pagina nao existe. Volte para o inicio.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
