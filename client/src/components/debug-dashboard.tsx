import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export function DebugDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-white text-2xl mb-8">Dashboard Debug - Teste de Cliques</h1>
      
      {/* Botões de teste simples */}
      <div className="space-y-4 mb-8">
        <Button 
          onClick={() => {
            console.log('BOTÃO 1 CLICADO!');
            alert('Botão 1 funcionou!');
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2"
        >
          Teste Botão 1 - Console Log
        </Button>
        
        <Button 
          onClick={() => setActiveTab('test')}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2"
        >
          Teste Botão 2 - Mudar Estado (Tab: {activeTab})
        </Button>
        
        <Link href="/">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2">
            Teste Botão 3 - Link Home
          </Button>
        </Link>
        
        <button 
          onClick={() => {
            console.log('BOTÃO HTML CLICADO!');
            alert('Botão HTML funcionou!');
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded"
        >
          Teste Botão 4 - HTML Nativo
        </button>
      </div>

      <div className="text-white">
        <p>Tab Atual: {activeTab}</p>
        <p>Se os botões acima funcionarem, o problema está no dashboard principal.</p>
        <p>Se não funcionarem, o problema é mais profundo no sistema.</p>
      </div>
    </div>
  );
}