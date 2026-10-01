import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';

const C = {
  bg: '#020914', bg2: '#061A2D', card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
};

interface Conexao {
  profissional: { id: number; name: string; title: string; avatar?: string; skills: string[] };
  sinalRelacional: number;
  motivos: string[];
}

const ESTADO_COR: Record<string, string> = {
  conversando: '#00AEEF', combinado: '#F59E0B', concluido: '#10B981', validado: '#00E5FF',
};
const ESTADO_LABEL: Record<string, string> = {
  conversando: 'Conversando', combinado: 'Combinado', concluido: 'Concluido', validado: 'Validado',
};

type Tab = 'conexoes' | 'conversas' | 'indicacoes';
const TABS: Array<[Tab, string]> = [
  ['conexoes', 'Conexões'],
  ['conversas', 'Conversas'],
  ['indicacoes', 'Indicações'],
];

export default function MinhaRede() {
  const { user, setShowLoginModal } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>('conexoes');
  const [conexoes, setConexoes] = useState<Conexao[]>([]);
  const [atividade, setAtividade] = useState<Array<{ texto: string; quando: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 900);

  useEffect(() => {
    const onR = () => setMobile(window.innerWidth < 900);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  const userId = String(user?.id_interno ?? 1);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      fetch(`/api/orbitmatch/search?userId=${userId}`).then(r => r.json()).then(j => {
        if (j.success) setConexoes((j.resultados as Conexao[]).filter(r => r.sinalRelacional > 0));
      }),
      fetch(`/api/orbitmatch/atividade?userId=${userId}`).then(r => r.json()).then(j => {
        if (j.success && Array.isArray(j.itens)) setAtividade(j.itens);
      }),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [userId, user]);

  const indicacoes = conexoes.filter(c => c.motivos.some(m => m.toLowerCase().includes('indic')));
  const conversasAtivas = conexoes;

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 400 }}>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Faça login para ver sua rede</p>
          <p style={{ color: C.ink3, fontSize: 13, marginBottom: 16 }}>Suas conexões, conversas e indicações aparecem aqui.</p>
          <button onClick={() => setShowLoginModal(true)}
            style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, border: 'none', borderRadius: 12, padding: '10px 24px', color: '#012', fontWeight: 600, cursor: 'pointer' }}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  const listaAtual = tab === 'indicacoes' ? indicacoes : tab === 'conversas' ? conversasAtivas : conexoes;
  const emptyMsg = tab === 'conversas'
    ? 'Quando você conectar com um profissional, a conversa aparece aqui. Fluxo: conversa, combinado, concluído, validado.'
    : tab === 'indicacoes'
    ? 'Conforme você indicar ou receber indicações, elas aparecem aqui. Cada indicação é um fato registrado na rede.'
    : 'Conforme você interagir com profissionais e validar experiências, suas conexões crescem. Cada interação gera um fato relacional.';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      {!mobile && <Sidebar />}
      <main style={{ flex: 1, padding: mobile ? '16px 12px 80px' : '28px 32px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: mobile ? 20 : 26, fontWeight: 700, margin: 0 }}>Minha Rede</h1>
            <p style={{ color: C.ink3, fontSize: 13, margin: '4px 0 0' }}>Conexões, conversas e indicações — tudo num lugar.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: C.cyan, margin: 0 }}>{conexoes.length}</p>
              <p style={{ color: C.ink3, fontSize: 11, margin: 0 }}>Conexões</p>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: C.cyan, margin: 0 }}>{atividade.length}</p>
              <p style={{ color: C.ink3, fontSize: 11, margin: 0 }}>Atividades</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 2 }}>
          {TABS.map(([key, label]) => {
            const active = tab === key;
            const count = key === 'indicacoes' ? indicacoes.length : key === 'conversas' ? conversasAtivas.length : conexoes.length;
            return (
              <button key={key} onClick={() => setTab(key)}
                style={{ padding: mobile ? '8px 12px' : '8px 18px', border: 'none', borderBottom: active ? `2px solid ${C.cyan}` : '2px solid transparent',
                  background: 'none', color: active ? C.ink : C.ink3, fontSize: mobile ? 13 : 14, fontWeight: active ? 600 : 400, cursor: 'pointer' }}>
                {label} <span style={{ fontSize: 11, color: active ? C.cyan : C.ink3, marginLeft: 4 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <p style={{ color: C.ink3, textAlign: 'center', padding: 40 }}>Carregando...</p>
        ) : listaAtual.length === 0 ? (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              {tab === 'conversas' ? 'Nenhuma conversa ativa ainda' : tab === 'indicacoes' ? 'Nenhuma indicação ainda' : 'Sua rede está começando'}
            </p>
            <p style={{ color: C.ink3, fontSize: 13, marginBottom: 16 }}>{emptyMsg}</p>
            <button onClick={() => setLocation('/')}
              style={{ background: `${C.blue}22`, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 20px', color: C.cyan, fontSize: 13, cursor: 'pointer' }}>
              Buscar no Orbit
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {listaAtual.map(c => (
              <div key={c.profissional.id}
                onClick={() => tab === 'conversas' ? setLocation(`/conversa/${c.profissional.id}`) : setLocation(`/perfil/${c.profissional.id}`)}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: mobile ? 12 : 14, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.borderHot)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
                  {c.profissional.avatar ? <img src={c.profissional.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.profissional.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{c.profissional.name}</p>
                  <p style={{ color: C.ink2, fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.profissional.title}</p>
                  {tab !== 'conversas' && c.motivos.length > 0 && (
                    <p style={{ color: C.ink3, fontSize: 11, margin: '2px 0 0' }}>{c.motivos[0]}</p>
                  )}
                </div>
                {tab === 'conversas' ? (
                  <span style={{ background: `${ESTADO_COR.conversando}18`, color: ESTADO_COR.conversando, borderRadius: 8, padding: '3px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {ESTADO_LABEL.conversando}
                  </span>
                ) : (
                  <div style={{ background: `${C.cyan}18`, borderRadius: 8, padding: '4px 10px', fontSize: 12, color: C.cyan, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {Math.round(c.sinalRelacional * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Atividade recente — sempre visivel */}
        {atividade.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: C.ink2 }}>Atividade recente</h2>
            <div style={{ display: 'grid', gap: 6 }}>
              {atividade.slice(0, 8).map((a, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: C.ink2 }}>{a.texto}</span>
                  <span style={{ color: C.ink3, fontSize: 11, whiteSpace: 'nowrap', marginLeft: 12 }}>{a.quando}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
