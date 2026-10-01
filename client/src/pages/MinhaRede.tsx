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

type Tab = 'visao' | 'pessoas' | 'conversas' | 'indicacoes' | 'experiencias';
const TABS: Array<[Tab, string]> = [
  ['visao', 'Visão geral'],
  ['pessoas', 'Pessoas'],
  ['conversas', 'Conversas'],
  ['indicacoes', 'Indicações'],
  ['experiencias', 'Experiências'],
];

function Avatar({ src, name, size = 42 }: { src?: string; name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, flexShrink: 0, overflow: 'hidden' }}>
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.charAt(0)}
    </div>
  );
}

function StatCard({ valor, label, cor }: { valor: number; label: string; cor?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px', textAlign: 'center', flex: '1 1 100px', minWidth: 80 }}>
      <p style={{ fontSize: 22, fontWeight: 700, color: cor || C.cyan, margin: 0 }}>{valor}</p>
      <p style={{ color: C.ink3, fontSize: 11, margin: 0 }}>{label}</p>
    </div>
  );
}

export default function MinhaRede() {
  const { user, setShowLoginModal } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>('visao');
  const [conexoes, setConexoes] = useState<Conexao[]>([]);
  const [atividade, setAtividade] = useState<Array<{ texto: string; quando: string }>>([]);
  const [totalPros, setTotalPros] = useState(0);
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
        if (j.success) setConexoes(j.resultados as Conexao[]);
      }),
      fetch(`/api/orbitmatch/atividade?userId=${userId}`).then(r => r.json()).then(j => {
        if (j.success && Array.isArray(j.itens)) setAtividade(j.itens);
      }),
      fetch('/api/professionals').then(r => r.json()).then(list => {
        if (Array.isArray(list)) setTotalPros(list.length);
      }),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [userId, user]);

  const redeForte = conexoes.filter(c => c.sinalRelacional > 0);
  const indicacoes = conexoes.filter(c => c.motivos.some(m => m.toLowerCase().includes('indic')));
  const experiencias = conexoes.filter(c => c.sinalRelacional > 0.5);

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 420 }}>
          <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sua rede profissional</p>
          <p style={{ color: C.ink3, fontSize: 13, marginBottom: 16 }}>Conexões, conversas, indicações e experiências — tudo num lugar. Entre para ver o que sua rede pode fazer por você.</p>
          <button onClick={() => setShowLoginModal(true)}
            style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, border: 'none', borderRadius: 12, padding: '10px 24px', color: '#012', fontWeight: 600, cursor: 'pointer' }}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  const redeViva = redeForte.length > 0;
  const subtitulo = redeViva
    ? `Você possui ${redeForte.length} conexões, ${indicacoes.length} indicações e ${experiencias.length} experiências registradas.`
    : 'Conecte-se com pessoas, profissionais e empresas. Cada relação pode abrir novos caminhos, oportunidades e experiências.';
  const titulo = redeViva ? 'Sua rede está ficando mais inteligente' : 'Sua rede está começando';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      {!mobile && <Sidebar />}
      <main style={{ flex: 1, padding: mobile ? '16px 12px 80px' : '28px 32px', maxWidth: 900, margin: '0 auto', width: '100%', overflowX: 'hidden' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: mobile ? 20 : 26, fontWeight: 700, margin: 0 }}>Minha Rede</h1>
          <p style={{ color: C.ink2, fontSize: 13, margin: '4px 0 0' }}>Sua rede profissional, relações e caminhos</p>
        </div>

        {/* Contadores principais */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <StatCard valor={redeForte.length} label="Conexões" />
          <StatCard valor={totalPros} label="Profissionais" />
          <StatCard valor={indicacoes.length} label="Indicações" />
          <StatCard valor={experiencias.length} label="Experiências" />
          <StatCard valor={atividade.length} label="Atividades" />
        </div>

        {/* Status da rede */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: mobile ? 14 : 18, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, fontSize: 15, margin: '0 0 4px' }}>{titulo}</p>
          <p style={{ color: C.ink2, fontSize: 13, margin: 0 }}>{subtitulo}</p>
        </div>

        {/* Tabs de navegação interna */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `1px solid ${C.border}`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
          {TABS.map(([key, label]) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)}
                style={{ padding: mobile ? '8px 10px' : '8px 16px', border: 'none', borderBottom: active ? `2px solid ${C.cyan}` : '2px solid transparent',
                  background: 'none', color: active ? C.ink : C.ink3, fontSize: mobile ? 12 : 14, fontWeight: active ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p style={{ color: C.ink3, textAlign: 'center', padding: 40 }}>Carregando...</p>
        ) : (
          <>
            {/* TAB: Visão geral */}
            {tab === 'visao' && (
              <div style={{ display: 'grid', gap: 16 }}>
                {/* Descobertas / Inteligência da rede */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: mobile ? 14 : 18 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: C.cyan }}>Inteligência da rede</h2>
                  {redeForte.length > 0 ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {redeForte.length >= 3 && (
                        <p style={{ fontSize: 13, color: C.ink2, margin: 0, padding: '8px 12px', background: `${C.blue}0a`, borderRadius: 8, border: `1px solid ${C.border}` }}>
                          Você está conectado a <strong style={{ color: C.ink }}>{redeForte.length} pessoas</strong> na rede. {indicacoes.length > 0 && `${indicacoes.length} vieram por indicação.`}
                        </p>
                      )}
                      {redeForte.filter(c => c.sinalRelacional > 0.7).length > 0 && (
                        <p style={{ fontSize: 13, color: C.ink2, margin: 0, padding: '8px 12px', background: `${C.blue}0a`, borderRadius: 8, border: `1px solid ${C.border}` }}>
                          <strong style={{ color: C.ink }}>{redeForte.filter(c => c.sinalRelacional > 0.7).length} conexões fortes</strong> na sua rede — relações com alto sinal relacional.
                        </p>
                      )}
                      {totalPros > redeForte.length && (
                        <p style={{ fontSize: 13, color: C.ink2, margin: 0, padding: '8px 12px', background: `${C.blue}0a`, borderRadius: 8, border: `1px solid ${C.border}` }}>
                          Existem <strong style={{ color: C.ink }}>{totalPros - redeForte.length} profissionais</strong> na rede que você ainda não conhece.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: C.ink3, margin: 0 }}>
                      Conforme você interagir com a rede, descobertas e insights aparecem aqui. Busque profissionais no Orbit para começar.
                    </p>
                  )}
                </div>

                {/* Atividade recente */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: mobile ? 14 : 18 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Atividade da sua rede</h2>
                  {atividade.length > 0 ? (
                    <div style={{ display: 'grid', gap: 6 }}>
                      {atividade.slice(0, 6).map((a, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < Math.min(atividade.length, 6) - 1 ? `1px solid ${C.border}` : 'none' }}>
                          <span style={{ fontSize: 13 }}>{a.texto}</span>
                          <span style={{ color: C.ink3, fontSize: 11, whiteSpace: 'nowrap', marginLeft: 12 }}>{a.quando}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: C.ink3, margin: 0 }}>
                      Nenhuma atividade ainda. A rede registra cada conexão, indicação e experiência validada.
                    </p>
                  )}
                </div>

                {/* Indicações resumo */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: mobile ? 14 : 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Indicações</h2>
                    {indicacoes.length > 0 && (
                      <button onClick={() => setTab('indicacoes')} style={{ background: 'none', border: 'none', color: C.cyan, fontSize: 12, cursor: 'pointer' }}>Ver todas</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 100px', textAlign: 'center', padding: 8 }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: C.cyan, margin: 0 }}>{indicacoes.length}</p>
                      <p style={{ color: C.ink3, fontSize: 11, margin: 0 }}>Recebidas</p>
                    </div>
                    <div style={{ flex: '1 1 100px', textAlign: 'center', padding: 8 }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: C.cyan, margin: 0 }}>{indicacoes.filter(i => i.sinalRelacional > 0.3).length}</p>
                      <p style={{ color: C.ink3, fontSize: 11, margin: 0 }}>Geraram conexão</p>
                    </div>
                    <div style={{ flex: '1 1 100px', textAlign: 'center', padding: 8 }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: C.cyan, margin: 0 }}>{experiencias.length}</p>
                      <p style={{ color: C.ink3, fontSize: 11, margin: 0 }}>Geraram experiência</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Pessoas */}
            {tab === 'pessoas' && (
              <div>
                {redeForte.length === 0 ? (
                  <EmptyState msg="Sua rede ainda está crescendo. Busque profissionais no Orbit e conecte-se." onBuscar={() => setLocation('/')} />
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {redeForte.map(c => (
                      <PessoaCard key={c.profissional.id} c={c} onClick={() => setLocation(`/perfil/${c.profissional.id}`)} mobile={mobile} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Conversas */}
            {tab === 'conversas' && (
              <div>
                {redeForte.length === 0 ? (
                  <EmptyState msg="Quando você conectar com um profissional, a conversa aparece aqui. Fluxo: conversa → combinado → concluído → validado." onBuscar={() => setLocation('/')} />
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {redeForte.map(c => (
                      <div key={c.profissional.id}
                        onClick={() => setLocation(`/conversa/${c.profissional.id}`)}
                        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: mobile ? 12 : 14, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', transition: 'border-color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = C.borderHot)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                        <Avatar src={c.profissional.avatar} name={c.profissional.name} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{c.profissional.name}</p>
                          <p style={{ color: C.ink2, fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.profissional.title}</p>
                        </div>
                        <span style={{ background: `${ESTADO_COR.conversando}18`, color: ESTADO_COR.conversando, borderRadius: 8, padding: '3px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          Abrir
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Indicações */}
            {tab === 'indicacoes' && (
              <div>
                {indicacoes.length === 0 ? (
                  <EmptyState msg="Conforme você indicar ou receber indicações, elas aparecem aqui. Cada indicação é um fato registrado na rede." onBuscar={() => setLocation('/')} />
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {indicacoes.map(c => (
                      <PessoaCard key={c.profissional.id} c={c} onClick={() => setLocation(`/perfil/${c.profissional.id}`)} mobile={mobile} badge="Indicação" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Experiências */}
            {tab === 'experiencias' && (
              <div>
                {experiencias.length === 0 ? (
                  <EmptyState msg="Experiências validadas aparecem aqui. Cada serviço concluído e confirmado gera um registro que fortalece sua rede." onBuscar={() => setLocation('/')} />
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {experiencias.map(c => (
                      <div key={c.profissional.id}
                        onClick={() => setLocation(`/perfil/${c.profissional.id}`)}
                        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: mobile ? 12 : 14, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Avatar src={c.profissional.avatar} name={c.profissional.name} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{c.profissional.name}</p>
                          <p style={{ color: C.ink2, fontSize: 12, margin: '2px 0 0' }}>{c.profissional.title}</p>
                          {c.motivos.length > 0 && <p style={{ color: C.ink3, fontSize: 11, margin: '2px 0 0' }}>{c.motivos[0]}</p>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: C.cyan, margin: 0 }}>{Math.round(c.sinalRelacional * 100)}%</p>
                          <p style={{ color: C.ink3, fontSize: 10, margin: 0 }}>confiança</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function PessoaCard({ c, onClick, mobile, badge }: { c: Conexao; onClick: () => void; mobile: boolean; badge?: string }) {
  return (
    <div onClick={onClick}
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: mobile ? 12 : 14, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', transition: 'border-color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = C.borderHot)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
      <Avatar src={c.profissional.avatar} name={c.profissional.name} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{c.profissional.name}</p>
          {badge && <span style={{ background: `${C.blue}22`, border: `1px solid ${C.border}`, borderRadius: 6, padding: '1px 6px', fontSize: 10, color: C.cyan }}>{badge}</span>}
        </div>
        <p style={{ color: C.ink2, fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.profissional.title}</p>
        {c.motivos.length > 0 && <p style={{ color: C.ink3, fontSize: 11, margin: '2px 0 0' }}>{c.motivos[0]}</p>}
      </div>
      <div style={{ background: `${C.cyan}18`, borderRadius: 8, padding: '4px 10px', fontSize: 12, color: C.cyan, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {Math.round(c.sinalRelacional * 100)}%
      </div>
    </div>
  );
}

function EmptyState({ msg, onBuscar }: { msg: string; onBuscar: () => void }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: C.ink3, marginBottom: 16 }}>{msg}</p>
      <button onClick={onBuscar}
        style={{ background: `${C.blue}22`, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 20px', color: C.cyan, fontSize: 13, cursor: 'pointer' }}>
        Buscar no Orbit
      </button>
    </div>
  );
}
