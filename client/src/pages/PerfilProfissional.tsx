import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import ConversaModal from '@/components/ConversaModal';
import Continuar from '@/components/Continuar';

const C = {
  bg: '#020914', bg2: '#011527', card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,190,255,0.22)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#EAF8FF', ink2: '#7FA9C2', ink3: '#5b7a90',
};

const CONF_LABEL: Record<string, string> = {
  declarado: 'Declarado', indicado: 'Indicado',
  validado: 'Experiência validada', verificado: 'Verificado',
};

const DEMO_PROS: Record<number, { name: string; title: string; avatar: string; skills: string[]; city?: string; state?: string; available?: boolean; description?: string }> = {
  1: { name: 'Carlos Silva', title: 'Pintor Residencial', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Pintura residencial', 'Pintura comercial', 'Textura', 'Efeito marmorizado'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Pintor com mais de 10 anos no mercado. Atende Centro, Zona Sul e Zona Norte do Rio. Trabalha com tintas de alta qualidade e acabamento fino.' },
  2: { name: 'João Pereira', title: 'Encanador', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2e5c5b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Encanamento geral', 'Vazamentos', 'Caixa d\'agua', 'Esgoto'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Encanador profissional, atende Tijuca e região. Emergências 24h para vazamentos e entupimentos.' },
  3: { name: 'Rafael Costa', title: 'Eletricista', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Instalacao eletrica', 'Manutencao', 'Quadro de disjuntores', 'Tomadas e interruptores'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Eletricista com CREA ativo. Especialista em instalacoes residenciais e comerciais na Barra da Tijuca e regiao.' },
  4: { name: 'Ana Oliveira', title: 'Chaveiro', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Abertura de portas', 'Copia de chaves', 'Fechaduras digitais', 'Cofres'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Chaveira 24h em Copacabana e arredores. Abertura sem danificar, troca de segredo, fechaduras eletronicas.' },
  5: { name: 'Fernanda Santos', title: 'Baba', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Cuidar de criancas', 'Baba noturna', 'Acompanhamento escolar', 'Recreacao'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Baba com experiencia em criancas de 0 a 10 anos. Atende Botafogo, Flamengo e Laranjeiras. Referencias disponiveis.' },
  6: { name: 'Pedro Almeida', title: 'Passeador de Cachorro', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Passeio com cachorros', 'Dog walker', 'Adestramento basico', 'Pet sitting'], city: 'Niteroi', state: 'RJ', available: true, description: 'Dog walker em Niteroi. Passeios individuais e em grupo, adestramento basico e hospedagem pet.' },
  7: { name: 'Maria Limpeza', title: 'Diarista', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Faxina residencial', 'Limpeza pos-obra', 'Lavagem de estofados', 'Organizacao'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Diarista profissional, atende Recreio e Barra. Limpeza completa, organizacao e higienizacao de estofados.' },
  8: { name: 'Roberto Silva', title: 'Jardineiro', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Jardinagem', 'Poda de arvores', 'Paisagismo', 'Manutencao de jardim'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Jardineiro e paisagista em Jacarepagua. Manutencao de jardins, condominios e areas comerciais.' },
  9: { name: 'Jose Mecanico', title: 'Mecanico', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Mecanica geral', 'Troca de oleo', 'Freios', 'Suspensao'], city: 'Sao Goncalo', state: 'RJ', available: true, description: 'Mecanico com oficina em Sao Goncalo. Especialista em carros nacionais e importados. Diagnostico gratuito.' },
  10: { name: 'Lucas Ferreira', title: 'Desenvolvedor Mobile', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Apps Android', 'Apps iOS', 'React Native', 'Flutter'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Desenvolvedor mobile com 5 anos de experiencia. Apps para iOS e Android, prototipacao e publicacao nas lojas.' },
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
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {p.avatar
                  ? <img src={p.avatar} alt={p.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${C.borderHot}`, flexShrink: 0 }} />
                  : <div style={{ width: 96, height: 96, borderRadius: '50%', background: `${C.blue}33`, border: `3px solid ${C.borderHot}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700, fontSize: 36, flexShrink: 0 }}>{p.name?.[0]}</div>}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ color: C.ink2, fontSize: 15, marginTop: 2 }}>{p.title}</div>
                  <div style={{ color: C.ink3, fontSize: 13, marginTop: 4 }}>
                    {p.city ? `${p.city}${p.state ? '/' + p.state : ''}` : 'Região a combinar'}
                  </div>
                  {p.available && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5BF5A0', background: 'rgba(91,245,160,0.1)', border: '1px solid rgba(91,245,160,0.2)', borderRadius: 10, padding: '4px 12px', marginTop: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5BF5A0' }} /> Disponível agora
                    </span>
                  )}
                  {p.description && (
                    <p style={{ color: C.ink2, fontSize: 13, lineHeight: 1.6, marginTop: 12, margin: '12px 0 0' }}>{p.description}</p>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setConversaId(p.id)}
                  style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 14, padding: '13px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 15 }}>
                  Chamar
                </button>
                <button onClick={() => setLocation('/mapa')}
                  style={{ border: `1px solid ${C.border}`, cursor: 'pointer', borderRadius: 14, padding: '13px 20px', background: 'transparent', color: C.ink2, fontWeight: 500, fontSize: 13 }}>
                  Ver no mapa
                </button>
              </div>
            </div>

            {/* Placar */}
            {placar && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[['Experiências', placar.experiencias], ['Indicações', placar.indicacoes], ['Validações', placar.validacoes]].map(([label, n]) => (
                  <div key={label as string} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: C.cyan }}>{n as number}</div>
                    <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{label}</div>
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

            {/* Continuidade */}
            <div style={{ marginTop: 16 }}>
              <Continuar prof={p} />
            </div>
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
