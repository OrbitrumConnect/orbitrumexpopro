import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import Continuar from '@/components/Continuar';
import { DEMO_PROS, CONF_LABEL } from '@/data/demo-professionals';

interface ProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: number;
  onAddToTeam?: (professional: any) => void;
  onConectar?: (profId: number) => void;
}

const C = {
  bg2: '#011527', card: 'rgba(3,18,32,0.9)',
  cyan: '#00D9FF', blue: '#00AEEF',
  border: 'rgba(0,190,255,0.22)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#EAF8FF', ink2: '#7FA9C2', ink3: '#5b7a90',
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function ProfessionalModal({ isOpen, onClose, professionalId, onConectar }: ProfessionalModalProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [perfil, setPerfil] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [proOcupado, setProOcupado] = useState(false);
  const userId = user?.id_interno ?? 1;

  useEffect(() => {
    if (!isOpen) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
    fetch('/api/service-flow/status/ocupados')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.success) setProOcupado(j.ocupados.includes(professionalId)); })
      .catch(() => {});
  }, [isOpen, professionalId]);

  const buildFallbackPerfil = (p: any) => ({
    profissional: p,
    contexto: { chips: [], motivos: [] },
    placar: { experiencias: 0, indicacoes: 0, validacoes: 0 },
    conexoesEmComum: 0, caminho: [], experienciasRelevantes: [],
  });

  const tryFallback = () => {
    const cached: any[] | undefined = queryClient.getQueryData(['/api/professionals']);
    if (cached) {
      const found = cached.find((p: any) => p.id === professionalId);
      if (found) { setPerfil(buildFallbackPerfil(found)); return; }
    }
    const demo = DEMO_PROS[professionalId];
    if (demo) {
      setPerfil(buildFallbackPerfil({ id: professionalId, ...demo, services: demo.skills }));
      return;
    }
    fetch('/api/professionals').then(r => {
      if (!r.ok) throw new Error('');
      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('json')) throw new Error('');
      return r.json();
    }).then((list: any[]) => {
      const found = Array.isArray(list) ? list.find((p: any) => p.id === professionalId) : null;
      if (found) setPerfil(buildFallbackPerfil(found));
    }).catch(() => {});
  };

  useEffect(() => {
    if (!isOpen || !professionalId) return;
    setCarregando(true); setPerfil(null);
    fetch(`/api/orbitmatch/profile/${professionalId}?userId=${userId}`)
      .then(r => {
        const ct = r.headers.get('content-type') || '';
        if (!r.ok || !ct.includes('json')) throw new Error('not json');
        return r.json();
      })
      .then(j => {
        if (j.success) setPerfil(j); else throw new Error('no success');
        setCarregando(false);
      })
      .catch(() => {
        tryFallback();
        setCarregando(false);
      });
  }, [isOpen, professionalId, userId]);

  if (!isOpen) return null;

  const p = perfil?.profissional;
  const chips: string[] = perfil?.contexto?.chips ?? [];
  const motivos: string[] = perfil?.contexto?.motivos ?? [];
  const placar = perfil?.placar;
  const conexoesEmComum: number = perfil?.conexoesEmComum ?? 0;
  const caminho: Array<{ nome: string; descricao: string; avatar?: string | null }> = perfil?.caminho ?? [];
  const experiencias = perfil?.experienciasRelevantes ?? [];
  const especialidades: string[] = p?.services ?? [];

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,4,10,0.82)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 'clamp(6px, 2.5vw, 20px)', overflowY: 'auto', zIndex: 60, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: C.bg2, border: `1px solid ${C.borderHot}`, borderRadius: 18, maxWidth: 'min(760px, 96vw)', width: '100%', marginTop: 'clamp(8px, 2vh, 24px)', padding: 'clamp(16px, 4vw, 24px)', color: C.ink, boxShadow: `0 0 44px ${C.blue}22` }}>

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
                  {/* o que faz (escopo dos serviços) — perfil mais robusto, dado real */}
                  <div style={{ color: C.ink2, fontSize: 13 }}>{p.title}{especialidades.length ? ` · ${especialidades.slice(0, 2).join(' e ')}` : ''}</div>
                  {/* onde + disponibilidade (só o que o banco tem; sem distância fabricada) */}
                  <div style={{ color: C.ink3, fontSize: 12, marginTop: 2 }}>
                    {p.city ? `${p.city}${p.state ? '/' + p.state : ''}` : 'Região a combinar'}
                    {proOcupado ? <span style={{ color: '#FF9800' }}> · Ocupado</span> : p.available ? <span style={{ color: C.cyan }}> · Disponível</span> : ''}
                  </div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.ink2, fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            {/* info rápida: distância + disponibilidade */}
            {(() => {
              const dist = (userCoords && p.latitude && p.longitude)
                ? haversineKm(userCoords.lat, userCoords.lng, p.latitude, p.longitude)
                : null;
              const horario = p.workHours || p.availability?.schedule || null;
              const atende = p.serviceMode || (p.remoteAvailable ? 'Presencial e remoto' : null);
              return (dist !== null || horario || atende || p.available) ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {dist !== null && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.cyan, background: `${C.cyan}12`, border: `1px solid ${C.border}`, borderRadius: 10, padding: '5px 12px' }}>
                      📍 ~{dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`} de você
                    </span>
                  )}
                  {proOcupado ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#FF9800', background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.25)', borderRadius: 10, padding: '5px 12px' }}>
                      Em atendimento
                    </span>
                  ) : p.available ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5BF5A0', background: 'rgba(91,245,160,0.1)', border: '1px solid rgba(91,245,160,0.2)', borderRadius: 10, padding: '5px 12px' }}>
                      Disponível agora
                    </span>
                  ) : null}
                  {horario && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.ink2, background: `${C.blue}10`, border: `1px solid ${C.border}`, borderRadius: 10, padding: '5px 12px' }}>
                      {horario}
                    </span>
                  )}
                  {atende && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.ink2, background: `${C.blue}10`, border: `1px solid ${C.border}`, borderRadius: 10, padding: '5px 12px' }}>
                      {atende}
                    </span>
                  )}
                </div>
              ) : null;
            })()}

            {/* chips de fato */}
            {(chips.length > 0 || conexoesEmComum > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {chips.map((c, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.ink, background: `${C.blue}14`, border: `1px solid ${C.border}`, borderRadius: 12, padding: '3px 10px' }}>
                    <span style={{ color: C.cyan }}>✓</span>{c}
                  </span>
                ))}
                {conexoesEmComum > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.ink2, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 12, padding: '3px 10px' }}>
                    <span style={{ color: C.cyan }}>◎</span>{conexoesEmComum} {conexoesEmComum === 1 ? 'conexão em comum' : 'conexões em comum'}
                  </span>
                )}
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
            {proOcupado && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: 12, padding: '10px 16px', marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF9800', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#FF9800', fontWeight: 500 }}>Este profissional está em atendimento no momento</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { if (proOcupado) return; if (onConectar) { onConectar(p.id); } else { onClose(); setLocation(`/conversa/${p.id}`); } }}
                style={{ flex: 1, border: 'none', cursor: proOcupado ? 'not-allowed' : 'pointer', borderRadius: 24, padding: '14px', background: proOcupado ? 'rgba(255,152,0,0.15)' : `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: proOcupado ? '#FF9800' : '#012', fontWeight: 600, fontSize: 15, boxShadow: proOcupado ? 'none' : `0 0 20px ${C.blue}44`, opacity: proOcupado ? 0.7 : 1 }}>
                {proOcupado ? 'Ocupado' : 'Chamar'}
              </button>
              <button onClick={() => { onClose(); setLocation(`/perfil/${p.id}`); }}
                style={{ flex: 1, border: `1px solid ${C.borderHot}`, cursor: 'pointer', borderRadius: 24, padding: '14px', background: 'transparent', color: C.ink, fontWeight: 600, fontSize: 15 }}>
                Ver perfil completo
              </button>
            </div>
            <button onClick={async () => {
                try {
                  await fetch('/api/orbitmatch/indicar', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ indicadorUserId: userId, profissionalId: p.id }),
                  });
                  const url = `${window.location.origin}/perfil/${p.id}`;
                  if (navigator.share) {
                    navigator.share({ title: `${p.name} no Orbitrum`, text: `Conheça ${p.name} — ${p.title}`, url });
                  } else {
                    navigator.clipboard.writeText(url);
                    alert('Link copiado! Compartilhe com quem precisa.');
                  }
                } catch { alert('Link copiado!'); }
              }}
              style={{ width: '100%', border: `1px solid ${C.border}`, cursor: 'pointer', borderRadius: 24, padding: '10px', background: 'transparent', color: C.cyan, fontWeight: 500, fontSize: 13, marginTop: 8 }}>
              Indicar para alguém
            </button>
            <p style={{ color: C.ink3, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
              Chamar = iniciar conversa. Indicar = compartilhar este profissional com quem precisa.
            </p>

            {/* Camada de Continuidade: deep-links pro ecossistema (só o que o banco tem) */}
            <Continuar prof={p} />
          </>
        )}
      </div>
    </div>
  );
}
