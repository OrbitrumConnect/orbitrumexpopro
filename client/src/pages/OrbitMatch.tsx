import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from '@/components/BottomNav';

// OrbitMatch — o coração da tese, vestido com o design alvo.
// "O que você precisa resolver?" → resultado com O MOTIVO (por que apareceu).
// Consome /api/orbitmatch/search, que lê fatos relacionais do Postgres.
// Cores do design-alvo (dark deep-space + cyan). Aditivo: rota nova, nada existente muda.

interface Resultado {
  profissional: { id: number; name: string; title: string; city?: string | null; avatar?: string | null };
  aiMatchScore: number;
  sinalRelacional: number;
  motivos: string[];
  chips: string[];
  confianca: string | null;
  fatoMaisRecente: string | null;
}

// Chip do design alvo: badge compacto com ✓.
function Chip({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: C.ink,
      background: `${C.blue}14`, border: `1px solid ${C.border}`, borderRadius: 12, padding: '3px 9px',
    }}>
      <span style={{ color: C.cyan }}>✓</span>{label}
    </span>
  );
}

// Avatar circular; cai numa inicial se não houver imagem.
function Avatar({ src, name, size = 44 }: { src?: string | null; name: string; size?: number }) {
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}` }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700, fontSize: size * 0.4 }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

const C = {
  bg: '#020914',
  bg2: '#061A2D',
  card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF',
  blue: '#00AEEF',
  border: 'rgba(0,174,255,0.22)',
  borderHot: 'rgba(0,220,255,0.5)',
  ink: '#F4FAFF',
  ink2: '#91A9BD',
  ink3: '#607A91',
};

const CONF_LABEL: Record<string, string> = {
  declarado: 'Declarado',
  indicado: 'Indicado',
  validado: 'Experiência validada',
  verificado: 'Verificado',
};

interface Perfil {
  profissional: { id: number; name: string; title: string; city?: string | null; state?: string | null; available?: boolean };
  contexto: { motivos: string[]; confiancaMaxima: string | null };
  placar: { experiencias: number; experienciasValidadas: number; indicacoes: number; validacoes: number };
  experienciasRelevantes: Array<{ categoria: string | null; detalhe: string | null; confianca: string }>;
  qualificacoes: string[];
  caminho: Array<{ nome: string; descricao: string }>;
}

export default function OrbitMatch() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  // Quem procura é o usuário logado; cai em 1 (admin) só se não houver sessão ainda.
  const userId = String(user?.id_interno ?? user?.id ?? 1);
  const [necessidade, setNecessidade] = useState('');
  const [categoria, setCategoria] = useState('');
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [perfilCarregando, setPerfilCarregando] = useState(false);
  const [aba, setAba] = useState<'rede' | 'indicacoes' | 'proximos'>('rede');

  // Classifica cada resultado por ORIGEM, a partir dos chips (que vêm do banco).
  // Indicação: tem chip "Indicado...". Rede: tem experiência/trabalhou. Próximos: sem fato.
  function origemDe(r: Resultado): 'rede' | 'indicacoes' | 'proximos' {
    if (r.chips.some(c => c.startsWith('Indicado'))) return 'indicacoes';
    if (r.chips.some(c => c.startsWith('Experiência') || c.startsWith('Trabalhou') || c.includes(' em '))) return 'rede';
    return 'proximos';
  }

  async function abrirPerfil(profId: number) {
    setPerfilCarregando(true);
    setPerfil(null);
    try {
      const r = await fetch(`/api/orbitmatch/profile/${profId}?userId=${userId}`);
      const j = await r.json();
      if (j.success) setPerfil(j);
    } finally {
      setPerfilCarregando(false);
    }
  }

  async function buscar() {
    setCarregando(true);
    setErro('');
    try {
      const q = new URLSearchParams({ userId });
      if (categoria) q.set('categoria', categoria);
      const r = await fetch(`/api/orbitmatch/search?${q.toString()}`);
      const j = await r.json();
      if (!j.success) throw new Error(j.message || 'Falha na busca');
      // rede primeiro: quem tem motivo relacional sobe
      const ord = (j.resultados as Resultado[]).sort(
        (a, b) => b.motivos.length - a.motivos.length || b.sinalRelacional - a.sinalRelacional,
      );
      setResultados(ord);
    } catch (e: any) {
      setErro(e?.message || 'Erro');
      setResultados(null);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px 80px' }}>
        {/* marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `radial-gradient(circle at 50% 40%, ${C.cyan}, ${C.blue} 60%, transparent)`, boxShadow: `0 0 16px ${C.blue}66` }} />
          <span style={{ letterSpacing: 3, fontWeight: 700, fontSize: 18 }}>ORBITRUM</span>
        </div>
        <p style={{ color: C.ink3, marginTop: 0, marginBottom: 28, fontSize: 13 }}>
          A rede que aprende com as próprias conexões.
        </p>

        {/* busca — o CTA principal */}
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 16px' }}>O que você precisa resolver?</h1>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input
            value={necessidade}
            onChange={e => setNecessidade(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder="Ex.: Preciso de um eletricista amanhã..."
            style={{
              flex: 1, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 26,
              padding: '14px 20px', color: C.ink, fontSize: 15, outline: 'none',
            }}
          />
          <button
            onClick={buscar}
            disabled={carregando}
            style={{
              width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012',
              fontSize: 20, fontWeight: 700, boxShadow: `0 0 20px ${C.blue}55`,
            }}
            aria-label="Buscar"
          >→</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          {['', 'eletrica', 'pintura', 'reforma', 'design'].map(c => (
            <button
              key={c || 'todas'}
              onClick={() => setCategoria(c)}
              style={{
                background: categoria === c ? `${C.blue}22` : 'transparent',
                border: `1px solid ${categoria === c ? C.borderHot : C.border}`,
                color: categoria === c ? C.ink : C.ink2, borderRadius: 16,
                padding: '6px 14px', fontSize: 12, cursor: 'pointer',
              }}
            >{c ? c[0].toUpperCase() + c.slice(1) : 'Todas'}</button>
          ))}
          <input
            value={userId}
            onChange={e => setUserId(e.target.value)}
            title="Quem procura (userId) — provisório até o login integrar"
            style={{ width: 64, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: '6px 10px', color: C.ink3, fontSize: 12 }}
          />
        </div>

        {erro && <p style={{ color: '#ff6b6b' }}>{erro}</p>}
        {carregando && <p style={{ color: C.ink2 }}>Consultando a rede…</p>}

        {resultados && (() => {
          const grupos = {
            rede: resultados.filter(r => origemDe(r) === 'rede'),
            indicacoes: resultados.filter(r => origemDe(r) === 'indicacoes'),
            proximos: resultados.filter(r => origemDe(r) === 'proximos'),
          };
          const abas: Array<['rede' | 'indicacoes' | 'proximos', string]> = [
            ['rede', 'Sua rede'], ['indicacoes', 'Indicações'], ['proximos', 'Próximos'],
          ];
          const visiveis = grupos[aba];
          return (
          <>
            <p style={{ color: C.ink2, fontSize: 13, marginBottom: 12 }}>
              {resultados.filter(r => r.motivos.length).length} conexões encontradas
              {' · '}{resultados.length} no total
            </p>
            {/* TABS por origem (design alvo) */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {abas.map(([k, label]) => (
                <button key={k} onClick={() => setAba(k)}
                  style={{
                    background: aba === k ? `${C.blue}22` : 'transparent',
                    border: `1px solid ${aba === k ? C.borderHot : C.border}`,
                    color: aba === k ? C.ink : C.ink2, borderRadius: 16,
                    padding: '6px 14px', fontSize: 13, cursor: 'pointer',
                  }}>
                  {label} ({grupos[k].length})
                </button>
              ))}
            </div>
            {visiveis.length === 0 && (
              <p style={{ color: C.ink3, fontSize: 13, padding: '12px 0' }}>
                {aba === 'rede' && 'Ainda não há ninguém da sua rede com experiência aqui.'}
                {aba === 'indicacoes' && 'Nenhuma indicação da sua rede para esta necessidade ainda.'}
                {aba === 'proximos' && 'Sem outros profissionais próximos no momento.'}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visiveis.map(r => {
                const naRede = r.motivos.length > 0;
                return (
                  <div
                    key={r.profissional.id}
                    onClick={() => abrirPerfil(r.profissional.id)}
                    style={{
                      background: C.card, border: `1px solid ${naRede ? C.borderHot : C.border}`,
                      borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                      boxShadow: naRede ? `0 0 20px ${C.blue}14` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <Avatar src={r.profissional.avatar} name={r.profissional.name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 16 }}>{r.profissional.name}</div>
                            <div style={{ color: C.ink3, fontSize: 12 }}>
                              {r.profissional.title}{r.profissional.city ? ` · ${r.profissional.city}` : ''}
                            </div>
                          </div>
                          <button
                            style={{
                              border: 'none', cursor: 'pointer', borderRadius: 20, padding: '8px 18px', flexShrink: 0,
                              background: naRede ? `linear-gradient(135deg, ${C.cyan}, ${C.blue})` : 'transparent',
                              color: naRede ? '#012' : C.ink2, fontWeight: 600, fontSize: 13,
                              boxShadow: naRede ? `0 0 14px ${C.blue}44` : 'none',
                              ...(naRede ? {} : { border: `1px solid ${C.border}` }),
                            }}
                          >Conectar</button>
                        </div>

                        {/* POR QUE APARECEU — chips (design alvo, §9) */}
                        {naRede ? (
                          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {r.chips.map((c, i) => <Chip key={i} label={c} />)}
                          </div>
                        ) : (
                          <div style={{ marginTop: 8, fontSize: 12, color: C.ink3 }}>
                            A rede ainda não tem experiências registradas com essa pessoa.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ color: C.ink3, fontSize: 11, marginTop: 24, textAlign: 'center' }}>
              A rede explica por que cada pessoa apareceu — nunca mostra o grafo inteiro.
            </p>
          </>
          );
        })()}
      </div>

      {/* PERFIL / CONTEXTO — substitui o modal de tokens. Sem preço, sem estrela: contexto. */}
      {(perfil || perfilCarregando) && (
        <div
          onClick={() => { setPerfil(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(1,6,14,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 20, overflowY: 'auto', zIndex: 50 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: C.bg2, border: `1px solid ${C.borderHot}`, borderRadius: 16, maxWidth: 560, width: '100%', marginTop: 40, padding: 24, boxShadow: `0 0 40px ${C.blue}22` }}
          >
            {perfilCarregando && <p style={{ color: C.ink2 }}>Carregando contexto…</p>}
            {perfil && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{perfil.profissional.name}</div>
                    <div style={{ color: C.ink3, fontSize: 13 }}>
                      {perfil.profissional.title}
                      {perfil.profissional.city ? ` · ${perfil.profissional.city}` : ''}
                    </div>
                  </div>
                  <button onClick={() => setPerfil(null)} style={{ background: 'none', border: 'none', color: C.ink2, fontSize: 22, cursor: 'pointer' }}>×</button>
                </div>

                {/* placar — experiências, indicações, validações (não estrelas) */}
                <div style={{ display: 'flex', gap: 12, margin: '20px 0' }}>
                  {[
                    ['Experiências', perfil.placar.experiencias],
                    ['Indicações', perfil.placar.indicacoes],
                    ['Validações', perfil.placar.validacoes],
                  ].map(([label, n]) => (
                    <div key={label as string} style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: C.cyan }}>{n as number}</div>
                      <div style={{ fontSize: 11, color: C.ink3 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* COMO VOCÊ CHEGOU ATÉ ELE? — o caminho relacional (§6/§18), Trust Graph como camada */}
                {perfil.caminho.length > 1 && (
                  <div style={{ marginBottom: 18, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 12, color: C.ink3, marginBottom: 12, letterSpacing: 1 }}>COMO VOCÊ CHEGOU ATÉ ELE?</div>
                    {perfil.caminho.map((p, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{p.nome[0]?.toUpperCase()}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nome}</div>
                            <div style={{ fontSize: 11, color: C.ink3 }}>{p.descricao}</div>
                          </div>
                        </div>
                        {i < perfil.caminho.length - 1 && (
                          <div style={{ marginLeft: 14, color: C.cyan, fontSize: 14, lineHeight: '18px' }}>↓</div>
                        )}
                      </div>
                    ))}
                    <div style={{ fontSize: 10, color: C.ink3, marginTop: 10 }}>Trust &amp; Referral Graph · Transparência em cada conexão.</div>
                  </div>
                )}

                {/* por que apareceu */}
                {perfil.contexto.motivos.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, color: C.ink3, marginBottom: 8, letterSpacing: 1 }}>POR QUE ESTÁ AQUI</div>
                    {perfil.contexto.motivos.map((m, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: C.ink, marginBottom: 6 }}>
                        <span style={{ color: C.cyan }}>✓</span> {m}
                      </div>
                    ))}
                  </div>
                )}

                {/* experiências relevantes — o que fez, não só quanto */}
                {perfil.experienciasRelevantes.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, color: C.ink3, marginBottom: 8, letterSpacing: 1 }}>EXPERIÊNCIAS RELEVANTES</div>
                    {perfil.experienciasRelevantes.map((e, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.ink, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                        <span>{e.detalhe || e.categoria}</span>
                        <span style={{ color: C.cyan, fontSize: 11 }}>{CONF_LABEL[e.confianca] || e.confianca}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => setLocation(`/conversa/${perfil.profissional.id}`)} style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 24, padding: '14px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 15, boxShadow: `0 0 20px ${C.blue}44` }}>
                  Conectar
                </button>
                <p style={{ color: C.ink3, fontSize: 11, textAlign: 'center', marginTop: 12 }}>
                  Cliente e profissional combinam direto — a rede conecta e registra a experiência.
                </p>
              </>
            )}
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
