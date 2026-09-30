import { useState, useEffect } from 'react';
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

interface Msg { de: 'eu' | 'ele'; texto: string }

interface Props { profId: number; onClose: () => void }

export default function ConversaModal({ profId, onClose }: Props) {
  const { user } = useAuth();
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
              origem={prof?.latitude != null && prof?.longitude != null ? { lat: prof.latitude, lng: prof.longitude } : null} />
          )}
          {/* "Como ir" aparece JUNTO com o mapa (deslocamento) — não no final (aí já rolou). */}
          {(estado === 'a_caminho' || estado === 'chegou') && prof && <Continuar prof={prof} />}
          {msgs.length === 0 && estado === 'conversando' && (
            <div style={{ color: C.ink3, fontSize: 13, textAlign: 'center', marginTop: 20 }}>
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
            <button onClick={() => setEstado('a_caminho')} style={botao(C)}>Aceitar — profissional a caminho</button>
          )}
          {estado === 'a_caminho' && (
            <button onClick={() => setEstado('chegou')} style={botao(C)}>Cheguei ao local</button>
          )}
          {estado === 'chegou' && (
            <button onClick={() => setEstado('em_servico')} style={botao(C)}>Iniciar serviço</button>
          )}
          {estado === 'em_servico' && (
            <button onClick={marcarConcluido} style={botao(C)}>Serviço concluído</button>
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
