import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { isAdminUser } from '@/lib/isAdmin';
import { OrbitSystem } from '@/components/orbit-system';
import { ProfessionalModal } from '@/components/professional-modal';
import ConversaModal from '@/components/ConversaModal';
import { StarfieldBackground } from '@/components/starfield-background';
import { LoginModal } from '@/components/login-modal';
import OpportunityPost from '@/components/OpportunityPost';

// HOME no design alvo — "Sua rede em movimento".
// Coração da tese: necessidade → OrbitMatch → recomendação COM MOTIVO.
// Consome /api/orbitmatch/search (dado real). Aditiva: rota /inicio, não toca na home antiga.

const C = {
  bg: '#020914', bg2: '#061A2D', card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
};

const MENU_ECON: Array<[string, string]> = [
  ['Planos', '/planos'],
];

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
// NEURAL CORE (design-alvo, imagem 3): núcleo ORBITRUM + nós de CATEGORIA orbitando.
// Não é só profissionais — inclui Empresas e Oportunidades (pedido do Pedro).
// Cada nó é clicável: Profissionais/Indicações/Sua rede disparam a busca; Empresas/
// Oportunidades ainda "em breve" (honesto). Números só quando vêm do banco (nunca fake).
function OrbitNetwork({ counts, onNode }: { counts?: Record<string, number>; onNode?: (key: string) => void }) {
  const sub = (chave: string) => {
    const n = counts?.[chave];
    return typeof n === 'number' ? String(n) : undefined;
  };
  const nos = [
    { key: 'rede', label: 'Sua rede', glyph: '◎', x: 150, y: 92, ativo: true },
    { key: 'profissionais', label: 'Profissionais', glyph: '👤', x: 410, y: 92, ativo: true },
    { key: 'indicacoes', label: 'Indicações', glyph: '🔗', x: 60, y: 240, ativo: true },
    { key: 'oportunidades', label: 'Oportunidades', glyph: '📌', x: 500, y: 240, ativo: false },
    { key: 'empresas', label: 'Empresas', glyph: '🏢', x: 280, y: 372, ativo: false },
  ];
  return (
    <svg viewBox="0 0 560 420" style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto' }}>
      <defs>
        <radialGradient id="core" cx="50%" cy="42%">
          <stop offset="0%" stopColor="#BFF4FF" /><stop offset="40%" stopColor={C.cyan} />
          <stop offset="72%" stopColor={C.blue} /><stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="3.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {[120, 165, 200].map(r => <ellipse key={r} cx="280" cy="215" rx={r} ry={r * 0.58} fill="none" stroke={C.border} strokeOpacity="0.5" />)}
      {nos.map(n => <line key={n.label} x1="280" y1="215" x2={n.x} y2={n.y} stroke={C.border} strokeOpacity="0.6" />)}
      {/* núcleo ORBITRUM */}
      <g style={{ cursor: onNode ? 'pointer' : 'default' }} onClick={() => onNode?.('rede')}>
        <circle cx="280" cy="215" r="46" fill="url(#core)" filter="url(#glow)" />
        <circle cx="280" cy="215" r="46" fill="none" stroke={C.cyan} strokeOpacity="0.5" />
        <text x="280" y="212" textAnchor="middle" fill="#00131F" fontSize="12" fontWeight="800" letterSpacing="1">ORBITRUM</text>
        <text x="280" y="228" textAnchor="middle" fill="#00131F" fontSize="8.5" opacity="0.8">buscar</text>
      </g>
      {/* nós de categoria */}
      {nos.map(n => (
        <g key={n.label} style={{ cursor: onNode ? 'pointer' : 'default' }} onClick={() => onNode?.(n.key)}>
          <circle cx={n.x} cy={n.y} r="19" fill="#04223A" stroke={n.ativo ? C.cyan : C.border} strokeWidth={n.ativo ? 1.4 : 1} />
          <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="15">{n.glyph}</text>
          <text x={n.x} y={n.y - 26} textAnchor="middle" fill={n.ativo ? C.ink : C.ink3} fontSize="12" fontWeight="600">{n.label}</text>
          {sub(n.key) !== undefined
            ? <text x={n.x} y={n.y + 34} textAnchor="middle" fill={C.cyan} fontSize="11" fontWeight="700">{sub(n.key)}</text>
            : (!n.ativo && <text x={n.x} y={n.y + 34} textAnchor="middle" fill={C.ink3} fontSize="9">em breve</text>)}
        </g>
      ))}
    </svg>
  );
}

