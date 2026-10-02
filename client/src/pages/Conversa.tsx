import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import MiniMapa from '@/components/MiniMapa';

const C = {
  bg: '#000915', bg2: '#011527', card: 'rgba(3,18,32,0.9)',
  cyan: '#00D9FF', blue: '#00AEEF',
  border: 'rgba(0,190,255,0.22)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#EAF8FF', ink2: '#7FA9C2',
};
const INK3 = '#5b7a90';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Estado = 'conversando' | 'combinado' | 'a_caminho' | 'chegou' | 'em_servico' | 'concluido' | 'validado';
const FLUXO: Array<[Estado, string, number]> = [
  ['conversando', 'Conexão realizada', 30],
  ['combinado', 'Serviço aceito', 40],
  ['a_caminho', 'A caminho', 55],
  ['chegou', 'Chegada confirmada', 65],
  ['em_servico', 'Serviço em andamento', 75],
  ['concluido', 'Serviço concluído', 85],
  ['validado', 'Experiência validada', 100],
];

interface Msg { de: 'eu' | 'ele' | 'sistema'; texto: string; timestamp?: string }

export default function Conversa() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/conversa/:profId');
  const profId = params?.profId;

  const [prof, setProf] = useState<any>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState<Estado>('conversando');
  const [factId, setFactId] = useState<number | null>(null);
  const [aviso, setAviso] = useState('');
  const chatIdRef = useRef<string | null>(null);
  const msgsEndRef = useRef<HTMLDivElement | null>(null);
  const contatoInicio = useRef<number>(Date.now());
  const [esperaSeg, setEsperaSeg] = useState(0);
  const [proRespondeu, setProRespondeu] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const clienteUserId = user?.id_interno;
  const souOPro = prof && clienteUserId && prof.userId === clienteUserId;
  const outroNome = souOPro ? (prof?.clientName || 'o cliente') : (prof?.name?.split(' ')[0] ?? 'o profissional');
  const meuNome = user?.name || user?.username || 'Usuário';

  useEffect(() => {
    if (!profId) return;
    fetch(`/api/orbitmatch/profile/${profId}?userId=${clienteUserId ?? 1}`)
      .then(r => r.json())
      .then(j => { if (j.success) setProf(j.profissional); })
      .catch(() => {});
  }, [profId, clienteUserId]);

  useEffect(() => {
    if (!profId || !clienteUserId) return;
    const chatId = `chat-${Math.min(clienteUserId, Number(profId))}-${Math.max(clienteUserId, Number(profId))}`;
    fetch(`/api/service-flow/${chatId}`)
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.success && j.exists && j.estado) setEstado(j.estado); })
      .catch(() => {});
  }, [profId, clienteUserId]);

  const criarOuCarregarChat = useCallback(async () => {
    if (!prof || !clienteUserId) return;
    const id = `chat-${Math.min(clienteUserId, prof.userId ?? prof.id)}-${Math.max(clienteUserId, prof.userId ?? prof.id)}`;
    chatIdRef.current = id;
    try {
      const r = await fetch(`/api/chats/${id}`);
      if (r.ok) {
        const j = await r.json();
        if (j.messages?.length) {
          setMsgs(j.messages.map((m: any) => ({
            de: m.senderId === clienteUserId ? 'eu' as const : 'ele' as const,
            texto: m.message, timestamp: m.timestamp,
          })));
        }
        return;
      }
    } catch {}
    try {
      await fetch('/api/chats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatSession: {
          id, clientId: clienteUserId, professionalId: prof.userId ?? prof.id,
          clientName: meuNome, professionalName: prof.name,
          isActive: true, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }}),
      });
    } catch {}
  }, [prof, clienteUserId, meuNome]);

  useEffect(() => { criarOuCarregarChat(); }, [criarOuCarregarChat]);

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  useEffect(() => {
    if (proRespondeu || souOPro) return;
    const t = setInterval(() => {
      setEsperaSeg(Math.floor((Date.now() - contatoInicio.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [proRespondeu, souOPro]);

  useEffect(() => {
    if (msgs.some(m => m.de === 'ele')) setProRespondeu(true);
  }, [msgs]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (estado !== 'a_caminho' && estado !== 'chegou') return;
    if (!navigator.geolocation) return;
    const wid = navigator.geolocation.watchPosition(
      pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, [estado]);

  const lastMsgCountRef = useRef(0);
  useEffect(() => {
    if (!chatIdRef.current || !clienteUserId) return;
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/api/chats/${chatIdRef.current}`);
        if (!r.ok) return;
        const j = await r.json();
        if (!j.messages?.length) return;
        const novas: Msg[] = j.messages.map((m: any) => ({
          de: m.senderId === clienteUserId ? 'eu' as const : 'ele' as const,
          texto: m.message, timestamp: m.timestamp,
        }));
        if (novas.length > lastMsgCountRef.current) {
          const diff = novas.slice(lastMsgCountRef.current);
          const temNova = diff.some(m => m.de === 'ele');
          if (temNova && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Orbitrum — Nova mensagem', {
              body: `${prof?.name ?? 'Profissional'}: ${diff.filter(m => m.de === 'ele').pop()?.texto ?? ''}`,
              icon: prof?.avatar || undefined,
            });
          }
          setMsgs(novas);
          lastMsgCountRef.current = novas.length;
        }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [clienteUserId, prof]);

  async function enviar() {
    if (!texto.trim()) return;
    const msg = texto.trim();
    setMsgs(m => [...m, { de: 'eu', texto: msg, timestamp: new Date().toISOString() }]);
    setTexto('');
    if (chatIdRef.current) {
      fetch(`/api/chats/${chatIdRef.current}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: clienteUserId, senderName: meuNome, message: msg }),
      }).catch(() => {});
    }
  }

  // Serviço concluído → registra o fato (declarado). Depois a confirmação valida.
  async function marcarConcluido() {
    setEstado('concluido');
    try {
      const r = await fetch('/api/professional/update-service-status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: `conv-${profId}-${clienteUserId}-${Date.now()}`,
          status: 'concluido',
          professionalId: prof?.userId,      // user id do profissional (executor)
          clientUserId: clienteUserId,        // user logado (cliente)
          description: `Serviço com ${prof?.name}`,
          category: null, region: prof?.city ?? null,
        }),
      });
      const j = await r.json();
      if (j.relationalFactId) { setFactId(j.relationalFactId); setAviso('Experiência registrada. Falta a confirmação dos dois lados.'); }
      else setAviso('Serviço marcado como concluído.');
    } catch { setAviso('Não foi possível registrar agora.'); }
  }

  // Os dois confirmam → fato vira VALIDADO. Nunca paga por confirmar.
  async function confirmar() {
    if (!factId) return;
    try {
      const r = await fetch(`/api/facts/${factId}/confirm`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteConfirmou: true, profissionalConfirmou: true }),
      });
      const j = await r.json();
      if (j.confianca === 'validado') { setEstado('validado'); setAviso('Experiência validada pelos dois lados. A rede aprendeu.'); }
    } catch { setAviso('Não foi possível confirmar agora.'); }
  }

  function avancar(novoEstado: Estado) {
    setEstado(novoEstado);
    if (!chatIdRef.current || !clienteUserId || !prof) return;
    const profUserId = prof.userId ?? prof.id;
    const cId = Math.min(clienteUserId, profUserId);
    const pId = Math.max(clienteUserId, profUserId);
    if (souOPro && novoEstado === 'combinado') {
      fetch(`/api/service-flow/${chatIdRef.current}/aceitar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: clienteUserId, clientId: cId, professionalId: pId }),
      }).catch(() => {});
    }
    fetch(`/api/service-flow/${chatIdRef.current}/transicao`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: clienteUserId, clientId: cId, professionalId: pId, novoEstado }),
    }).catch(() => {});
  }

  const idx = FLUXO.findIndex(([e]) => e === estado);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => setLocation('/rede')} style={{ background: 'none', border: 'none', color: C.ink2, fontSize: 20, cursor: 'pointer' }}>←</button>
        {prof?.avatar
          ? <img src={prof.avatar} alt={prof.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}` }} />
          : <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}` }} />}
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{prof?.name ?? 'Profissional'}</div>
          <div style={{ fontSize: 11, color: estado === 'validado' ? '#4ADE80' : estado === 'em_servico' ? '#FF9800' : C.cyan }}>
            {estado === 'validado' ? '✓ Concluído' : estado === 'em_servico' ? 'Em serviço' : estado === 'a_caminho' ? 'A caminho' : estado === 'chegou' ? 'No local' : 'Online'}
          </div>
        </div>
      </header>

      {/* barra de progresso 0-100% — Experience Layer §10 */}
      <div style={{ padding: '10px 18px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.cyan, fontWeight: 600 }}>{FLUXO[idx]?.[1]}</span>
          <span style={{ fontSize: 11, color: INK3 }}>{FLUXO[idx]?.[2]}%</span>
        </div>
        <div style={{ height: 4, background: `${C.border}`, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${FLUXO[idx]?.[2]}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.blue})`, borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {FLUXO.map(([e, label], i) => (
            <span key={e} style={{ fontSize: 10, color: i <= idx ? C.cyan : INK3, fontWeight: i === idx ? 700 : 400, flexShrink: 0, whiteSpace: 'nowrap' }}>
              {i <= idx ? '●' : '○'} {label}{i < FLUXO.length - 1 ? ' →' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* conversa */}
      <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
        {/* Mensagem automática — notificação e timer */}
        {!souOPro && estado === 'conversando' && (
          <div style={{ alignSelf: 'center', maxWidth: '85%', textAlign: 'center' }}>
            <div style={{ background: `${C.blue}12`, border: `1px solid ${C.border}`, borderRadius: 14, padding: '10px 16px', fontSize: 13, color: C.ink2 }}>
              {proRespondeu
                ? `${outroNome} está online e respondeu!`
                : `${prof?.name ?? 'O profissional'} foi notificado e irá responder em instantes. Aguarde ou envie sua mensagem.`}
            </div>
            {!proRespondeu && esperaSeg > 0 && (
              <div style={{ fontSize: 11, color: INK3, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.cyan, animation: 'pulse 1.5s infinite' }} />
                Aguardando resposta — {Math.floor(esperaSeg / 60)}:{String(esperaSeg % 60).padStart(2, '0')}
              </div>
            )}
          </div>
        )}
        {souOPro && msgs.length === 0 && estado === 'conversando' && (
          <div style={{ alignSelf: 'center', maxWidth: '85%', textAlign: 'center' }}>
            <div style={{ background: `linear-gradient(135deg, ${C.cyan}22, ${C.blue}22)`, border: `1px solid ${C.borderHot}`, borderRadius: 14, padding: '14px 18px', fontSize: 14, color: C.ink }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>🔔</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Nova solicitação de serviço!</div>
              <div style={{ fontSize: 12, color: C.ink2 }}>Um cliente quer se conectar com você. Responda para iniciar a conversa.</div>
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.de === 'eu' ? 'flex-end' : m.de === 'sistema' ? 'center' : 'flex-start', maxWidth: m.de === 'sistema' ? '90%' : '75%' }}>
            <div style={{
              background: m.de === 'eu' ? `linear-gradient(135deg, ${C.cyan}, ${C.blue})` : m.de === 'sistema' ? `${C.blue}12` : C.card,
              color: m.de === 'eu' ? '#012' : m.de === 'sistema' ? C.ink2 : C.ink,
              border: m.de === 'eu' ? 'none' : `1px solid ${C.border}`,
              borderRadius: 14, padding: '9px 14px', fontSize: m.de === 'sistema' ? 12 : 14,
              textAlign: m.de === 'sistema' ? 'center' as const : undefined }}>
              {m.texto}
            </div>
            {m.timestamp && m.de !== 'sistema' && (
              <div style={{ fontSize: 10, color: INK3, marginTop: 2, textAlign: m.de === 'eu' ? 'right' : 'left', paddingInline: 4 }}>
                {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        ))}
        <div ref={msgsEndRef} />
      </div>

      {/* mini-mapa quando a_caminho ou chegou */}
      {(estado === 'a_caminho' || estado === 'chegou') && (
        <div style={{ padding: '0 18px 8px' }}>
          <MiniMapa origem={prof?.latitude && prof?.longitude ? { lat: prof.latitude, lng: prof.longitude } : null} nomeProf={prof?.name?.split(' ')[0]} avatarProf={prof?.avatar} avatarUser={user?.profilePhoto || user?.avatar} />
        </div>
      )}
      {estado === 'a_caminho' && prof?.latitude != null && userPos && (() => {
        const dist = haversineKm(userPos.lat, userPos.lng, prof.latitude, prof.longitude);
        const minutos = Math.max(1, Math.round((dist / 30) * 60));
        return (
          <div style={{ margin: '0 18px 8px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', background: `${C.cyan}12`, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.cyan }}>{minutos < 60 ? `${minutos} min` : `${Math.round(minutos / 60)}h${minutos % 60 > 0 ? minutos % 60 : ''}`}</div>
            <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.4 }}>
              <div>Tempo estimado de chegada</div>
              <div style={{ color: INK3 }}>{dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`} de distância</div>
            </div>
          </div>
        );
      })()}

      {/* ação de ciclo — trilha bilateral completa §10 */}
      {aviso && <div style={{ padding: '8px 18px', color: C.cyan, fontSize: 12, textAlign: 'center' }}>{aviso}</div>}
      <div style={{ padding: '0 18px 10px', display: 'flex', gap: 8, justifyContent: 'center' }}>
        {estado === 'conversando' && (
          <button onClick={() => avancar('combinado')} style={botao(C)}>
            {souOPro ? 'Aceitar serviço' : 'Combinamos o serviço'}
          </button>
        )}
        {estado === 'combinado' && (
          <button onClick={() => avancar('a_caminho')} style={botao(C)}>
            {souOPro ? 'Estou a caminho' : 'Profissional a caminho'}
          </button>
        )}
        {estado === 'a_caminho' && (
          <button onClick={() => avancar('chegou')} style={botao(C)}>
            {souOPro ? 'Cheguei ao local' : 'Profissional chegou'}
          </button>
        )}
        {estado === 'chegou' && (
          <button onClick={() => avancar('em_servico')} style={botao(C)}>
            Iniciar serviço
          </button>
        )}
        {estado === 'em_servico' && (
          <button onClick={marcarConcluido} style={botao(C)}>
            {souOPro ? 'Serviço realizado' : 'Serviço concluído'}
          </button>
        )}
        {estado === 'concluido' && factId && (
          <button onClick={confirmar} style={botao(C)}>Confirmar experiência (os dois lados)</button>
        )}
        {estado === 'validado' && (
          <div style={{ color: C.cyan, fontSize: 13, fontWeight: 600 }}>✓ Experiência validada — a rede aprendeu</div>
        )}
      </div>

      {/* input */}
      <div style={{ display: 'flex', gap: 8, padding: 14, borderTop: `1px solid ${C.border}` }}>
        <input value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Digite uma mensagem..."
          style={{ flex: 1, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: '11px 16px', color: C.ink, fontSize: 14, outline: 'none' }} />
        <button onClick={enviar} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 700 }}>↑</button>
      </div>
    </div>
  );
}

function botao(C: any): React.CSSProperties {
  return { border: 'none', cursor: 'pointer', borderRadius: 22, padding: '11px 20px',
    background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 13,
    boxShadow: `0 0 16px ${C.blue}44` };
}
