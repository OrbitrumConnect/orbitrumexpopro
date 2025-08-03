
import { Button } from "@/components/ui/button";
import { Shield, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function AccessDenied() {
  const handleBackToLogin = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gray-900" style={{ position: 'relative', zIndex: 1 }}>
      
      <main className="min-h-screen flex items-center justify-center relative">
        <div className="text-center space-y-8 max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
              <Lock className="h-12 w-12 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Acesso Restrito
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Esta área requer autenticação válida
            </p>
            
            <div className="glassmorphism p-6 rounded-lg mb-8">
              <Shield className="h-8 w-8 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-red-400">Apenas Usuários Verificados</h3>
              <p className="text-gray-400 text-sm">
                Para acessar o Orbtrum Connect, você precisa estar cadastrado e ter seu email confirmado.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Button 
              onClick={handleBackToLogin}
              className="neon-button rounded-full font-semibold px-8 py-4 text-lg"
              size="lg"
            >
              <Shield className="mr-2 h-5 w-5" />
              VOLTAR AO LOGIN
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}