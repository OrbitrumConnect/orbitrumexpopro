import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const C = {
  bg: '#020914', card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
};

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

interface Rec {
  profissional: { id: number; name: string; title: string; avatar?: string | null };
  sinalRelacional: number; motivos: string[]; chips: string[]; confianca: string | null;
}

export default function NetworkAside() {
  const { user } = useAuth();
  const userId = (user as any)?.id_interno ?? 1;
  const [recs, setRecs] = useState<Rec[]>([]);
  const [atividade, setAtividade] = useState<Array<{ texto: string; avatar?: string | null }>>([]);

  useEffect(() => {
    fetch(`/api/orbitmatch/search?userId=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.resultados) setRecs(j.resultados.slice(0, 3)); })
      .catch(() => {});

    fetch(`/api/orbitmatch/atividade?userId=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.atividades) setAtividade(j.atividades.slice(0, 5)); })
      .catch(() => {});
  }, [userId]);

  return (
    <aside style={{ width: 300, flexShrink: 0, padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>Recomendações para você</div>
        {recs.length === 0 && (
          <p style={{ color: C.ink3, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            Conforme sua rede acumula experiências, recomendações aparecem aqui — sempre com o motivo.
          </p>
        )}
        {recs.map(r => (
          <div key={r.profissional.id}
            style={{ borderTop: `1px solid ${C.border}`, padding: '12px 0', display: 'flex', gap: 10 }}>
            <Avatar src={r.profissional.avatar} name={r.profissional.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.profissional.name}</div>
              <div style={{ color: C.ink2, fontSize: 12, marginBottom: 6 }}>{r.profissional.title}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {r.chips.slice(0, 3).map((c, i) => <Chip key={i} label={c} />)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Oportunidades próximas</div>
        <p style={{ color: C.ink2, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
          Quando alguém publica uma necessidade na sua região, ela aparece aqui — você pode
          responder ou indicar quem resolve.
        </p>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
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
            Indicações, conexões e experiências validadas da rede aparecem aqui.
          </p>
        )}
      </div>
    </aside>
  );
}
