import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

// HOME no design alvo — "Sua rede em movimento".
// Coração da tese: necessidade → OrbitMatch → recomendação COM MOTIVO.
// Consome /api/orbitmatch/search (dado real). Aditiva: rota /inicio, não toca na home antiga.

const C = {
  bg: '#020914', bg2: '#061A2D', card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
};

const MENU = [
  ['Início', true], ['Minha Rede', false], ['Profissionais', false],
  ['Oportunidades', false], ['Indicações', false], ['Conversas', false],
  ['Experiências', false], ['Ferramentas', false],
];
const MENU_ECON = ['Orbit Credits', 'Recompensas', 'Assinatura'];

const CONF_LABEL: Record<string, string> = {
  declarado: 'Declarado', indicado: 'Indicado',
  validado: 'Experiência validada', verificado: 'Verificado',
};

interface Rec {
  profissional: { id: number; name: string; title: string; city?: string | null; avatar?: string | null };
  sinalRelacional: number; motivos: string[]; chips: string[]; confianca: string | null;
}

function Chip({ label }: { label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.ink,
      background: `${C.blue}14`, border: `1px solid ${C.border}`, borderRadius: 11, padding: '2px 8px' }}>
      <span style={{ color: C.cyan }}>✓</span>{label}
    </span>
  );
}
function Avatar({ src, name }: { src?: string | null; name: string }) {
  if (src) return <img src={src} alt={name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}` }} />;
  return <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700 }}>{name?.[0]?.toUpperCase() || '?'}</div>;
}

// Órbita: núcleo + nós nomeados (design alvo). SVG leve, sem libs.
function OrbitNetwork() {
  const nos = [
    { label: 'Profissionais', sub: '+12 novos hoje', x: 250, y: 70 },
    { label: 'Empresas', sub: '3 conectadas', x: 470, y: 130 },
    { label: 'Oportunidades', sub: '5 novas', x: 470, y: 300 },
    { label: 'Sua rede', sub: '42 conexões', x: 250, y: 360 },
    { label: 'Indicações', sub: '8 pendentes', x: 40, y: 215 },
  ];
  return (
    <svg viewBox="0 0 560 420" style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto' }}>
      <defs>
        <radialGradient id="core" cx="50%" cy="45%">
          <stop offset="0%" stopColor={C.cyan} /><stop offset="55%" stopColor={C.blue} /><stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {[150, 190].map(r => <ellipse key={r} cx="280" cy="215" rx={r} ry={r * 0.62} fill="none" stroke={C.border} />)}
      {nos.map(n => <line key={n.label} x1="280" y1="215" x2={n.x} y2={n.y} stroke={C.border} />)}
      <circle cx="280" cy="215" r="52" fill="url(#core)" />
      <circle cx="280" cy="215" r="52" fill="none" stroke={C.cyan} strokeOpacity="0.4" />
      {nos.map(n => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r="6" fill={C.cyan} />
          <text x={n.x} y={n.y - 12} textAnchor="middle" fill={C.ink} fontSize="12" fontWeight="600">{n.label}</text>
          <text x={n.x} y={n.y + 20} textAnchor="middle" fill={C.ink3} fontSize="10">{n.sub}</text>
        </g>
      ))}
    </svg>
  );
}

export default function Inicio() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [necessidade, setNecessidade] = useState('');
  const [recs, setRecs] = useState<Rec[]>([]);
  const userId = String(user?.id_interno ?? 1);

  useEffect(() => {
    fetch(`/api/orbitmatch/search?userId=${userId}`)
      .then(r => r.json())
      .then(j => { if (j.success) setRecs((j.resultados as Rec[]).filter(r => r.motivos.length).slice(0, 3)); })
      .catch(() => {});
  }, [userId]);

  const buscar = () => setLocation('/orbitmatch');

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      {/* SIDEBAR */}
      <aside style={{ width: 186, borderRight: `1px solid ${C.border}`, background: '#03111F', padding: '20px 14px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: `radial-gradient(circle at 50% 40%, ${C.cyan}, ${C.blue} 60%, transparent)` }} />
          <span style={{ letterSpacing: 2, fontWeight: 700, fontSize: 15 }}>ORBITRUM</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {MENU.map(([label, active]) => (
            <button key={label as string} onClick={() => label === 'Início' ? null : setLocation('/orbitmatch')}
              style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 8, border: active ? `1px solid ${C.border}` : '1px solid transparent',
                background: active ? `${C.blue}18` : 'transparent', color: active ? C.ink : C.ink2, fontSize: 13, cursor: 'pointer' }}>
              {label as string}
            </button>
          ))}
          <div style={{ height: 1, background: C.border, margin: '10px 4px' }} />
          {MENU_ECON.map(label => (
            <button key={label} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: '1px solid transparent', background: 'transparent', color: C.ink3, fontSize: 12, cursor: 'pointer' }}>{label}</button>
          ))}
        </nav>
        <div style={{ border: `1px solid ${C.borderHot}`, borderRadius: 12, padding: 14, background: C.bg2, marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Plano Pro</div>
          <div style={{ fontSize: 12, color: C.ink2, marginBottom: 8 }}>R$ 29,90/mês</div>
          <button style={{ width: '100%', border: 'none', borderRadius: 8, padding: '7px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Gerenciar</button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 460 }}>
            <input value={necessidade} onChange={e => setNecessidade(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="O que você precisa resolver?"
              style={{ flex: 1, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: '10px 18px', color: C.ink, fontSize: 14, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: C.ink2 }}>{user?.full_name || user?.username || user?.email || 'Participante'}</span>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}` }} />
          </div>
        </header>

        <div style={{ display: 'flex', gap: 20, padding: 24, flexWrap: 'wrap' }}>
          {/* coluna principal */}
          <main style={{ flex: '1 1 440px', minWidth: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Sua rede em movimento</h1>
              <p style={{ color: C.ink3, fontSize: 13, margin: '4px 0 0' }}>Cada conexão fortalece o seu ecossistema.</p>
            </div>
            <OrbitNetwork />
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={necessidade} onChange={e => setNecessidade(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscar()}
                  placeholder="Ex.: Preciso de um eletricista amanhã..."
                  style={{ flex: 1, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: '12px 18px', color: C.ink, fontSize: 14, outline: 'none' }} />
                <button onClick={buscar} style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontSize: 18, fontWeight: 700 }}>→</button>
              </div>
            </div>
          </main>

          {/* coluna lateral: recomendações com MOTIVO */}
          <aside style={{ flex: '0 1 320px', minWidth: 260 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Recomendações para você</span>
                <button onClick={() => setLocation('/orbitmatch')} style={{ background: 'none', border: 'none', color: C.cyan, fontSize: 12, cursor: 'pointer' }}>Ver todas</button>
              </div>
              {recs.length === 0 && (
                <p style={{ color: C.ink3, fontSize: 12 }}>
                  Conforme sua rede acumula experiências, as recomendações aparecem aqui — sempre com o motivo.
                </p>
              )}
              {recs.map(r => (
                <div key={r.profissional.id} onClick={() => setLocation('/orbitmatch')}
                  style={{ borderTop: `1px solid ${C.border}`, padding: '12px 0', cursor: 'pointer', display: 'flex', gap: 10 }}>
                  <Avatar src={r.profissional.avatar} name={r.profissional.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.profissional.name}</div>
                      <button style={{ border: 'none', cursor: 'pointer', borderRadius: 16, padding: '5px 14px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>Conectar</button>
                    </div>
                    <div style={{ color: C.ink3, fontSize: 12, marginBottom: 6 }}>{r.profissional.title}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {r.chips.slice(0, 3).map((c, i) => <Chip key={i} label={c} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ color: C.ink3, fontSize: 11, marginTop: 14, textAlign: 'center' }}>
              A rede explica por que cada pessoa apareceu.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
