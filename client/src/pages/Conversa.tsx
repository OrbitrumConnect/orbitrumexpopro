import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

// CONVERSA / NEGOCIAÇÃO — mas o chat NÃO é o fim (§20-22 do contrato).
// A tela leva ao fechamento do ciclo: conversa → serviço → CONCLUÍDO → os dois
// confirmam → nasce um fato relacional validado → a rede aprende.
// O histórico de mensagens é local (não fabrica dado): gap conhecido = falta um
// backend de mensagens persistentes. O que usa backend real é o registro do fato.

const C = {
  bg: '#000915', bg2: '#011527', card: 'rgba(3,18,32,0.9)',
  cyan: '#00D9FF', blue: '#00AEEF',
  border: 'rgba(0,190,255,0.22)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#EAF8FF', ink2: '#7FA9C2',
};
const INK3 = '#5b7a90';

type Estado = 'conversando' | 'combinado' | 'concluido' | 'validado';
const FLUXO: Array<[Estado, string]> = [
  ['conversando', 'Conversando'],
  ['combinado', 'Serviço combinado'],
  ['concluido', 'Serviço concluído'],
  ['validado', 'Experiência validada'],
];

interface Msg { de: 'eu' | 'ele'; texto: string }

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

  const clienteUserId = user?.id_interno;

  useEffect(() => {
    if (!profId) return;
    fetch(`/api/orbitmatch/profile/${profId}?userId=${clienteUserId ?? 1}`)
      .then(r => r.json())
      .then(j => { if (j.success) setProf(j.profissional); })
      .catch(() => {});
  }, [profId, clienteUserId]);

  function enviar() {
    if (!texto.trim()) return;
    setMsgs(m => [...m, { de: 'eu', texto: texto.trim() }]);
    setTexto('');
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

  const idx = FLUXO.findIndex(([e]) => e === estado);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => setLocation('/orbitmatch')} style={{ background: 'none', border: 'none', color: C.ink2, fontSize: 20, cursor: 'pointer' }}>←</button>
        {prof?.avatar
          ? <img src={prof.avatar} alt={prof.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}` }} />
          : <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}` }} />}
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{prof?.name ?? 'Profissional'}</div>
          <div style={{ fontSize: 11, color: C.cyan }}>Online</div>
        </div>
      </header>

      {/* trilha do ciclo — o chat leva à experiência e à validação */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 18px', borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {FLUXO.map(([e, label], i) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: i <= idx ? C.cyan : INK3, fontWeight: i === idx ? 700 : 400 }}>{i <= idx ? '●' : '○'} {label}</span>
            {i < FLUXO.length - 1 && <span style={{ color: INK3, fontSize: 11 }}>→</span>}
          </div>
        ))}
      </div>

      {/* conversa */}
      <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
        {msgs.length === 0 && (
          <div style={{ color: INK3, fontSize: 13, textAlign: 'center', marginTop: 20 }}>
            Combine o serviço direto com {prof?.name?.split(' ')[0] ?? 'o profissional'}.<br />
            Quando acontecer e os dois confirmarem, a rede registra a experiência.
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.de === 'eu' ? 'flex-end' : 'flex-start', maxWidth: '75%',
            background: m.de === 'eu' ? `linear-gradient(135deg, ${C.cyan}, ${C.blue})` : C.card,
            color: m.de === 'eu' ? '#012' : C.ink, border: m.de === 'eu' ? 'none' : `1px solid ${C.border}`,
            borderRadius: 14, padding: '9px 14px', fontSize: 14 }}>
            {m.texto}
          </div>
        ))}
      </div>

      {/* ação de ciclo */}
      {aviso && <div style={{ padding: '8px 18px', color: C.cyan, fontSize: 12, textAlign: 'center' }}>{aviso}</div>}
      <div style={{ padding: '0 18px 10px', display: 'flex', gap: 8, justifyContent: 'center' }}>
        {estado === 'conversando' && (
          <button onClick={() => setEstado('combinado')} style={botao(C)}>Combinamos o serviço</button>
        )}
        {estado === 'combinado' && (
          <button onClick={marcarConcluido} style={botao(C)}>Marcar serviço como concluído</button>
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
