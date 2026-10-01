import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import MiniMapa from '@/components/MiniMapa';
import Continuar from '@/components/Continuar';

// CONVERSA INLINE — o ciclo acontece na MESMA tela (não muda de aba).
// Overlay sobre a home: conversa → serviço combinado → concluído → os dois
// confirmam → nasce um fato relacional validado → a rede aprende (§20-22).
// Mesma lógica da página Conversa, mas como modal para o fluxo inline.

const C = {
  bg2: '#011527', card: 'rgba(3,18,32,0.9)',
  cyan: '#00D9FF', blue: '#00AEEF',
  border: 'rgba(0,190,255,0.22)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#EAF8FF', ink2: '#7FA9C2', ink3: '#5b7a90',
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Estado OPERACIONAL da relação (Experience Layer §10). A barra 0–100% é o que ACONTECEU
// na plataforma — o Orbitrum REGISTRA, não executa nem garante. Cada transição gera um fato.
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

interface Props { profId: number; onClose: () => void }

export default function ConversaModal({ profId, onClose }: Props) {
  const { user } = useAuth();
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
          professionalId: prof?.userId,
          clientUserId: clienteUserId,
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

  const idx = FLUXO.findIndex(([e]) => e === estado);

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,4,10,0.82)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'clamp(6px, 2.5vw, 20px)', overflowY: 'auto', zIndex: 70, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: C.bg2, border: `1px solid ${C.borderHot}`, borderRadius: 18, maxWidth: 'min(760px, 96vw)', width: '100%', color: C.ink, boxShadow: `0 0 44px ${C.blue}22`, display: 'flex', flexDirection: 'column', maxHeight: '94vh' }}>

        {/* header */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
          {prof?.avatar
            ? <img src={prof.avatar} alt={prof.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}` }} />
            : <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}` }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{prof?.name ?? 'Profissional'}</div>
            <div style={{ fontSize: 11, color: C.cyan }}>Online</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.ink2, fontSize: 22, cursor: 'pointer' }}>×</button>
        </header>

        {/* BARRA OPERACIONAL 0–100% — estado real da relação (não gamificação). Cada etapa é um
            evento registrado; o Orbitrum diz o que aconteceu, não que executou o serviço. */}
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{FLUXO[idx]?.[1]}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.cyan }}>{FLUXO[idx]?.[2] ?? 0}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 6, background: 'rgba(0,190,255,0.12)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${FLUXO[idx]?.[2] ?? 0}%`, borderRadius: 6, background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})`, transition: 'width .4s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto' }}>
            {FLUXO.map(([e, label], i) => (
              <span key={e} style={{ fontSize: 10, color: i < idx ? C.cyan : i === idx ? C.ink : C.ink3, fontWeight: i === idx ? 700 : 400, flexShrink: 0 }}>
                {i < idx ? '✓' : i === idx ? '●' : '○'} {label}
              </span>
            ))}
          </div>
        </div>

        {/* conversa */}
        <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', minHeight: 160 }}>
          {/* MINI-MAPA no próprio card quando o profissional aceita e está a caminho.
              Toda a imersão acontece aqui — não abre outra tela. */}
          {(estado === 'a_caminho' || estado === 'chegou') && (
            <MiniMapa nomeProf={prof?.name ?? 'Profissional'}
              origem={prof?.latitude != null && prof?.longitude != null ? { lat: prof.latitude, lng: prof.longitude } : null}
              avatarProf={prof?.avatar} avatarUser={user?.profilePhoto || (user as any)?.avatar} />
          )}
          {estado === 'a_caminho' && prof?.latitude != null && userPos && (() => {
            const dist = haversineKm(userPos.lat, userPos.lng, prof.latitude, prof.longitude);
            const minutos = Math.max(1, Math.round((dist / 30) * 60));
            return (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', background: `${C.cyan}12`, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 16px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.cyan }}>{minutos < 60 ? `${minutos} min` : `${Math.round(minutos / 60)}h${minutos % 60 > 0 ? minutos % 60 : ''}`}</div>
                <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.4 }}>
                  <div>Tempo estimado de chegada</div>
                  <div style={{ color: C.ink3 }}>{dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`} de distância</div>
                </div>
              </div>
            );
          })()}
          {(estado === 'a_caminho' || estado === 'chegou') && prof && <Continuar prof={prof} />}
          {/* Mensagem automática do sistema — primeiro contato */}
          {!souOPro && estado === 'conversando' && (
            <div style={{ alignSelf: 'center', maxWidth: '85%', textAlign: 'center' }}>
              <div style={{ background: `${C.blue}12`, border: `1px solid ${C.border}`, borderRadius: 14, padding: '10px 16px', fontSize: 13, color: C.ink2 }}>
                {proRespondeu
                  ? `${outroNome} está online e respondeu!`
                  : `${prof?.name ?? 'O profissional'} foi notificado e irá responder em instantes. Aguarde ou envie sua mensagem.`}
              </div>
              {!proRespondeu && esperaSeg > 0 && (
                <div style={{ fontSize: 11, color: C.ink3, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.cyan, animation: 'pulse 1.5s infinite' }} />
                  Aguardando resposta — {Math.floor(esperaSeg / 60)}:{String(esperaSeg % 60).padStart(2, '0')}
                </div>
              )}
            </div>
          )}
          {/* Notificação para o pro — quando ele é chamado */}
          {souOPro && msgs.length === 0 && estado === 'conversando' && (
            <div style={{ alignSelf: 'center', maxWidth: '85%', textAlign: 'center' }}>
              <div style={{ background: `linear-gradient(135deg, ${C.cyan}22, ${C.blue}22)`, border: `1px solid ${C.borderHot}`, borderRadius: 14, padding: '14px 18px', fontSize: 14, color: C.ink }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>🔔</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Nova solicitação de serviço!</div>
                <div style={{ fontSize: 12, color: C.ink2 }}>Um cliente quer se conectar com você. Responda para iniciar a conversa.</div>
              </div>
            </div>
          )}
          {msgs.length === 0 && estado === 'conversando' && !souOPro && proRespondeu && (
            <div style={{ color: C.ink3, fontSize: 13, textAlign: 'center', marginTop: 8 }}>
              Combine o serviço direto com {outroNome}.<br />
              Quando acontecer e os dois confirmarem, a rede registra a experiência.
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
                <div style={{ fontSize: 10, color: C.ink3, marginTop: 2, textAlign: m.de === 'eu' ? 'right' : 'left', paddingInline: 4 }}>
                  {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          ))}
          <div ref={msgsEndRef} />
        </div>

        {/* ação de ciclo */}
        {aviso && <div style={{ padding: '8px 18px', color: C.cyan, fontSize: 12, textAlign: 'center' }}>{aviso}</div>}
        <div style={{ padding: '0 18px 10px', display: 'flex', gap: 8, justifyContent: 'center' }}>
          {estado === 'conversando' && (
            <button onClick={() => setEstado('combinado')} style={botao(C)}>
              {souOPro ? 'Aceitar serviço' : 'Combinamos o serviço'}
            </button>
          )}
          {estado === 'combinado' && (
            <button onClick={() => setEstado('a_caminho')} style={botao(C)}>
              {souOPro ? 'Estou a caminho' : 'Profissional a caminho'}
            </button>
          )}
          {estado === 'a_caminho' && (
            <button onClick={() => setEstado('chegou')} style={botao(C)}>
              {souOPro ? 'Cheguei ao local' : 'Profissional chegou'}
            </button>
          )}
          {estado === 'chegou' && (
            <button onClick={() => setEstado('em_servico')} style={botao(C)}>Iniciar serviço</button>
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

        {/* Ao validar, o serviço já aconteceu — nada de "como ir". Só continuidade na rede. */}
        {estado === 'validado' && (
          <div style={{ padding: '0 18px 14px', display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 16, padding: '8px 16px', color: C.ink2, fontSize: 12, cursor: 'pointer' }}>Ver outras opções na rede</button>
          </div>
        )}

        {/* input */}
        <div style={{ display: 'flex', gap: 8, padding: 14, borderTop: `1px solid ${C.border}` }}>
          <input value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviar()}
            placeholder="Digite uma mensagem..."
            style={{ flex: 1, background: '#00080F', border: `1px solid ${C.border}`, borderRadius: 22, padding: '11px 16px', color: C.ink, fontSize: 14, outline: 'none' }} />
          <button onClick={enviar} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 700 }}>↑</button>
        </div>
      </div>
    </div>
  );
}

function botao(C: any): React.CSSProperties {
  return { border: 'none', cursor: 'pointer', borderRadius: 22, padding: '11px 20px',
    background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 13,
    boxShadow: `0 0 16px ${C.blue}44` };
}
