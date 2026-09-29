import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

// PERFIL PROFISSIONAL — versão TESE (substitui o antigo modal de tokens).
// Sem tokens, sem estrelas. Mostra: por que apareceu, placar de experiências/
// indicações/validações, "como você chegou até ele" e especialidades — tudo do
// banco via /api/orbitmatch/profile. Nada é fabricado (contrato visual).
// Mantém as MESMAS props do modal antigo para não quebrar home.tsx e teams.tsx.

interface ProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: number;
  onAddToTeam?: (professional: any) => void;
  // Quando fornecido, "Conectar" abre a conversa INLINE (mesma tela) em vez de
  // navegar para /conversa — honra "tudo acontece aqui, sem mudar de aba".
  onConectar?: (profId: number) => void;
}

const C = {
  bg2: '#011527', card: 'rgba(3,18,32,0.9)',
  cyan: '#00D9FF', blue: '#00AEEF',
  border: 'rgba(0,190,255,0.22)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#EAF8FF', ink2: '#7FA9C2', ink3: '#5b7a90',
};
const CONF_LABEL: Record<string, string> = {
  declarado: 'Declarado', indicado: 'Indicado',
  validado: 'Experiência validada', verificado: 'Verificado',
};

export function ProfessionalModal({ isOpen, onClose, professionalId, onConectar }: ProfessionalModalProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [perfil, setPerfil] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const userId = user?.id_interno ?? 1;

  useEffect(() => {
    if (!isOpen || !professionalId) return;
    setCarregando(true); setPerfil(null);
    fetch(`/api/orbitmatch/profile/${professionalId}?userId=${userId}`)
      .then(r => r.json())
      .then(j => { if (j.success) setPerfil(j); })
      .finally(() => setCarregando(false));
  }, [isOpen, professionalId, userId]);

  if (!isOpen) return null;

  const p = perfil?.profissional;
  const chips: string[] = perfil?.contexto?.chips ?? [];
  const motivos: string[] = perfil?.contexto?.motivos ?? [];
  const placar = perfil?.placar;
  const caminho: Array<{ nome: string; descricao: string; avatar?: string | null }> = perfil?.caminho ?? [];
  const experiencias = perfil?.experienciasRelevantes ?? [];
  const especialidades: string[] = p?.services ?? [];

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,4,10,0.82)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 20, overflowY: 'auto', zIndex: 60, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: C.bg2, border: `1px solid ${C.borderHot}`, borderRadius: 18, maxWidth: 520, width: '100%', marginTop: 24, padding: 24, color: C.ink, boxShadow: `0 0 44px ${C.blue}22` }}>

        {carregando && <p style={{ color: C.ink2 }}>Carregando contexto…</p>}

        {!carregando && p && (
          <>
            {/* topo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {p.avatar
                  ? <img src={p.avatar} alt={p.name} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.borderHot}` }} />
                  : <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${C.blue}33`, border: `2px solid ${C.borderHot}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700, fontSize: 24 }}>{p.name?.[0]}</div>}
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ color: C.ink3, fontSize: 13 }}>{p.title}{p.city ? ` · ${p.city}` : ''}</div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.ink2, fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            {/* chips de fato */}
            {chips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {chips.map((c, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.ink, background: `${C.blue}14`, border: `1px solid ${C.border}`, borderRadius: 12, padding: '3px 10px' }}>
                    <span style={{ color: C.cyan }}>✓</span>{c}
                  </span>
                ))}
              </div>
            )}

            {/* placar — experiências, indicações, validações (não estrelas) */}
            {placar && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                {[['Experiências', placar.experiencias], ['Indicações', placar.indicacoes], ['Validações', placar.validacoes]].map(([label, n]) => (
                  <div key={label as string} style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.cyan }}>{n as number}</div>
                    <div style={{ fontSize: 11, color: C.ink3 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* como você chegou até ele */}
            {caminho.length > 1 && (
              <div style={{ marginBottom: 18, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: C.ink3, marginBottom: 12, letterSpacing: 1 }}>COMO VOCÊ CHEGOU ATÉ ELE?</div>
                {caminho.map((s, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {s.avatar
                        ? <img src={s.avatar} alt={s.nome} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.borderHot}` }} />
                        : <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700, fontSize: 12 }}>{s.nome[0]?.toUpperCase()}</div>}
                      <div><div style={{ fontSize: 13, fontWeight: 600 }}>{s.nome}</div><div style={{ fontSize: 11, color: C.ink3 }}>{s.descricao}</div></div>
                    </div>
                    {i < caminho.length - 1 && <div style={{ marginLeft: 13, color: C.cyan, fontSize: 14 }}>↓</div>}
                  </div>
                ))}
                <div style={{ fontSize: 10, color: C.ink3, marginTop: 10 }}>Trust &amp; Referral Graph · Transparência em cada conexão.</div>
              </div>
            )}

            {/* por que apareceu */}
            {motivos.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: C.ink3, marginBottom: 8, letterSpacing: 1 }}>POR QUE ESTÁ AQUI</div>
                {motivos.map((m, i) => <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 6 }}><span style={{ color: C.cyan }}>✓</span>{m}</div>)}
              </div>
            )}

            {/* experiências relevantes */}
            {experiencias.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: C.ink3, marginBottom: 8, letterSpacing: 1 }}>EXPERIÊNCIAS RELEVANTES</div>
                {experiencias.map((e: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span>{e.detalhe || e.categoria}</span>
                    <span style={{ color: C.cyan, fontSize: 11 }}>{CONF_LABEL[e.confianca] || e.confianca}</span>
                  </div>
                ))}
              </div>
            )}

            {/* especialidades */}
            {especialidades.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: C.ink3, marginBottom: 8, letterSpacing: 1 }}>ESPECIALIDADES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {especialidades.map((s, i) => (
                    <span key={i} style={{ fontSize: 12, color: C.ink2, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 12, padding: '4px 12px' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* estado vazio honesto */}
            {chips.length === 0 && (!placar || placar.experiencias + placar.indicacoes + placar.validacoes === 0) && (
              <p style={{ color: C.ink3, fontSize: 13, marginBottom: 16 }}>
                A rede ainda não tem experiências registradas com essa pessoa. Conecte-se — quando o
                serviço acontecer e os dois confirmarem, a rede aprende.
              </p>
            )}

            {/* CTA — conectar leva à conversa/experiência */}
            <button onClick={() => { if (onConectar) { onConectar(p.id); } else { onClose(); setLocation(`/conversa/${p.id}`); } }}
              style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 24, padding: '14px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 15, boxShadow: `0 0 20px ${C.blue}44` }}>
              Conectar
            </button>
            <p style={{ color: C.ink3, fontSize: 11, textAlign: 'center', marginTop: 12 }}>
              Cliente e profissional combinam direto — a rede conecta e registra a experiência.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
