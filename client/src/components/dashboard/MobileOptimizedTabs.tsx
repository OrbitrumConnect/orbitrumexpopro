import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Settings, 
  MessageCircle, 
  Calendar, 
  Brain, 
  Users, 
  Home,
  MapPin,
  Clock,
  User,
  Wallet,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

interface MobileOptimizedTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  trackDropdownClick?: (category: string, tab: string, user: any) => void;
  user?: any;
}

const MobileOptimizedTabs: React.FC<MobileOptimizedTabsProps> = ({
  activeTab,
  setActiveTab,
  trackDropdownClick,
  user
}) => {
  
  const handleTabClick = (category: string, tab: string) => {
    if (trackDropdownClick) {
      trackDropdownClick(category, tab, user);
    }
    setActiveTab(tab);
  };

  const tabs = [
    // Linha 1 - Dashboard Principal
    { id: 'overview', icon: Home, label: '🏠 Principal', color: 'from-cyan-600 to-blue-700' },
    { id: 'map', icon: MapPin, label: '🗺️ GPS', color: 'from-cyan-500 to-blue-600' },
    
    // Linha 2 - Conta & Config
    { id: 'profile', icon: User, label: '👤 Perfil', color: 'from-blue-600 to-indigo-700' },
    { id: 'wallet', icon: Wallet, label: '💰 Carteira', color: 'from-blue-500 to-indigo-600' },
    
    // Linha 3 - Comunicação
    { id: 'pending', icon: MessageCircle, label: '📩 Pedidos', color: 'from-indigo-600 to-purple-700' },
    { id: 'calendar', icon: Calendar, label: '📅 Agenda', color: 'from-indigo-500 to-purple-600' },
    
    // Linha 4 - IA & Crescimento
    { id: 'insights', icon: Brain, label: '🧠 IA', color: 'from-purple-600 to-pink-700' },
    { id: 'calendar-insights', icon: TrendingUp, label: '📊 Analytics', color: 'from-purple-500 to-pink-600' },
  ];

  return (
    <div className="w-full bg-gray-900/50 border-b border-gray-700/50 p-2">
      {/* Layout em grid 4x2 para mobile otimizado */}
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto sm:max-w-2xl sm:grid-cols-8">
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <Button
              onClick={() => handleTabClick('main', tab.id)}
              className={`
                w-full h-14 px-1 py-1 rounded-lg text-xs font-medium transition-all duration-300
                bg-gradient-to-r ${tab.color} hover:shadow-lg hover:scale-105
                ${activeTab === tab.id ? 'ring-2 ring-white/50 shadow-xl scale-105' : ''}
                text-white border-0 flex flex-col items-center justify-center space-y-0.5
                touch-manipulation
              `}
              style={{
                minHeight: '56px'
              }}
            >
              <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-[9px] leading-tight text-center">
                {tab.label}
              </span>
            </Button>
          </motion.div>
        ))}
      </div>
      
      {/* Indicador visual - ativo */}
      <div className="flex justify-center mt-2">
        <div className="text-xs text-gray-400">
          {tabs.find(t => t.id === activeTab)?.label || 'Selecionado'}
        </div>
      </div>
    </div>
  );
};

export default MobileOptimizedTabs;