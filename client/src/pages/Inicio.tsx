import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { isAdminUser } from '@/lib/isAdmin';
import { OrbitSystem } from '@/components/orbit-system';
import { ProfessionalModal } from '@/components/professional-modal';
import ConversaModal from '@/components/ConversaModal';

// HOME no design alvo — "Sua rede em movimento".
// Coração da tese: necessidade → OrbitMatch → recomendação COM MOTIVO.
// Consome /api/orbitmatch/search (dado real). Aditiva: rota /inicio, não toca na home antiga.

const C = {
  bg: '#020914', bg2: '#061A2D', card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
};

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
// REGRA: nenhum número é inventado. Cada nó só mostra contagem quando ela vem
// do banco (prop `counts`). Sem dado → só o rótulo (componente estrutural).
function OrbitNetwork({ counts, onNucleo }: { counts?: Record<string, number>; onNucleo?: () => void }) {
  const sub = (chave: string) => {
    const n = counts?.[chave];
    return typeof n === 'number' ? String(n) : undefined; // undefined = não renderiza número fake
  };
  const nos = [
    { key: 'profissionais', label: 'Profissionais', sub: sub('profissionais'), x: 250, y: 70 },
    { key: 'empresas', label: 'Empresas', sub: sub('empresas'), x: 470, y: 130 },
    { key: 'oportunidades', label: 'Oportunidades', sub: sub('oportunidades'), x: 470, y: 300 },
    { key: 'rede', label: 'Sua rede', sub: sub('rede'), x: 250, y: 360 },
    { key: 'indicacoes', label: 'Indicações', sub: sub('indicacoes'), x: 40, y: 215 },
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
      <circle cx="280" cy="215" r="52" fill="url(#core)" style={{ cursor: onNucleo ? 'pointer' : 'default' }} onClick={onNucleo} />
      <text x="280" y="285" textAnchor="middle" fill={C.ink3} fontSize="10">clique para buscar</text>
      <circle cx="280" cy="215" r="52" fill="none" stroke={C.cyan} strokeOpacity="0.4" />
      {nos.map(n => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r="6" fill={C.cyan} />
          <text x={n.x} y={n.y - 12} textAnchor="middle" fill={C.ink} fontSize="12" fontWeight="600">{n.label}</text>
          {n.sub !== undefined && (
            <text x={n.x} y={n.y + 20} textAnchor="middle" fill={C.ink3} fontSize="10">{n.sub}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function Inicio() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const ehAdmin = isAdminUser(user);
  const [necessidade, setNecessidade] = useState('');
  const [recs, setRecs] = useState<Rec[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [profModalId, setProfModalId] = useState<number | null>(null);
  const [conversaId, setConversaId] = useState<number | null>(null);
  const [resultados, setResultados] = useState<Rec[]>([]);
  const [buscou, setBuscou] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const userId = String(user?.id_interno ?? 1);

  useEffect(() => {
    // Contadores reais do banco (só os que existem hoje). Nada é fabricado.
    fetch('/api/professionals')
      .then(r => r.json())
      .then(list => { if (Array.isArray(list)) setCounts(c => ({ ...c, profissionais: list.length })); })
      .catch(() => {});
    fetch(`/api/orbitmatch/search?userId=${userId}`)
      .then(r => r.json())
      .then(j => { if (j.success) setRecs((j.resultados as Rec[]).filter(r => r.motivos.length).slice(0, 3)); })
      .catch(() => {});
  }, [userId]);

  // Busca INLINE: mostra os resultados na própria home (funil sem trocar de aba).
  // Ranqueia pelo sinal relacional (comporBusca). Sem filtro de texto fabricado —
  // quando o backend aceitar busca por termo, plugamos `necessidade` aqui.
  const buscar = () => {
    setBuscou(true); setCarregando(true);
    fetch(`/api/orbitmatch/search?userId=${userId}`)
      .then(r => r.json())
      .then(j => { if (j.success) setResultados(j.resultados as Rec[]); })
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      {/* SIDEBAR */}
      <aside style={{ width: 186, borderRight: `1px solid ${C.border}`, background: '#03111F', padding: '20px 14px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: `radial-gradient(circle at 50% 40%, ${C.cyan}, ${C.blue} 60%, transparent)` }} />
          <span style={{ letterSpacing: 2, fontWeight: 700, fontSize: 15 }}>ORBITRUM</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
          {/* REDE — o eixo da tese (§30: rede em cima). Fluxo acontece inline, sem trocar de aba. */}
          {([
            ['Início', true, () => { setBuscou(false); setResultados([]); }],
            ['Minha Rede', false, buscar],
            ['Profissionais', false, buscar],
            ['Indicações', false, buscar],
          ] as Array<[string, boolean, () => void]>).map(([label, active, onClick]) => (
            <button key={label} onClick={onClick}
              style={{ textAlign: 'left', padding: '11px 14px', borderRadius: 9, border: active ? `1px solid ${C.borderHot}` : '1px solid transparent',
                background: active ? `${C.blue}22` : 'transparent', color: active ? C.ink : '#A9C6DC', fontSize: 15, fontWeight: active ? 600 : 400, letterSpacing: 0.2, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
          {/* Seções da tese ainda não construídas — honesto: "em breve", nunca link morto que finge. */}
          {['Oportunidades', 'Conversas'].map(label => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', color: C.ink3, fontSize: 15 }}>
              <span>{label}</span><span style={{ fontSize: 9, color: C.ink3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '1px 6px' }}>em breve</span>
            </div>
          ))}

          {/* FERRAMENTAS — páginas utilitárias reais (sem regressão: nada some do app). */}
          <div style={{ fontSize: 10, color: C.ink3, letterSpacing: 1.5, margin: '14px 14px 6px' }}>FERRAMENTAS</div>
          {([
            ['Meu Painel', '/dashboard-selector'],
            ['Equipes', '/teams'],
            ['Mapa · GPS', '/controle-gps'],
            ...(ehAdmin ? [['Admin', '/admin'] as [string, string]] : []),
          ] as Array<[string, string]>).map(([label, rota]) => (
            <button key={label} onClick={() => setLocation(rota)}
              style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 9, border: '1px solid transparent', background: 'transparent', color: '#A9C6DC', fontSize: 14, cursor: 'pointer' }}>
              {label}
            </button>
          ))}

          {/* CONTA — dinheiro embaixo, menor destaque (§30: reward is not the product). */}
          <div style={{ height: 1, background: C.border, margin: '12px 4px' }} />
          {MENU_ECON.map(label => (
            <button key={label} onClick={() => setLocation('/tokens')} style={{ textAlign: 'left', padding: '9px 14px', borderRadius: 9, border: '1px solid transparent', background: 'transparent', color: C.ink2, fontSize: 13, cursor: 'pointer' }}>{label}</button>
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
            {user && (
              <button onClick={() => { logout(); setLocation('/'); }} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 16, padding: '5px 12px', color: C.ink2, fontSize: 12, cursor: 'pointer' }}>Sair</button>
            )}
          </div>
        </header>

        <div style={{ display: 'flex', gap: 20, padding: 24, flexWrap: 'wrap' }}>
          {/* coluna principal */}
          <main style={{ flex: '1 1 440px', minWidth: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Sua rede em movimento</h1>
              <p style={{ color: C.ink3, fontSize: 13, margin: '4px 0 0' }}>Cada conexão fortalece o seu ecossistema.</p>
            </div>
            {/* MIOLO ORBITAL — o sistema orbit original (profissionais orbitando + busca).
                Clicar num profissional abre o perfil-tese (não o modal de tokens). */}
            <div style={{ position: 'relative', minHeight: 420 }}>
              <OrbitSystem onOpenProfessional={(id: number) => setProfModalId(id)} onOpenLogin={() => {}} />
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={necessidade} onChange={e => setNecessidade(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscar()}
                  placeholder="Ex.: Preciso de um eletricista amanhã..."
                  style={{ flex: 1, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: '12px 18px', color: C.ink, fontSize: 14, outline: 'none' }} />
                <button onClick={buscar} style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontSize: 18, fontWeight: 700 }}>→</button>
              </div>
            </div>

            {/* RESULTADOS INLINE — o funil da busca acontece aqui, sem trocar de aba.
                Cada card abre o perfil-tese e "Conectar" abre a conversa, tudo em modal. */}
            {buscou && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {carregando ? 'Buscando na sua rede…' : `${resultados.length} ${resultados.length === 1 ? 'pessoa' : 'pessoas'} — ordenadas pela sua rede`}
                  </span>
                  <button onClick={() => { setBuscou(false); setResultados([]); }} style={{ background: 'none', border: 'none', color: C.ink3, fontSize: 12, cursor: 'pointer' }}>Limpar</button>
                </div>
                {resultados.map(r => (
                  <div key={r.profissional.id} onClick={() => setProfModalId(r.profissional.id)}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10, cursor: 'pointer', display: 'flex', gap: 12 }}>
                    <Avatar src={r.profissional.avatar} name={r.profissional.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{r.profissional.name}</div>
                          <div style={{ color: C.ink3, fontSize: 12 }}>{r.profissional.title}{r.profissional.city ? ` · ${r.profissional.city}` : ''}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setConversaId(r.profissional.id); }} style={{ border: 'none', cursor: 'pointer', borderRadius: 16, padding: '6px 16px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>Conectar</button>
                      </div>
                      {r.motivos.length > 0 && (
                        <div style={{ color: C.ink2, fontSize: 12, marginTop: 6, display: 'flex', gap: 6 }}>
                          <span style={{ color: C.cyan }}>✓</span><span>{r.motivos[0]}</span>
                        </div>
                      )}
                      {r.chips.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                          {r.chips.slice(0, 3).map((c, i) => <Chip key={i} label={c} />)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {!carregando && resultados.length === 0 && (
                  <p style={{ color: C.ink3, fontSize: 13 }}>Ninguém na sua rede ainda para isso. Conforme experiências reais forem confirmadas, os resultados ganham contexto.</p>
                )}
              </div>
            )}

            {/* Estado que ENSINA quando a rede ainda está começando (não fabrica dado). */}
            {!buscou && recs.length === 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginTop: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Sua rede está começando</div>
                <p style={{ color: C.ink2, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  O Orbitrum aprende com o que acontece de verdade. Faça uma busca acima ou convide
                  alguém que você conhece. Cada experiência real — e confirmada pelos dois lados —
                  vira um fato que faz a rede explicar <strong>por que</strong> mostra cada pessoa.
                </p>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 12, color: C.ink3, flexWrap: 'wrap' }}>
                  <span>1 · Necessidade</span><span>→</span><span>2 · Conexão</span><span>→</span>
                  <span>3 · Experiência</span><span>→</span><span>4 · Validação</span><span>→</span>
                  <span style={{ color: C.cyan }}>a rede aprende</span>
                </div>
              </div>
            )}
          </main>

          {/* coluna lateral: recomendações com MOTIVO */}
          <aside style={{ flex: '0 1 320px', minWidth: 260 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Recomendações para você</span>
                <button onClick={buscar} style={{ background: 'none', border: 'none', color: C.cyan, fontSize: 12, cursor: 'pointer' }}>Ver todas</button>
              </div>
              {recs.length === 0 && (
                <p style={{ color: C.ink3, fontSize: 12 }}>
                  Conforme sua rede acumula experiências, as recomendações aparecem aqui — sempre com o motivo.
                </p>
              )}
              {recs.map(r => (
                <div key={r.profissional.id} onClick={() => setProfModalId(r.profissional.id)}
                  style={{ borderTop: `1px solid ${C.border}`, padding: '12px 0', cursor: 'pointer', display: 'flex', gap: 10 }}>
                  <Avatar src={r.profissional.avatar} name={r.profissional.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.profissional.name}</div>
                      <button onClick={(e) => { e.stopPropagation(); setConversaId(r.profissional.id); }} style={{ border: 'none', cursor: 'pointer', borderRadius: 16, padding: '5px 14px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>Conectar</button>
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

      {/* perfil-tese ao clicar num profissional orbitando */}
      {profModalId != null && (
        <ProfessionalModal isOpen={true} professionalId={profModalId} onClose={() => setProfModalId(null)}
          onConectar={(id) => { setProfModalId(null); setConversaId(id); }} />
      )}

      {/* conversa INLINE — o ciclo se fecha na mesma tela, sem mudar de aba */}
      {conversaId != null && (
        <ConversaModal profId={conversaId} onClose={() => setConversaId(null)} />
      )}
    </div>
  );
}
