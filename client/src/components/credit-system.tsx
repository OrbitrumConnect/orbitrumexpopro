import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { WalletView } from "@shared/token-operations";

interface CreditSystemProps {
  isSearchActive?: boolean;
}

export function CreditSystem({ isSearchActive = false }: CreditSystemProps) {
  const { user: authUser, isAuthenticated } = useAuth();
  
  // Query para buscar tokens reais do usuário logado
  const { data: wallet } = useQuery<WalletView>({
    queryKey: ["/api/users/wallet", authUser?.email],
    enabled: isAuthenticated && !!authUser?.email,
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
    queryFn: async () => {
      if (!authUser?.email) throw new Error("No user email");
      
      const response = await fetch('/api/wallet/user', {
        headers: {
          'User-Email': authUser.email,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    }
  });

  const user = authUser || { plan: "free" };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "free": return "text-gray-400";
      case "basic": return "text-blue-400";
      case "pro": return "text-[var(--neon-green)]";
      case "max": return "text-purple-400";
      default: return "text-gray-400";
    }
  };

  return (
    <motion.div 
      className={`fixed z-20 transition-all duration-500 ${
        isSearchActive 
          ? 'bottom-2 right-2 scale-75 opacity-60' 
          : 'bottom-20 sm:bottom-16 right-4 opacity-100'
      }`}
      initial={{ opacity: 0, x: 50 }}
      animate={{ 
        opacity: isSearchActive ? 0.6 : 1, 
        x: 0,
        scale: isSearchActive ? 0.75 : 1
      }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      <div className="glassmorphism rounded-lg p-2 text-xs md:p-3 md:text-sm bg-gradient-to-r from-sky-500 to-blue-600 border border-sky-400/50 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <span className="hidden sm:inline">Tokens:</span>
          <span className="sm:hidden">T:</span>
          <span className="neon-text ml-1">
            {isAuthenticated ? (wallet?.saldoTotal ?? 0) : 0}
          </span>
        </div>
      </div>
      

    </motion.div>
  );
}
