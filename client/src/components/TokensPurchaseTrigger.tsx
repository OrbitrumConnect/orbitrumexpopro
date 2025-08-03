import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export function TokensPurchaseTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const tokenPackages = [
    { amount: 720, price: "R$ 3,00", description: "Pacote Básico", color: "from-blue-500 to-blue-600" },
    { amount: 1440, price: "R$ 6,00", description: "Pacote Standard", color: "from-green-500 to-green-600" },
    { amount: 2160, price: "R$ 9,00", description: "Pacote Popular", color: "from-purple-500 to-purple-600" },
    { amount: 4320, price: "R$ 18,00", description: "Pacote Pro", color: "from-orange-500 to-orange-600" },
    { amount: 7680, price: "R$ 32,00", description: "Galaxy Vault", color: "from-pink-500 to-pink-600" },
  ];

  const handlePurchase = async (amount: number, price: string) => {
    if (!user?.email) {
      alert('Você precisa estar logado para comprar tokens');
      return;
    }

    try {
      console.log(`🛒 Comprando ${amount} tokens por ${price}`);
      
      const numericPrice = parseFloat(price.replace('R$ ', '').replace(',', '.'));
      
      const response = await fetch('/api/payment/create-pix-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Email': user.email
        },
        body: JSON.stringify({
          amount: numericPrice,
          tokens: amount,
          description: `Compra de ${amount} tokens`
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ PIX gerado:', data.transactionId);
        
        // Criar nova janela com QR Code PIX
        const pixWindow = window.open('', '_blank', 'width=400,height=600');
        if (pixWindow) {
          pixWindow.document.write(`
            <html>
              <head>
                <title>PIX - ${amount} Tokens</title>
                <style>
                  body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #1a1a1a; color: white; }
                  .pix-container { max-width: 350px; margin: 0 auto; }
                  .qr-code { margin: 20px 0; }
                  .info { background: #2a2a2a; padding: 15px; border-radius: 8px; margin: 10px 0; }
                  .pix-key { font-family: monospace; background: #333; padding: 10px; border-radius: 4px; margin: 10px 0; }
                  button { background: #22c55e; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
                </style>
              </head>
              <body>
                <div class="pix-container">
                  <h2>💰 Compra de ${amount} Tokens</h2>
                  <div class="info">
                    <strong>Valor:</strong> ${price}<br>
                    <strong>Tokens:</strong> ${amount.toLocaleString()}<br>
                    <strong>ID:</strong> ${data.transactionId}
                  </div>
                  <div class="qr-code">
                    <img src="data:image/png;base64,${data.qrCodeBase64}" alt="QR Code PIX" style="max-width: 100%;">
                  </div>
                  <div class="pix-key">
                    <strong>Chave PIX:</strong><br>
                    ${data.pixKey}
                  </div>
                  <div class="info">
                    <p>📱 Escaneie o QR Code ou copie a chave PIX</p>
                    <p>⚡ Tokens creditados automaticamente após pagamento</p>
                  </div>
                  <button onclick="navigator.clipboard.writeText('${data.pixCode}'); alert('Código PIX copiado!')">
                    📋 Copiar Código PIX
                  </button>
                </div>
              </body>
            </html>
          `);
        }
        
        // Fechar modal de compra
        setIsOpen(false);
        
      } else {
        console.error('❌ Erro na resposta:', data);
        alert(`Erro ao gerar PIX: ${data.message || 'Tente novamente'}`);
      }
    } catch (error) {
      console.error('❌ Erro ao processar compra:', error);
      alert('Erro ao processar compra. Verifique sua conexão e tente novamente.');
    }
  };

  return (
    <>
      <motion.div
        className="fixed bottom-4 left-4 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white shadow-lg border border-yellow-400/50 rounded-full px-4 py-2 text-sm font-semibold"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Tokens
        </Button>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="glassmorphism border-yellow-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-white flex items-center justify-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              Comprar Tokens
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 p-4">
            {tokenPackages.map((pkg, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => handlePurchase(pkg.amount, pkg.price)}
                  className={`w-full bg-gradient-to-r ${pkg.color} hover:opacity-90 text-white border border-white/20 p-4 h-auto`}
                  variant="outline"
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="text-left">
                      <div className="font-semibold text-lg">{pkg.amount.toLocaleString()} Tokens</div>
                      <div className="text-sm opacity-90">{pkg.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl">{pkg.price}</div>
                      <div className="text-xs opacity-75">PIX Instantâneo</div>
                    </div>
                  </div>
                </Button>
              </motion.div>
            ))}
            
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600/30">
              <p className="text-xs text-gray-300 text-center">
                💡 Tokens são creditados automaticamente após confirmação do PIX
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}