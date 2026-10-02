import { useState, useEffect } from 'react';

const C = {
  bg2: '#061A2D', card: 'rgba(3,18,32,0.92)', surface: '#0A1929',
  cyan: '#00E5FF', blue: '#00AEEF', green: '#4ADE80', amber: '#F59E0B',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
  border: 'rgba(0,174,255,0.18)',
};

interface Opportunity {
  id: string;
  userId: number;
  userName: string;
  descricao: string;
  categoria: string;
  cidade?: string;
  createdAt: string;
  recomendacoes: Array<{ profId: number; profName: string; byUserName: string }>;
}

export default function OpportunityFeed() {
  const [opps, setOpps] = useState<Opportunity[]>([]);

  useEffect(() => {
    fetch('/api/opportunities').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setOpps(data);
    }).catch(() => {});
  }, []);

  if (opps.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 24, color: C.ink3 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Nenhuma necessidade publicada ainda</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          Quando alguém da rede precisar de algo, vai aparecer aqui.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {opps.map(o => {
        const tempo = tempoAtras(o.createdAt);
        return (
          <div key={o.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: `${C.blue}33`,
                border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: C.cyan, fontWeight: 700, fontSize: 14,
              }}>{o.userName?.[0]?.toUpperCase() || '?'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{o.userName}</div>
                <div style={{ fontSize: 11, color: C.ink3 }}>{tempo}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.5, marginBottom: 8 }}>
              {o.descricao}
            </div>
            {o.recomendacoes.length > 0 && (
              <div style={{ fontSize: 12, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>✓</span> {o.recomendacoes.length} recomendaç{o.recomendacoes.length === 1 ? 'ão' : 'ões'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function tempoAtras(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)}d`;
}
