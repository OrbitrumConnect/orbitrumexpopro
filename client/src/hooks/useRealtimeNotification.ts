import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { notify } from '@/lib/notify';

interface Chamada {
  chatId: string;
  clientName: string;
  professionalId: number;
  timestamp: string;
}

export function useRealtimeNotification(userId: number | null) {
  const [chamada, setChamada] = useState<Chamada | null>(null);
  const channelRef = useRef<any>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chamadaRef = useRef<Chamada | null>(null);

  const checar = useCallback(async () => {
    if (!userId) return;
    try {
      const r = await fetch('/api/chats');
      if (!r.ok) return;
      const chats = await r.json();
      if (!Array.isArray(chats)) return;
      const paraEu = chats.find((c: any) =>
        c.professionalId === userId && c.isActive !== false &&
        c.messages?.length > 0 &&
        c.messages.every((m: any) => m.senderId !== userId)
      );
      if (paraEu && (!chamadaRef.current || chamadaRef.current.chatId !== paraEu.id)) {
        const ultima = paraEu.messages[paraEu.messages.length - 1];
        const nova: Chamada = {
          chatId: paraEu.id,
          clientName: paraEu.clientName || 'Cliente',
          professionalId: paraEu.clientId,
          timestamp: ultima.timestamp || new Date().toISOString(),
        };
        chamadaRef.current = nova;
        setChamada(nova);
        notify('Orbitrum — Novo cliente!', {
          body: `${nova.clientName} quer se conectar com você.`,
        });
      }
    } catch {}
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    checar();
    let usingRealtime = false;

    try {
      const channel = supabase
        .channel(`notif:pro:${userId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_sessions',
          filter: `professional_id=eq.${userId}`,
        }, (payload: any) => {
          const row = payload.new;
          const nova: Chamada = {
            chatId: row.id,
            clientName: row.client_name || 'Cliente',
            professionalId: row.client_id,
            timestamp: row.created_at || new Date().toISOString(),
          };
          if (!chamadaRef.current || chamadaRef.current.chatId !== nova.chatId) {
            chamadaRef.current = nova;
            setChamada(nova);
            notify('Orbitrum — Novo cliente!', {
              body: `${nova.clientName} quer se conectar com você.`,
            });
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            usingRealtime = true;
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        });
      channelRef.current = channel;
    } catch {}

    pollRef.current = setInterval(() => {
      if (!usingRealtime) checar();
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);

  const dismiss = useCallback(() => setChamada(null), []);

  return { chamada, dismiss };
}
