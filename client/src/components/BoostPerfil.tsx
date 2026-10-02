import { useState, useEffect } from 'react';

const C = {
  bg2: '#061A2D', card: 'rgba(3,18,32,0.92)', surface: '#0A1929',
  cyan: '#00E5FF', blue: '#00AEEF', green: '#4ADE80', amber: '#F59E0B',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.4)',
};

interface Boost {
  tipo: string;
  ativadoEm: string;
  expiraEm: string;
  custoCreditos: number;
}

interface Props {
  profId: number;
}

export default function BoostPerfil({ profId }: Props) {
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [precos, setPrecos] = useState<Record<string, number>>({});
  const [ativando, setAtivando] = useState(false);
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    fetch('/api/boost/precos').then(r => r.json()).then(j => {
      if (j.precos) setPrecos(j.precos);
    }).catch(() => {});
    carregarBoosts();
  }, [profId]);

  const carregarBoosts = () => {
    fetch(`/api/boost/ativos/${profId}`).then(r => r.json()).then(j => {
      if (j.boosts) setBoosts(j.boosts);
    }).catch(() => {});
  };

  const ativar = async (tipo: string) => {
    setAtivando(true);
    setSucesso('');
    try {
      const r = await fetch('/api/boost/ativar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profId, tipo, duracaoHoras: 24 }),
      });
      const j = await r.json();
      if (j.success) {
        setSucesso(j.mensagem);
        carregarBoosts();
      }
    } catch {}
    setAtivando(false);
  };

  const temBoostAtivo = boosts.length > 0;

  const OPCOES = [
    { tipo: 'destaque', titulo: 'Destaque geral', desc: 'Seu perfil aparece primeiro em todas as buscas da região', icone: '⭐' },
    { tipo: 'categoria', titulo: 'Boost por categoria', desc: 'Apareça primeiro quando buscarem sua especialidade', icone: '🎯' },
    { tipo: 'regiao', titulo: 'Visibilidade na região', desc: 'Destaque no mapa para pessoas próximas a você', icone: '📍' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 16, color: C.ink, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          🚀 Impulsionar perfil
        </div>
        <div style={{ fontSize: 12, color: C.ink2, marginBottom: 16 }}>
          Use seus créditos para aparecer em destaque. Mais visibilidade = mais oportunidades.
        </div>

        {temBoostAtivo && (
          <div style={{ background: `${C.green}12`, border: `1px solid ${C.green}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.green }}>
              ✓ Perfil em destaque agora
            </div>
            {boosts.map((b, i) => {
              const restante = Math.max(0, Math.ceil((new Date(b.expiraEm).getTime() - Date.now()) / 3600000));
              return (
                <div key={i} style={{ fontSize: 11, color: C.ink2, marginTop: 4 }}>
                  {b.tipo === 'destaque' ? '⭐' : b.tipo === 'categoria' ? '🎯' : '📍'} {b.tipo} — expira em {restante}h
                </div>
              );
            })}
          </div>
        )}

        {sucesso && (
          <div style={{ background: `${C.cyan}12`, border: `1px solid ${C.cyan}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: C.cyan }}>
            {sucesso}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPCOES.map(op => {
            const preco = precos[op.tipo] || 0;
            const jaAtivo = boosts.some(b => b.tipo === op.tipo);
            return (
              <div key={op.tipo} style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{op.icone}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{op.titulo}</div>
                  <div style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{op.desc}</div>
                </div>
                <button
                  onClick={() => ativar(op.tipo)}
                  disabled={ativando || jaAtivo}
                  style={{
                    border: 'none', borderRadius: 10, padding: '8px 14px',
                    background: jaAtivo ? C.ink3 : `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
                    color: jaAtivo ? C.ink2 : '#012', fontWeight: 700, fontSize: 12,
                    cursor: jaAtivo ? 'default' : 'pointer', whiteSpace: 'nowrap',
                  }}>
                  {jaAtivo ? 'Ativo' : `${preco} créditos`}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 11, color: C.ink3, marginTop: 14, textAlign: 'center', lineHeight: 1.5 }}>
          Créditos são ganhos por experiências, indicações e atividade na rede.
          <br />Cada boost dura 24 horas.
        </div>
      </div>
    </div>
  );
}
