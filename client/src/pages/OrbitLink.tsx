import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';

const C = {
  bg: '#020914', card: 'rgba(3,18,32,0.92)', surface: '#0A1929',
  cyan: '#00E5FF', blue: '#00AEEF', green: '#4ADE80',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#5b7a90',
  border: 'rgba(0,190,255,0.18)', borderHot: 'rgba(0,190,255,0.4)',
};

export default function OrbitLink() {
  const [, params] = useRoute('/p/:id');
  const [, setLocation] = useLocation();
  const profId = params?.id ? parseInt(params.id, 10) : 0;
  const [perfil, setPerfil] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!profId) return;
    setCarregando(true);
    fetch(`/api/public/profile/${profId}`)
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.success) setPerfil(j); })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, [profId]);

  useEffect(() => {
    if (!perfil?.profissional) return;
    const p = perfil.profissional;
    document.title = `${p.name} — ${p.title} | Orbitrum`;
    let meta = document.querySelector('meta[property="og:title"]');
    if (!meta) { meta = document.createElement('meta'); (meta as any).setAttribute('property', 'og:title'); document.head.appendChild(meta); }
    meta.setAttribute('content', `${p.name} — ${p.title}`);

    let desc = document.querySelector('meta[property="og:description"]');
    if (!desc) { desc = document.createElement('meta'); (desc as any).setAttribute('property', 'og:description'); document.head.appendChild(desc); }
    desc.setAttribute('content', `${p.city ? p.city + (p.state ? '/' + p.state : '') + ' · ' : ''}${(p.services || []).slice(0, 3).join(', ')} — Conheça no Orbitrum`);
  }, [perfil]);

  const p = perfil?.profissional;
  const placar = perfil?.placar;

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(circle at 50% -10%, #06223B, ${C.bg} 55%)`, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(16px, 4vw, 40px)' }}>
      {/* Branding */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: C.cyan, textTransform: 'uppercase' }}>Orbitrum</div>
        <div style={{ fontSize: 11, color: C.ink3, marginTop: 4 }}>Rede profissional relacional</div>
      </div>

      {carregando && <div style={{ color: C.ink2, fontSize: 14 }}>Carregando perfil...</div>}

      {!carregando && !p && (
        <div style={{ textAlign: 'center', color: C.ink2 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Profissional não encontrado</div>
          <button onClick={() => setLocation('/')} style={{ marginTop: 16, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 24px', background: 'transparent', color: C.cyan, cursor: 'pointer', fontSize: 14 }}>
            Ir para o Orbitrum
          </button>
        </div>
      )}

      {!carregando && p && (
        <div style={{ maxWidth: 480, width: '100%' }}>
          {/* Card do profissional */}
          <div style={{ background: C.card, border: `1px solid ${C.borderHot}`, borderRadius: 20, padding: 'clamp(20px, 5vw, 32px)', marginBottom: 20, textAlign: 'center' }}>
            {p.avatar
              ? <img src={p.avatar} alt={p.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${C.borderHot}`, marginBottom: 16 }} />
              : <div style={{ width: 96, height: 96, borderRadius: '50%', background: `${C.blue}33`, border: `3px solid ${C.borderHot}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700, fontSize: 36, margin: '0 auto 16px' }}>{p.name?.[0]}</div>
            }
            <div style={{ fontSize: 22, fontWeight: 700 }}>{p.name}</div>
            <div style={{ color: C.ink2, fontSize: 15, marginTop: 4 }}>{p.title}</div>
            {p.city && (
              <div style={{ color: C.ink3, fontSize: 13, marginTop: 6 }}>
                📍 {p.city}{p.state ? `/${p.state}` : ''}
              </div>
            )}
            {p.available && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.green, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '4px 12px', marginTop: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} /> Disponível agora
              </span>
            )}

            {p.description && (
              <p style={{ color: C.ink2, fontSize: 13, lineHeight: 1.6, marginTop: 16, textAlign: 'left' }}>{p.description}</p>
            )}

            {/* Serviços */}
            {p.services?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.ink3, marginBottom: 8, textAlign: 'left' }}>SERVIÇOS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {p.services.map((s: string) => (
                    <span key={s} style={{ padding: '4px 10px', borderRadius: 16, background: `${C.cyan}12`, border: `1px solid ${C.border}`, color: C.cyan, fontSize: 12 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Placar */}
            {placar && (placar.experiencias > 0 || placar.indicacoes > 0) && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
                {placar.experiencias > 0 && (
                  <div style={{ background: C.surface, borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.cyan }}>{placar.experiencias}</div>
                    <div style={{ fontSize: 11, color: C.ink3 }}>Experiências</div>
                  </div>
                )}
                {placar.indicacoes > 0 && (
                  <div style={{ background: C.surface, borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.cyan }}>{placar.indicacoes}</div>
                    <div style={{ fontSize: 11, color: C.ink3 }}>Indicações</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => setLocation(`/perfil/${p.id}`)} style={{
              width: '100%', border: 'none', borderRadius: 14, padding: '14px',
              background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
              color: '#012', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}>
              Ver perfil completo no Orbitrum
            </button>
            <button onClick={() => {
              const url = window.location.href;
              if (navigator.share) {
                navigator.share({ title: `${p.name} — ${p.title}`, text: `Conheça ${p.name} no Orbitrum`, url });
              } else {
                navigator.clipboard.writeText(url);
                alert('Link copiado!');
              }
            }} style={{
              width: '100%', border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px',
              background: 'transparent', color: C.cyan, fontWeight: 500, fontSize: 14, cursor: 'pointer',
            }}>
              Compartilhar este perfil
            </button>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: C.ink3 }}>
            Orbitrum Connect — rede profissional que aprende com relações reais
          </div>
        </div>
      )}
    </div>
  );
}
