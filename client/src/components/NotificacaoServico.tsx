import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useWebPush } from '@/hooks/useWebPush';

const C = {
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#F4FAFF', ink2: '#91A9BD', bg2: '#061A2D',
};

interface Chamada {
  chatId: string;
  clientName: string;
  professionalId: number;
  timestamp: string;
}

export default function NotificacaoServico() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [chamada, setChamada] = useState<Chamada | null>(null);
  const [visible, setVisible] = useState(false);
  const [segsAtras, setSegsAtras] = useState(0);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const userId = (user as any)?.id_interno;
  const { state: pushState, requestPermission, showLocalNotification } = useWebPush();

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
      if (paraEu && (!chamada || chamada.chatId !== paraEu.id)) {
        const ultima = paraEu.messages[paraEu.messages.length - 1];
        setChamada({
          chatId: paraEu.id,
          clientName: paraEu.clientName || 'Cliente',
          professionalId: paraEu.clientId,
          timestamp: ultima.timestamp || new Date().toISOString(),
        });
        setVisible(true);
        setSegsAtras(0);
        showLocalNotification('Orbitrum — Novo cliente!', {
          body: `${paraEu.clientName || 'Um cliente'} quer se conectar com você.`,
          url: `/conversa/${paraEu.clientId}`,
        });
      }
    } catch {}
  }, [userId, chamada]);

  useEffect(() => {
    if (!userId) return;
    checar();
    let usingRealtime = false;
    let channel: any = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    try {
      channel = supabase
        .channel(`notif:pro:${userId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'chat_sessions',
          filter: `professional_id=eq.${userId}`,
        }, (payload: any) => {
          const row = payload.new;
          if (!chamada || chamada.chatId !== row.id) {
            setChamada({
              chatId: row.id,
              clientName: row.client_name || 'Cliente',
              professionalId: row.client_id,
              timestamp: row.created_at || new Date().toISOString(),
            });
            setVisible(true);
            setSegsAtras(0);
            showLocalNotification('Orbitrum — Novo cliente!', {
              body: `${row.client_name || 'Um cliente'} quer se conectar com você.`,
              url: `/conversa/${row.client_id}`,
            });
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            usingRealtime = true;
            if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
          }
        });
    } catch {}

    pollTimer = setInterval(() => { if (!usingRealtime) checar(); }, 5000);

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, checar]);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setSegsAtras(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [visible]);

  useEffect(() => {
    if (!userId || pushState !== 'prompt') return;
    const timer = setTimeout(() => setShowPushPrompt(true), 8000);
    return () => clearTimeout(timer);
  }, [userId, pushState]);

  async function handlePermission(accept: boolean) {
    setShowPushPrompt(false);
    if (accept) await requestPermission();
  }

  function atender() {
    if (!chamada) return;
    setVisible(false);
    setLocation(`/conversa/${chamada.professionalId}`);
  }

  if (!visible && !chamada && showPushPrompt) {
    return (
      <div style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9998,
        width: 'min(400px, 90vw)',
        background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '14px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 6 }}>
          🔔 Quer receber notificações?
        </div>
        <div style={{ fontSize: 12, color: C.ink2, marginBottom: 12 }}>
          Saiba na hora quando um cliente te procurar, mesmo fora do app.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handlePermission(true)} style={{
            flex: 1, border: 'none', borderRadius: 8, padding: '8px 0',
            background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
            color: '#012', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>Ativar</button>
          <button onClick={() => handlePermission(false)} style={{
            border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px',
            background: 'transparent', color: C.ink2, fontSize: 12, cursor: 'pointer',
          }}>Agora não</button>
        </div>
      </div>
    );
  }

  if (!visible || !chamada) return null;

  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
      width: 'min(420px, 92vw)',
      background: C.bg2, border: `2px solid ${C.borderHot}`, borderRadius: 16,
      padding: '16px 20px', boxShadow: `0 8px 40px rgba(0,174,255,0.25)`,
      animation: 'slideDown 0.4s ease',
    }}>
      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-30px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>🔔</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Nova solicitação!</div>
          <div style={{ fontSize: 13, color: C.ink2, marginTop: 2 }}>
            <strong style={{ color: C.cyan }}>{chamada.clientName}</strong> quer se conectar com você
          </div>
          <div style={{ fontSize: 11, color: C.ink2, marginTop: 2 }}>
            há {segsAtras < 60 ? `${segsAtras}s` : `${Math.floor(segsAtras / 60)}min`}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={atender}
          style={{
            flex: 1, border: 'none', borderRadius: 10, padding: '10px 0',
            background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
            color: '#012', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>
          Atender
        </button>
        <button onClick={() => setVisible(false)}
          style={{
            border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px',
            background: 'transparent', color: C.ink2, fontSize: 13, cursor: 'pointer',
          }}>
          Depois
        </button>
      </div>
    </div>
  );
}
