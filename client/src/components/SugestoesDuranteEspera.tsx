import { useState, useEffect } from 'react';

const C = {
  cyan: '#00D9FF', blue: '#00AEEF',
  border: 'rgba(0,190,255,0.22)',
  ink: '#EAF8FF', ink2: '#7FA9C2', ink3: '#5b7a90',
};

interface Prof {
  id: number; name: string; title: string; city?: string | null; avatar?: string | null;
  sinalRelacional?: number;
}

interface Props {
  profAtualId: number;
  profTitle?: string;
  onSelecionarOutro: (profId: number) => void;
}

export default function SugestoesDuranteEspera({ profAtualId, profTitle, onSelecionarOutro }: Props) {
  const [similares, setSimilares] = useState<Prof[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profTitle) { setLoading(false); return; }
    const area = profTitle.split(' ')[0];
    fetch(`/api/orbitmatch/search?q=${encodeURIComponent(area)}&limit=5`)
      .then(r => r.json())
      .then(j => {
        if (j.success && j.resultados) {
          const outros = j.resultados
            .filter((r: any) => r.profissional.id !== profAtualId)
            .slice(0, 3)
            .map((r: any) => ({ ...r.profissional, sinalRelacional: r.sinalRelacional }));
          setSimilares(outros);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profAtualId, profTitle]);

  if (loading || similares.length === 0) return null;

  return (
    <div style={{ padding: '10px 0', borderTop: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 12, color: C.ink2, marginBottom: 8, textAlign: 'center' }}>
        Enquanto aguarda, veja também
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {similares.map(p => (
          <button key={p.id} onClick={() => onSelecionarOutro(p.id)}
            style={{
              flex: '0 0 auto', minWidth: 130, background: `${C.blue}08`, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {p.avatar
                ? <img src={p.avatar} alt={p.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${C.blue}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontSize: 12, fontWeight: 700 }}>{p.name?.[0]}</div>
              }
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{p.name.split(' ')[0]}</div>
                <div style={{ fontSize: 10, color: C.ink3 }}>{p.title}</div>
              </div>
            </div>
            {typeof p.sinalRelacional === 'number' && (
              <div style={{ fontSize: 10, color: C.cyan }}>Sinal: {p.sinalRelacional}%</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
