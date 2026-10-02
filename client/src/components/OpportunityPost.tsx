import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const C = {
  bg2: '#061A2D', card: 'rgba(3,18,32,0.92)',
  cyan: '#00E5FF', blue: '#00AEEF', green: '#4ADE80',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.4)',
};

interface Props {
  necessidade?: string;
  onPosted?: () => void;
}

export default function OpportunityPost({ necessidade, onPosted }: Props) {
  const { user } = useAuth();
  const [descricao, setDescricao] = useState(necessidade || '');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const postar = async () => {
    if (!descricao.trim() || !user) return;
    setEnviando(true);
    try {
      const r = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (user as any).id_interno || (user as any).id,
          userName: (user as any).fullName || (user as any).username || 'Usuário',
          descricao: descricao.trim(),
          categoria: '',
        }),
      });
      if (r.ok) {
        setEnviado(true);
        onPosted?.();
      }
    } catch {}
    setEnviando(false);
  };

  if (enviado) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.borderHot}`, borderRadius: 14, padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.green }}>Necessidade publicada na rede!</div>
        <div style={{ fontSize: 12, color: C.ink2, marginTop: 4 }}>
          Pessoas da sua rede podem recomendar profissionais pra você.
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
        Postar na rede
      </div>
      <div style={{ fontSize: 12, color: C.ink2, marginBottom: 10 }}>
        Não encontrou o que precisava? Publique sua necessidade — sua rede indica.
      </div>
      <textarea
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
        placeholder="Ex.: Preciso de um eletricista em Copacabana para amanhã"
        rows={2}
        style={{
          width: '100%', resize: 'none', borderRadius: 10, padding: '10px 12px',
          background: C.bg2, border: `1px solid ${C.border}`, color: C.ink,
          fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
        }}
      />
      <button onClick={postar} disabled={enviando || !descricao.trim()}
        style={{
          marginTop: 8, width: '100%', border: 'none', borderRadius: 10, padding: '10px',
          background: descricao.trim() ? `linear-gradient(135deg, ${C.cyan}, ${C.blue})` : C.ink3,
          color: '#012', fontWeight: 700, fontSize: 13,
          cursor: descricao.trim() ? 'pointer' : 'not-allowed',
        }}>
        {enviando ? 'Publicando...' : 'Publicar necessidade'}
      </button>
    </div>
  );
}