export default function Inicio() {
  const { user, logout, showLoginModal, setShowLoginModal, login } = useAuth();
  const [, setLocation] = useLocation();
  const ehAdmin = isAdminUser(user);
  const [necessidade, setNecessidade] = useState('');
  const [recs, setRecs] = useState<Rec[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [profModalId, setProfModalId] = useState<number | null>(null);
  const [conversaId, setConversaId] = useState<number | null>(null);
  const [resultados, setResultados] = useState<Rec[]>([]);
  const [destaques, setDestaques] = useState<(Rec & { promovido?: boolean })[]>([]);
  const [buscou, setBuscou] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [viewAtiva, setViewAtiva] = useState<'inicio' | 'rede' | 'profissionais' | 'indicacoes' | 'oportunidades' | 'conversas'>('inicio');
  const [atividade, setAtividade] = useState<Array<{ texto: string; quando: string; avatar?: string | null }>>([]);
  const [disponivel, setDisponivel] = useState(false);
  const [ocupados, setOcupados] = useState<Set<number>>(new Set());
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 900);
  const [menuAberto, setMenuAberto] = useState(false);
  useEffect(() => {
    const onR = () => setMobile(window.innerWidth < 900);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  const userId = String(user?.id_interno ?? 1);

  // Presença on/off: liga/desliga o perfil na rede pra receber chamada/indicação.
  // ON registra o fato disponivel_em; OFF expira (fato nunca se apaga). Estado explícito e temporal.
  const toggleDisponibilidade = () => {
    const novo = !disponivel;
    setDisponivel(novo);
    fetch('/api/facts/availability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professionalUserId: user?.id_interno, regiao: user?.city || 'geral', ativo: novo }),
    }).catch(() => setDisponivel(!novo));
  };

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
    fetch(`/api/orbitmatch/atividade?userId=${userId}`)
      .then(r => r.json())
      .then(j => { if (j.success && Array.isArray(j.itens)) setAtividade(j.itens); })
      .catch(() => {});
    fetch('/api/service-flow/status/ocupados')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.success) setOcupados(new Set(j.ocupados as number[])); })
      .catch(() => {});
    if (user?.id_interno) {
      fetch(`/api/facts/availability/${user.id_interno}`)
        .then(r => r.json())
        .then(j => { if (j.success) setDisponivel(!!j.ativo); })
        .catch(() => {});
    }
  }, [userId]);

  const buscar = (view?: 'rede' | 'profissionais' | 'indicacoes' | 'oportunidades' | 'conversas', catOverride?: string) => {
    const v = view || viewAtiva;
    if (view) setViewAtiva(view);
    setBuscou(true); setCarregando(true);
    const termo = catOverride ?? necessidade.trim();
    const cat = termo ? `&categoria=${encodeURIComponent(termo)}` : '';
    fetch(`/api/orbitmatch/search?userId=${userId}${cat}`)
      .then(r => r.json())
      .then(j => {
        if (!j.success) return;
        let lista = j.resultados as Rec[];
        if (v === 'rede') lista = lista.filter(r => r.sinalRelacional > 0);
        else if (v === 'indicacoes') lista = lista.filter(r => r.motivos.some(m => m.toLowerCase().includes('indic')));
        setResultados(lista);
        setDestaques(j.destaques || []);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  };
  const irParaInicio = () => { setViewAtiva('inicio'); setBuscou(false); setResultados([]); };

  const viewParamHandled = useRef(false);
  useEffect(() => {
    if (viewParamHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view') as 'rede' | 'profissionais' | 'indicacoes' | 'oportunidades' | 'conversas' | null;
    if (v && ['rede', 'profissionais', 'indicacoes', 'oportunidades', 'conversas'].includes(v)) {
      viewParamHandled.current = true;
      window.history.replaceState({}, '', '/');
      setTimeout(() => buscar(v), 300);
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% -10%, #06223B, #020D18 55%, #00060F)', color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative' }}>
      {/* Fundo espacial (cometas + estrelas) — o mesmo do sistema orbit, atrás do design */}
      <StarfieldBackground />
      {/* Hambúrguer + backdrop (mobile) — desktop não vê nada disso */}
      {mobile && !menuAberto && (
        <button aria-label="Menu" onClick={() => setMenuAberto(true)}
          style={{ position: 'fixed', top: 10, left: 10, zIndex: 1200, width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.92)', color: C.ink, fontSize: 18, cursor: 'pointer' }}>☰</button>
      )}
      {mobile && menuAberto && <div onClick={() => setMenuAberto(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,4,10,0.82)', zIndex: 1300 }} />}
      {/* SIDEBAR */}
      <aside onClick={() => { if (mobile) setMenuAberto(false); }}
        style={{ width: mobile ? 240 : 186, maxWidth: mobile ? '82vw' : undefined, borderRight: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.92)', backdropFilter: 'blur(6px)', padding: '20px 14px', display: 'flex', flexDirection: 'column', minHeight: '100vh',
          position: mobile ? 'fixed' : 'relative', top: 0, left: 0, bottom: 0, zIndex: mobile ? 1301 : 1,
          transform: mobile ? (menuAberto ? 'translateX(0)' : 'translateX(-105%)') : 'none', transition: 'transform .25s ease',
          boxShadow: mobile && menuAberto ? `0 0 40px ${C.blue}33` : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: `radial-gradient(circle at 50% 40%, ${C.cyan}, ${C.blue} 60%, transparent)` }} />
          <span style={{ letterSpacing: 2, fontWeight: 700, fontSize: 15 }}>ORBITRUM</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
          {([
            ['Início', irParaInicio, true],
            ['Minha Rede', () => setLocation('/rede'), false],
          ] as Array<[string, () => void, boolean]>).map(([label, onClick, isInicio]) => {
            const active = isInicio ? viewAtiva === 'inicio' : false;
            return (
              <button key={label as string} onClick={onClick as () => void}
                style={{ textAlign: 'left', padding: '11px 14px', borderRadius: 9, border: active ? `1px solid ${C.borderHot}` : '1px solid transparent',
                  background: active ? `${C.blue}22` : 'transparent', color: active ? C.ink : '#A9C6DC', fontSize: 15, fontWeight: active ? 600 : 400, letterSpacing: 0.2, cursor: 'pointer' }}>
                {label as string}
              </button>
            );
          })}

          {/* FERRAMENTAS — páginas reais. */}
          <div style={{ fontSize: 10, color: C.ink3, letterSpacing: 1.5, margin: '14px 14px 6px' }}>FERRAMENTAS</div>
          {([
            ['Meu Painel', '/dashboard-selector'],
            ['Equipes', '/teams'],
            ['Mapa · GPS', '/mapa'],
            ...(ehAdmin ? [['Admin', '/admin'] as [string, string]] : []),
          ] as Array<[string, string]>).map(([label, rota]) => (
            <button key={label} onClick={() => setLocation(rota)}
              style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 9, border: '1px solid transparent', background: 'transparent', color: '#A9C6DC', fontSize: 14, cursor: 'pointer' }}>
              {label}
            </button>
          ))}

          {/* CONTA — dinheiro embaixo, menor destaque (§30: reward is not the product). */}
          <div style={{ height: 1, background: C.border, margin: '12px 4px' }} />
          {MENU_ECON.map(([label, rota]) => (
            <button key={label} onClick={() => setLocation(rota)} style={{ textAlign: 'left', padding: '9px 14px', borderRadius: 9, border: '1px solid transparent', background: 'transparent', color: C.ink2, fontSize: 13, cursor: 'pointer' }}>{label}</button>
          ))}
        </nav>
        {/* Bloco C removido da UI (economia congelada) */}
      </aside>

      {/* CONTEÚDO */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: mobile ? 60 : 0 }}>
        {/* header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: mobile ? '10px 10px 10px 52px' : '16px 24px', borderBottom: `1px solid ${C.border}`, gap: 10, flexWrap: mobile ? 'nowrap' : 'nowrap' }}>
          {!mobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, maxWidth: 460 }}>
              <input value={necessidade} onChange={e => setNecessidade(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="O que você precisa resolver?"
                style={{ flex: 1, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: '10px 18px', color: C.ink, fontSize: 14, outline: 'none', minWidth: 0 }} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 8 : 12 }}>
            {user ? (
              <>
                <button onClick={toggleDisponibilidade} title="Ficar disponível na rede pra receber chamada/indicação"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: disponivel ? `${C.cyan}1f` : 'transparent', border: `1px solid ${disponivel ? C.borderHot : C.border}`, borderRadius: 16, padding: '5px 12px', color: disponivel ? C.cyan : C.ink3, fontSize: 12, cursor: 'pointer' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: disponivel ? C.cyan : C.ink3, boxShadow: disponivel ? `0 0 6px ${C.cyan}` : 'none' }} />
                  {disponivel ? 'Disponível' : 'Indisponível'}
                </button>
                {!mobile && <span style={{ fontSize: 13, color: C.ink2 }}>{user?.full_name || user?.username || user?.email || 'Participante'}</span>}
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}` }} />
                <button onClick={() => { logout(); setLocation('/'); }} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 16, padding: '5px 12px', color: C.ink2, fontSize: 12, cursor: 'pointer' }}>Sair</button>
              </>
            ) : (
              <button onClick={() => setShowLoginModal(true)} style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, border: 'none', borderRadius: 16, padding: '8px 18px', color: '#012', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Entrar</button>
            )}
          </div>
        </header>

        <div style={{ display: 'flex', gap: 20, padding: mobile ? '12px 8px' : 24, flexWrap: 'wrap' }}>
          {/* coluna principal */}
          <main style={{ flex: '1 1 440px', minWidth: 0 }}>
            {!mobile && (
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Sua rede em movimento</h1>
                <p style={{ color: C.ink3, fontSize: 13, margin: '4px 0 0' }}>Cada conexão fortalece o seu ecossistema.</p>
              </div>
            )}
            {/* Categorias da rede — não só profissionais: Empresas e Oportunidades também.
                Faixa ADITIVA acima do orbit (não altera o sistema orbit). Ativas buscam; futuras "em breve". */}
            <div style={{ display: 'flex', gap: mobile ? 5 : 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
              {([
                ['profissionais' as const, 'Profissionais', true],
                ['indicacoes' as const, 'Indicações', true],
                ['rede' as const, 'Sua rede', true],
                ['oportunidades' as const, 'Oportunidades', true],
                [null, 'Empresas', false],
              ] as Array<[typeof viewAtiva | null, string, boolean]>).map(([view, label, ativo]) => {
                const selected = view !== null && viewAtiva === view && buscou;
                return (
                  <button key={label} onClick={() => view && buscar(view)} disabled={!ativo}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: mobile ? '4px 8px' : '6px 12px', borderRadius: 14,
                      border: `1px solid ${selected ? C.borderHot : ativo ? C.border : 'rgba(120,150,170,0.15)'}`,
                      background: selected ? `${C.blue}22` : ativo ? `${C.blue}12` : 'transparent',
                      color: selected ? C.cyan : ativo ? C.ink : C.ink3, fontSize: mobile ? 11 : 12, fontWeight: selected ? 600 : 400,
                      cursor: ativo ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
                    {label}{!ativo && <span style={{ fontSize: 9, color: C.ink3 }}>· em breve</span>}
                  </button>
                );
              })}
            </div>
            {/* MIOLO ORBITAL — o sistema orbit ORIGINAL (profissionais orbitando + busca).
                NÃO remover. Clicar num profissional abre o perfil-tese. */}
            <div style={{ position: 'relative', overflow: 'hidden', ...(mobile ? { height: 'clamp(280px, 55vh, 420px)', margin: '0 -8px', width: 'calc(100% + 16px)' } : { height: 'clamp(340px, 48vh, 480px)' }) }}>
              <div style={{ transform: mobile ? 'scale(0.95)' : 'scale(0.85)', transformOrigin: 'center top', width: '100%', position: 'absolute', top: mobile ? '-8vh' : '-16vh', left: 0 }}>
                <OrbitSystem onOpenProfessional={(id: number) => { if (!user) { setShowLoginModal(true); } else { setProfModalId(id); } }} onOpenLogin={() => setShowLoginModal(true)} />
              </div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: mobile ? 10 : 14, padding: mobile ? 12 : 18, marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={necessidade} onChange={e => setNecessidade(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscar()}
                  placeholder="Ex.: Preciso de um eletricista amanhã..."
                  style={{ flex: 1, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: mobile ? '10px 14px' : '12px 18px', color: C.ink, fontSize: mobile ? 13 : 14, outline: 'none' }} />
                <button onClick={() => buscar()} style={{ width: mobile ? 42 : 48, height: mobile ? 42 : 48, borderRadius: '50%', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontSize: 18, fontWeight: 700 }}>→</button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {['Eletricista', 'Encanador', 'Diarista', 'Pintor', 'Cabeleireira', 'Pedreiro', 'Babá', 'Técnico'].map(cat => (
                  <button key={cat} onClick={() => { setNecessidade(cat); buscar(undefined, cat); }}
                    style={{ padding: '4px 10px', borderRadius: 12, border: `1px solid ${C.border}`, background: necessidade === cat ? `${C.blue}22` : 'transparent', color: necessidade === cat ? C.cyan : C.ink2, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* RESULTADOS INLINE — o funil da busca acontece aqui, sem trocar de aba.
                Cada card abre o perfil-tese e "Conectar" abre a conversa, tudo em modal. */}
            {buscou && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {carregando ? 'Buscando na sua rede…'
                      : viewAtiva === 'rede' ? `${resultados.length} na sua rede`
                      : viewAtiva === 'indicacoes' ? `${resultados.length} ${resultados.length === 1 ? 'indicação' : 'indicações'}`
                      : viewAtiva === 'oportunidades' ? `${resultados.length} ${resultados.length === 1 ? 'oportunidade' : 'oportunidades'}`
                      : viewAtiva === 'conversas' ? `${resultados.length} ${resultados.length === 1 ? 'conversa' : 'conversas'}`
                      : `${resultados.length} ${resultados.length === 1 ? 'profissional' : 'profissionais'}`}
                  </span>
                  <button onClick={() => { setBuscou(false); setResultados([]); }} style={{ background: 'none', border: 'none', color: C.ink3, fontSize: 12, cursor: 'pointer' }}>Limpar</button>
                </div>
                {/* Destaques — promovidos, claramente identificados */}
                {destaques.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.ink3, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: C.amber }}>⭐</span> EM DESTAQUE · Perfil promovido pelo profissional
                    </div>
                    {destaques.map(r => (
                      <div key={`dest-${r.profissional.id}`} onClick={() => setProfModalId(r.profissional.id)}
                        style={{
                          background: C.card, border: `1px solid ${C.amber}33`, borderRadius: mobile ? 10 : 12,
                          padding: mobile ? 10 : 14, marginBottom: mobile ? 8 : 10, cursor: 'pointer',
                          display: 'flex', gap: mobile ? 8 : 12,
                        }}>
                        <Avatar src={r.profissional.avatar} name={r.profissional.name} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{r.profissional.name}</div>
                            <span style={{ fontSize: 9, color: C.amber, background: `${C.amber}15`, border: `1px solid ${C.amber}30`, borderRadius: 6, padding: '2px 6px' }}>DESTAQUE</span>
                          </div>
                          <div style={{ color: C.ink3, fontSize: 12 }}>{r.profissional.title}{r.profissional.city ? ` · ${r.profissional.city}` : ''}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setConversaId(r.profissional.id); }}
                          style={{ border: 'none', cursor: 'pointer', borderRadius: 16, padding: '6px 16px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
                          Conectar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Broadcast — solicitar para todos disponíveis */}
                {!carregando && resultados.filter(r => !ocupados.has(r.profissional.id)).length >= 2 && user && (
                  <button onClick={async () => {
                    const disponiveis = resultados.filter(r => !ocupados.has(r.profissional.id));
                    const userId = (user as any).id_interno || (user as any).id;
                    const userName = (user as any).fullName || (user as any).username || 'Cliente';
                    let count = 0;
                    for (const r of disponiveis) {
                      try {
                        const resp = await fetch('/api/chats', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ clientId: userId, clientName: userName, professionalId: r.profissional.id }),
                        });
                        if (resp.ok) count++;
                      } catch {}
                    }
                    if (count > 0) alert(`Solicitação enviada para ${count} profissional${count > 1 ? 'is' : ''}!`);
                  }}
                  style={{
                    width: '100%', border: `1px solid ${C.borderHot}`, borderRadius: 10, padding: '10px',
                    background: `${C.cyan}0a`, color: C.cyan, fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    Solicitar para {resultados.filter(r => !ocupados.has(r.profissional.id)).length} disponíveis
                  </button>
                )}
                {resultados.map(r => (
                  <div key={r.profissional.id} onClick={() => setProfModalId(r.profissional.id)}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: mobile ? 10 : 12, padding: mobile ? 10 : 14, marginBottom: mobile ? 8 : 10, cursor: 'pointer', display: 'flex', gap: mobile ? 8 : 12 }}>
                    <Avatar src={r.profissional.avatar} name={r.profissional.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{r.profissional.name}</div>
                          <div style={{ color: C.ink3, fontSize: 12 }}>{r.profissional.title}{r.profissional.city ? ` · ${r.profissional.city}` : ''}</div>
                        </div>
                        {ocupados.has(r.profissional.id) ? (
                          <span style={{ fontSize: 11, color: '#FF9800', background: 'rgba(255,152,0,0.12)', border: '1px solid rgba(255,152,0,0.25)', borderRadius: 16, padding: '5px 12px', flexShrink: 0 }}>Ocupado</span>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setConversaId(r.profissional.id); }} style={{ border: 'none', cursor: 'pointer', borderRadius: 16, padding: '6px 16px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>Conectar</button>
                        )}
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
                  <div>
                    <p style={{ color: C.ink3, fontSize: 13, marginBottom: 12 }}>Ninguém na sua rede ainda para isso. Conforme experiências reais forem confirmadas, os resultados ganham contexto.</p>
                    {user && <OpportunityPost necessidade={necessidade} onPosted={() => {}} />}
                  </div>
                )}
              </div>
            )}

            {/* Estado que ENSINA quando a rede ainda está começando (não fabrica dado). */}
            {!buscou && recs.length === 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: mobile ? 10 : 14, padding: mobile ? 12 : 18, marginTop: mobile ? 8 : 12 }}>
                <div style={{ fontWeight: 600, fontSize: mobile ? 13 : 14, marginBottom: mobile ? 6 : 8 }}>Sua rede está começando</div>
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
          <aside style={{ flex: '0 1 320px', minWidth: mobile ? 0 : 260, width: mobile ? '100%' : undefined }}>
            {mobile && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Oportunidades</div>
                  <p style={{ color: C.ink2, fontSize: 10, margin: 0, lineHeight: 1.3 }}>
                    Necessidades da sua região.
                  </p>
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Atividade</div>
                  {atividade.length > 0 ? (
                    <div style={{ fontSize: 10, color: C.ink }}>{atividade[0]?.texto}</div>
                  ) : (
                    <p style={{ color: C.ink2, fontSize: 10, margin: 0, lineHeight: 1.3 }}>
                      Indicações e validações da rede.
                    </p>
                  )}
                </div>
              </div>
            )}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: mobile ? 10 : 14, padding: mobile ? 12 : 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: mobile ? 10 : 14 }}>
                <span style={{ fontWeight: 600, fontSize: mobile ? 13 : 15 }}>Recomendações para você</span>
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
                    <div style={{ color: C.ink2, fontSize: 12, marginBottom: 6 }}>{r.profissional.title}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {r.chips.slice(0, 3).map((c, i) => <Chip key={i} label={c} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!mobile && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginTop: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Oportunidades próximas</div>
                <p style={{ color: C.ink2, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                  Quando alguém publica uma necessidade na sua região, ela aparece aqui — você pode
                  responder ou indicar quem resolve. É a rede trabalhando a seu favor.
                </p>
              </div>
            )}

            {!mobile && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginTop: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Atividade recente</div>
                {atividade.length > 0 ? (
                  atividade.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: i ? `1px solid ${C.border}` : 'none' }}>
                      {a.avatar
                        ? <img src={a.avatar} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${C.blue}33`, flexShrink: 0 }} />}
                      <span style={{ fontSize: 12, color: C.ink }}>{a.texto}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: C.ink2, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                    Cada indicação, conexão e experiência validada da sua rede aparece aqui.
                    Assim que a rede se mover, você acompanha por aqui.
                  </p>
                )}
              </div>
            )}

            <p style={{ color: C.ink2, fontSize: 11, marginTop: 14, textAlign: 'center' }}>
              A rede explica por que cada pessoa apareceu.
            </p>
          </aside>
        </div>

        {/* RODAPÉ — nada órfão: cadastro de profissional + páginas legais acessíveis da home */}
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: '16px 24px', marginTop: 'auto', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setLocation('/cadastro-profissional')} style={{ background: 'transparent', border: `1px solid ${C.borderHot}`, borderRadius: 16, padding: '7px 16px', color: C.ink, fontSize: 12, cursor: 'pointer' }}>Seja profissional na rede</button>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {([['Termos', '/termos'], ['Privacidade', '/privacidade'], ['Regras', '/regras'], ['Certificações', '/certificacoes']] as Array<[string, string]>).map(([label, rota]) => (
              <button key={rota} onClick={() => setLocation(rota)} style={{ background: 'none', border: 'none', color: C.ink3, fontSize: 12, cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
        </footer>
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

      {/* Login — onSuccess chama useAuth.login (atualiza o estado); sem isso autentica no
          Supabase mas o app não loga ("nada acontece"). */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}
        onSuccess={(u: any, remember?: boolean) => { login(u, remember ?? false); setShowLoginModal(false); }} />
    </div>
  );
}
