import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, X, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ChatWindowProps {
  chatId: string;
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [userId] = useState(1); // Mock user ID - in real app would come from auth
  const [userName] = useState("João Eduardo"); // Mock user name
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load chat session and messages
  const { data: chatData, isLoading, error } = useQuery({
    queryKey: ['/api/chats', chatId],
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return await apiRequest("POST", `/api/chats/${chatId}/messages`, {
        senderId: userId,
        senderName: userName,
        message: messageText
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
      scrollToBottom();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive"
      });
    }
  });

  // Close chat mutation
  const closeChatMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/chats/${chatId}/close`);
    },
    onSuccess: () => {
      toast({
        title: "Chat Fechado",
        description: "Chat encerrado com sucesso",
      });
      window.close();
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatData?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const getTimeRemaining = () => {
    if (!chatData?.chat?.expiresAt) return "00:00:00";
    
    const now = new Date().getTime();
    const expires = new Date(chatData.chat.expiresAt).getTime();
    const remaining = expires - now;
    
    if (remaining <= 0) return "EXPIRADO";
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !chatData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="glassmorphism border-red-500/30 max-w-md">
          <CardContent className="text-center p-6">
            <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">Chat Indisponível</h2>
            <p className="text-gray-400 mb-4">
              {error?.message || "Este chat não existe ou expirou"}
            </p>
            <Button onClick={() => window.close()} variant="outline">
              Fechar Janela
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chat = chatData.chat;
  const messages = chatData.messages || [];
  const timeRemaining = getTimeRemaining();
  const isExpired = timeRemaining === "EXPIRADO";

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-cyan-400" />
            <div>
              <h1 className="text-white font-semibold">
                {chat.clientName} ↔ {chat.professionalName}
              </h1>
              <p className="text-gray-400 text-sm">{chat.serviceType}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant={isExpired ? "destructive" : "outline"} className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {timeRemaining}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => closeChatMutation.mutate()}
              className="border-red-500/50 text-red-400 hover:bg-red-600/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">Chat Iniciado</h3>
            <p className="text-gray-400">Envie a primeira mensagem para começar a conversa</p>
          </div>
        ) : (
          messages.map((msg: any, index: number) => (
            <motion.div
              key={msg.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.senderId === userId 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-700 text-gray-100'
              }`}>
                <div className="text-xs opacity-75 mb-1">{msg.senderName}</div>
                <div>{msg.message}</div>
                <div className="text-xs opacity-75 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {!isExpired ? (
        <form onSubmit={handleSendMessage} className="p-4 bg-gray-800/50 border-t border-gray-700">
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="bg-gray-700 border-gray-600 text-white"
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="neon-button"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-red-900/20 border-t border-red-500/50">
          <p className="text-red-400 text-center">
            💔 Chat expirado - Janela de 24 horas encerrada
          </p>
        </div>
      )}
    </div>
  );
}