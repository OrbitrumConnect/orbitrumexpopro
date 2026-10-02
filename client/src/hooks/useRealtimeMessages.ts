import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Msg { de: 'eu' | 'ele' | 'sistema'; texto: string; timestamp?: string }

interface UseRealtimeMessagesOpts {
  chatId: string | null;
  userId: number | null;
  profName?: string;
  profAvatar?: string;
  onNewMessage?: (msg: Msg) => void;
}

export function useRealtimeMessages({ chatId, userId, profName, profAvatar, onNewMessage }: UseRealtimeMessagesOpts) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [connected, setConnected] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCountRef = useRef(0);
  const channelRef = useRef<any>(null);

  const fetchAll = useCallback(async () => {
    if (!chatId || !userId) return;
    try {
      const r = await fetch(`/api/chats/${chatId}`);
      if (!r.ok) return;
      const j = await r.json();
      if (!j.messages?.length) return;
      const novas: Msg[] = j.messages.map((m: any) => ({
        de: m.senderId === userId ? 'eu' as const : 'ele' as const,
        texto: m.message,
        timestamp: m.timestamp,
      }));
      if (novas.length > lastCountRef.current) {
        const diff = novas.slice(lastCountRef.current);
        const temNova = diff.some(m => m.de === 'ele');
        if (temNova && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Orbitrum — Nova mensagem', {
            body: `${profName ?? 'Profissional'}: ${diff.filter(m => m.de === 'ele').pop()?.texto ?? ''}`,
            icon: profAvatar || undefined,
          });
        }
        diff.forEach(m => onNewMessage?.(m));
        setMsgs(novas);
        lastCountRef.current = novas.length;
      }
    } catch {}
  }, [chatId, userId, profName, profAvatar, onNewMessage]);

  useEffect(() => {
    if (!chatId || !userId) return;

    lastCountRef.current = 0;
    setMsgs([]);

    fetchAll();

    let usingRealtime = false;

    try {
      const channel = supabase
        .channel(`chat:${chatId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        }, (payload: any) => {
          const row = payload.new;
          const msg: Msg = {
            de: row.sender_id === userId ? 'eu' : 'ele',
            texto: row.message,
            timestamp: row.created_at,
          };
          setMsgs(prev => {
            if (prev.some(m => m.texto === msg.texto && m.timestamp === msg.timestamp)) return prev;
            lastCountRef.current = prev.length + 1;
            return [...prev, msg];
          });
          if (msg.de === 'ele') {
            onNewMessage?.(msg);
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Orbitrum — Nova mensagem', {
                body: `${profName ?? 'Profissional'}: ${msg.texto}`,
                icon: profAvatar || undefined,
              });
            }
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            usingRealtime = true;
            setConnected(true);
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        });

      channelRef.current = channel;
    } catch {
      // Supabase Realtime not available
    }

    // Fallback polling — starts immediately, stops if Realtime connects
    pollRef.current = setInterval(() => {
      if (!usingRealtime) fetchAll();
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setConnected(false);
    };
  }, [chatId, userId]);

  const addOptimistic = useCallback((msg: Msg) => {
    setMsgs(prev => [...prev, msg]);
    lastCountRef.current += 1;
  }, []);

  return { msgs, setMsgs, connected, addOptimistic, fetchAll };
}
