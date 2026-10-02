import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import ConversaModal from '@/components/ConversaModal';
import { DEMO_PROS, CONF_LABEL } from '@/data/demo-professionals';

const C = {
  bg: '#020914', bg2: '#011527', card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,190,255,0.22)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#EAF8FF', ink2: '#7FA9C2', ink3: '#5b7a90',
};

export default function PerfilProfissional() {
  const [, params] = useRoute('/perfil/:id');
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profId = params?.id ? parseInt(params.id, 10) : 0;
  const userId = (user as any)?.id_interno ?? 1;

  const [perfil, setPerfil] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [conversaId, setConversaId] = useState<number | null>(null);
  const [proOcupado, setProOcupado] = useState(false);

  useEffect(() => {
    if (!profId) return;
    fetch('/api/service-flow/status/ocupados')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.success) setProOcupado(j.ocupados.includes(profId)); })
      .catch(() => {});
  }, [profId]);

  useEffect(() => {
    if (!profId) return;
    setCarregando(true);
    fetch(`/api/orbitmatch/profile/${profId}?userId=${userId}`)
      .then(r => {
        const ct = r.headers.get('content-type') || '';
        if (!r.ok || !ct.includes('json')) throw new Error('');
        return r.json();
      })
      .then(j => { if (j.success) setPerfil(j); else throw new Error(''); })
      .catch(() => {
        const cached: any[] | undefined = queryClient.getQueryData(['/api/professionals']);
        const found = cached?.find((p: any) => p.id === profId);
        if (found) {
          setPerfil({ profissional: found, contexto: { chips: [], motivos: [] }, placar: { experiencias: 0, indicacoes: 0, validacoes: 0 }, conexoesEmComum: 0, caminho: [], experienciasRelevantes: [] });
        } else {
          const demo = DEMO_PROS[profId];
          if (demo) setPerfil({ profissional: { id: profId, ...demo, services: demo.skills }, contexto: { chips: [], motivos: [] }, placar: { experiencias: 0, indicacoes: 0, validacoes: 0 }, conexoesEmComum: 0, caminho: [], experienciasRelevantes: [] });
        }
      })
      .finally(() => setCarregando(false));
  }, [profId, userId]);

  const p = perfil?.profissional;
  const chips: string[] = perfil?.contexto?.chips ?? [];
  const motivos: string[] = perfil?.contexto?.motivos ?? [];
  const placar = perfil?.placar;
  const conexoesEmComum: number = perfil?.conexoesEmComum ?? 0;
  const caminho: Array<{ nome: string; descricao: string; avatar?: string | null }> = perfil?.caminho ?? [];
  const experiencias = perfil?.experienciasRelevantes ?? [];
  const especialidades: string[] = p?.services ?? [];

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% -10%, #06223B, #020D18 55%, #00060F)', color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 14px clamp(18px, 14vw, 56px)', borderBottom: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.82)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>Perfil Profissional</div>
            <div style={{ fontSize: 13, color: C.ink2 }}>Histórico, experiências e contexto completo</div>
          </div>
          <button onClick={() => window.history.back()} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 16px', color: C.ink2, fontSize: 13, cursor: 'pointer' }}>Voltar</button>
        </header>

        {carregando && <div style={{ padding: 40, textAlign: 'center', color: C.ink2 }}>Carregando perfil...</div>}

        {!carregando && p && (
          <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(16px, 3vw, 32px)' }}>
            {/* Hero */}
            <div style={{ background: C.card, border: `1px solid ${C.borderHot}`, borderRadius: 18, padding: 'clamp(20px, 4vw, 32px)', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: window.innerWidth < 640 ? 14 : 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {p.avatar
                  ? <img src={p.avatar} alt={p.name} style={{ width: window.innerWidth < 640 ? 64 : 96, height: window.innerWidth < 640 ? 64 : 96, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${C.borderHot}`, flexShrink: 0 }} />
                  : <div style={{ width: window.innerWidth < 640 ? 64 : 96, height: window.innerWidth < 640 ? 64 : 96, borderRadius: '50%', background: `${C.blue}33`, border: `3px solid ${C.borderHot}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700, fontSize: window.innerWidth < 640 ? 24 : 36, flexShrink: 0 }}>{p.name?.[0]}</div>}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: window.innerWidth < 640 ? 18 : 24, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ color: C.ink2, fontSize: window.innerWidth < 640 ? 13 : 15, marginTop: 2 }}>{p.title}</div>
                  <div style={{ color: C.ink3, fontSize: 13, marginTop: 4 }}>
                    {p.city ? `${p.city}${p.state ? '/' + p.state : ''}` : 'Região a combinar'}
                  </div>
                  {proOcupado ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#FF9800', background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.2)', borderRadius: 10, padding: '4px 12px', marginTop: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF9800' }} /> Em atendimento
                    </span>
                  ) : p.available ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5BF5A0', background: 'rgba(91,245,160,0.1)', border: '1px solid rgba(91,245,160,0.2)', borderRadius: 10, padding: '4px 12px', marginTop: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5BF5A0' }} /> Disponível agora
                    </span>
                  ) : null}
                  {p.description && (
                    <p style={{ color: C.ink2, fontSize: 13, lineHeight: 1.6, marginTop: 12, margin: '12px 0 0' }}>{p.description}</p>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => !proOcupado && setConversaId(p.id)} disabled={proOcupado}
                  style={{ flex: 1, border: 'none', cursor: proOcupado ? 'not-allowed' : 'pointer', borderRadius: 14, padding: '13px', background: proOcupado ? 'rgba(255,152,0,0.3)' : `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: proOcupado ? '#FF9800' : '#012', fontWeight: 600, fontSize: 15, opacity: proOcupado ? 0.7 : 1 }}>
                  {proOcupado ? 'Ocupado' : 'Chamar'}
                </button>
                <button onClick={() => setLocation('/mapa')}
                  style={{ border: `1px solid ${C.border}`, cursor: 'pointer', borderRadius: 14, padding: '13px 20px', background: 'transparent', color: C.ink2, fontWeight: 500, fontSize: 13 }}>
                  Ver no mapa
                </button>
              </div>
              <button onClick={async () => {
                  try {
                    await fetch('/api/orbitmatch/indicar', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ indicadorUserId: userId, profissionalId: p.id }),
                    });
                    const url = `${window.location.origin}/p/${p.id}`;
                    if (navigator.share) {
                      navigator.share({ title: `${p.name} no Orbitrum`, text: `Conheça ${p.name} — ${p.title}`, url });
                    } else {
                      navigator.clipboard.writeText(url);
                      alert('Link copiado! Compartilhe com quem precisa.');
                    }
                  } catch { alert('Link copiado!'); }
                }}
                style={{ width: '100%', border: `1px solid ${C.border}`, cursor: 'pointer', borderRadius: 14, padding: '10px', background: 'transparent', color: C.cyan, fontWeight: 500, fontSize: 13, marginTop: 8 }}>
                Indicar para alguém
              </button>
            </div>

            {/* Placar */}
            {placar && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[['Experiências', placar.experiencias], ['Indicações', placar.indicacoes], ['Validações', placar.validacoes]].map(([label, n]) => (
                  <div key={label as string} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: window.innerWidth < 640 ? 22 : 28, fontWeight: 700, color: C.cyan }}>{n as number}</div>
                    <div style={{ fontSize: window.innerWidth < 640 ? 11 : 12, color: C.ink3, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Por que apareceu — o diferencial Orbitrum */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.ink3, marginBottom: 12, letterSpacing: 1, fontWeight: 600 }}>POR QUE ESTE PROFISSIONAL APARECEU</div>
              {(motivos.length > 0 || chips.length > 0 || conexoesEmComum > 0) ? (
                <div>
                  {motivos.map((m, i) => <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 6 }}><span style={{ color: C.cyan, flexShrink: 0 }}>✓</span>{m}</div>)}
                  {conexoesEmComum > 0 && <div style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 6 }}><span style={{ color: C.cyan, flexShrink: 0 }}>◎</span>{conexoesEmComum} {conexoesEmComum === 1 ? 'conexão em comum' : 'conexões em comum'}</div>}
                  {chips.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {chips.map((c, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.ink, background: `${C.blue}14`, border: `1px solid ${C.border}`, borderRadius: 12, padding: '5px 12px' }}>
                          <span style={{ color: C.cyan }}>✓</span>{c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: C.ink3, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  Ainda sem trilha relacional com você. Quando houver indicações, experiências confirmadas ou conexões em comum, o motivo aparece aqui — é o que separa o Orbitrum de uma busca genérica.
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {/* Especialidades */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 12, color: C.ink3, marginBottom: 12, letterSpacing: 1, fontWeight: 600 }}>ESPECIALIDADES</div>
                {especialidades.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {especialidades.map((s, i) => (
                      <span key={i} style={{ fontSize: 13, color: C.ink, background: `${C.cyan}12`, border: `1px solid ${C.border}`, borderRadius: 12, padding: '6px 14px' }}>{s}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: C.ink3, fontSize: 13 }}>Especialidades serão registradas conforme experiências na rede.</p>
                )}
              </div>

              {/* Verificação */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 12, color: C.ink3, marginBottom: 12, letterSpacing: 1, fontWeight: 600 }}>VERIFICAÇÃO</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Perfil cadastrado', done: true },
                    { label: 'Categoria definida', done: !!p.title },
                    { label: 'Serviços informados', done: especialidades.length > 0 },
                    { label: 'Experiências registradas', done: placar && placar.experiencias > 0 },
                    { label: 'Validações recebidas', done: placar && placar.validacoes > 0 },
                  ].map((v, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', border: `1px solid ${v.done ? C.cyan : C.border}`, background: v.done ? `${C.cyan}22` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {v.done && <span style={{ color: C.cyan, fontSize: 11 }}>✓</span>}
                      </span>
                      <span style={{ color: v.done ? C.ink : C.ink3 }}>{v.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Como chegou até ele */}
            {caminho.length > 1 && (
              <div style={{ marginTop: 16, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 12, color: C.ink3, marginBottom: 12, letterSpacing: 1, fontWeight: 600 }}>COMO VOCÊ CHEGOU ATÉ ELE</div>
                {caminho.map((s, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {s.avatar
                        ? <img src={s.avatar} alt={s.nome} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.borderHot}` }} />
                        : <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700, fontSize: 13 }}>{s.nome[0]?.toUpperCase()}</div>}
                      <div><div style={{ fontSize: 14, fontWeight: 600 }}>{s.nome}</div><div style={{ fontSize: 12, color: C.ink3 }}>{s.descricao}</div></div>
                    </div>
                    {i < caminho.length - 1 && <div style={{ marginLeft: 15, color: C.cyan, fontSize: 14, padding: '2px 0' }}>↓</div>}
                  </div>
                ))}
              </div>
            )}


            {/* Experiências relevantes */}
            {experiencias.length > 0 && (
              <div style={{ marginTop: 16, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 12, color: C.ink3, marginBottom: 12, letterSpacing: 1, fontWeight: 600 }}>EXPERIÊNCIAS RELEVANTES</div>
                {experiencias.map((e: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span>{e.detalhe || e.categoria}</span>
                    <span style={{ color: C.cyan, fontSize: 11, flexShrink: 0 }}>{CONF_LABEL[e.confianca] || e.confianca}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state honesto */}
            {chips.length === 0 && (!placar || placar.experiencias + placar.indicacoes + placar.validacoes === 0) && (
              <div style={{ marginTop: 16, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🌱</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Perfil novo na rede</div>
                <p style={{ color: C.ink2, fontSize: 13, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
                  A rede ainda não tem experiências registradas com essa pessoa. Conecte-se — quando o serviço acontecer e os dois confirmarem, o perfil ganha contexto real.
                </p>
              </div>
            )}

          </div>
        )}

        {!carregando && !p && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Profissional não encontrado</div>
            <button onClick={() => setLocation('/')} style={{ border: 'none', borderRadius: 10, padding: '9px 24px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Voltar ao Início
            </button>
          </div>
        )}
      </div>

      {conversaId != null && <ConversaModal profId={conversaId} onClose={() => setConversaId(null)} />}
    </div>
  );
}
