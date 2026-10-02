import { useState } from 'react';

const C = {
  bg2: '#011527', card: 'rgba(3,18,32,0.9)',
  cyan: '#00D9FF', blue: '#00AEEF',
  border: 'rgba(0,190,255,0.22)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#EAF8FF', ink2: '#7FA9C2', ink3: '#5b7a90',
};

const SERVICOS_POR_AREA: Record<string, string[]> = {
  'eletricista': ['Instalação', 'Reparo', 'Manutenção preventiva', 'Tomadas/interruptores', 'Quadro elétrico', 'Iluminação'],
  'encanador': ['Vazamento', 'Instalação', 'Desentupimento', 'Caixa d\'água', 'Esgoto', 'Torneira/registro'],
  'diarista': ['Limpeza geral', 'Limpeza pesada', 'Passar roupa', 'Cozinhar', 'Organização'],
  'pintor': ['Pintura interna', 'Pintura externa', 'Textura', 'Verniz', 'Retoque'],
  'pedreiro': ['Reforma', 'Construção', 'Reboco', 'Contrapiso', 'Muro/cerca'],
  'marceneiro': ['Móvel sob medida', 'Reparo', 'Montagem', 'Porta/janela', 'Acabamento'],
  'técnico': ['Instalação', 'Manutenção', 'Reparo', 'Configuração', 'Diagnóstico'],
  'default': ['Serviço pontual', 'Manutenção', 'Instalação', 'Reparo', 'Consultoria', 'Outro'],
};

const QUANDO = ['Agora', 'Hoje', 'Esta semana', 'Agendar dia'];
const URGENCIA = ['Tranquilo', 'Normal', 'Urgente'];

function detectarArea(title?: string): string {
  if (!title) return 'default';
  const t = title.toLowerCase();
  for (const area of Object.keys(SERVICOS_POR_AREA)) {
    if (area !== 'default' && t.includes(area)) return area;
  }
  if (t.includes('elétric') || t.includes('eletric')) return 'eletricista';
  if (t.includes('encanad') || t.includes('hidrául')) return 'encanador';
  if (t.includes('faxin') || t.includes('limpez') || t.includes('diari')) return 'diarista';
  if (t.includes('pintu') || t.includes('pintor')) return 'pintor';
  if (t.includes('pedrei') || t.includes('constru')) return 'pedreiro';
  if (t.includes('marcen') || t.includes('carpint')) return 'marceneiro';
  if (t.includes('técni') || t.includes('tecni')) return 'técnico';
  return 'default';
}

interface Props {
  profName: string;
  profTitle?: string;
  profAvatar?: string | null;
  onSubmit: (contexto: { servicos: string[]; quando: string; urgencia: string; detalhe: string }) => void;
  onSkip: () => void;
}

export default function ContextoServicoStep({ profName, profTitle, profAvatar, onSubmit, onSkip }: Props) {
  const [servicos, setServicos] = useState<string[]>([]);
  const [quando, setQuando] = useState('');
  const [urgencia, setUrgencia] = useState('');
  const [detalhe, setDetalhe] = useState('');

  const area = detectarArea(profTitle);
  const opcoes = SERVICOS_POR_AREA[area] || SERVICOS_POR_AREA['default'];

  const toggle = (item: string) => {
    setServicos(prev => prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]);
  };

  const pronto = servicos.length > 0 && quando;

  return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto', flex: 1 }}>
      {/* Header com pro */}
      <div style={{ textAlign: 'center' }}>
        {profAvatar
          ? <img src={profAvatar} alt={profName} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.cyan}44`, margin: '0 auto 8px' }} />
          : <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${C.blue}33`, border: `2px solid ${C.cyan}44`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontSize: 20, fontWeight: 700 }}>{profName?.[0]?.toUpperCase()}</div>
        }
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{profName}</div>
        {profTitle && <div style={{ fontSize: 12, color: C.ink2, marginTop: 2 }}>{profTitle}</div>}
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: C.cyan, textAlign: 'center' }}>
        O que você precisa?
      </div>

      {/* Chips de serviço */}
      <div>
        <div style={{ fontSize: 12, color: C.ink2, marginBottom: 8 }}>Selecione o serviço</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {opcoes.map(op => {
            const sel = servicos.includes(op);
            return (
              <button key={op} onClick={() => toggle(op)}
                style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: sel ? 600 : 400, cursor: 'pointer',
                  background: sel ? `${C.cyan}22` : 'transparent',
                  border: `1px solid ${sel ? C.cyan : C.border}`,
                  color: sel ? C.cyan : C.ink2, transition: 'all .2s',
                }}>
                {sel ? '✓ ' : ''}{op}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quando */}
      <div>
        <div style={{ fontSize: 12, color: C.ink2, marginBottom: 8 }}>Quando precisa?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {QUANDO.map(q => {
            const sel = quando === q;
            return (
              <button key={q} onClick={() => setQuando(q)}
                style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: sel ? 600 : 400, cursor: 'pointer',
                  background: sel ? `${C.blue}22` : 'transparent',
                  border: `1px solid ${sel ? C.blue : C.border}`,
                  color: sel ? C.blue : C.ink2, transition: 'all .2s',
                }}>
                {sel ? '● ' : ''}{q}
              </button>
            );
          })}
        </div>
      </div>

      {/* Urgência */}
      <div>
        <div style={{ fontSize: 12, color: C.ink2, marginBottom: 8 }}>Urgência</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {URGENCIA.map(u => {
            const sel = urgencia === u;
            const cor = u === 'Urgente' ? '#FF5252' : u === 'Normal' ? '#FF9800' : '#4ADE80';
            return (
              <button key={u} onClick={() => setUrgencia(u)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 20, fontSize: 13, fontWeight: sel ? 600 : 400, cursor: 'pointer',
                  background: sel ? `${cor}18` : 'transparent',
                  border: `1px solid ${sel ? cor : C.border}`,
                  color: sel ? cor : C.ink2, transition: 'all .2s',
                }}>
                {u}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalhe opcional */}
      <div>
        <div style={{ fontSize: 12, color: C.ink2, marginBottom: 8 }}>Algum detalhe? <span style={{ color: C.ink3 }}>(opcional)</span></div>
        <textarea value={detalhe} onChange={e => setDetalhe(e.target.value)}
          placeholder="Ex: preciso trocar 3 tomadas na sala..."
          rows={2}
          style={{ width: '100%', background: '#00080F', border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', color: C.ink, fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit' }} />
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={onSkip} style={{ flex: 1, padding: '12px 0', borderRadius: 22, border: `1px solid ${C.border}`, background: 'transparent', color: C.ink2, fontSize: 13, cursor: 'pointer' }}>
          Pular
        </button>
        <button onClick={() => pronto && onSubmit({ servicos, quando, urgencia: urgencia || 'Normal', detalhe })}
          disabled={!pronto}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 22, border: 'none', fontSize: 14, fontWeight: 600, cursor: pronto ? 'pointer' : 'default',
            background: pronto ? `linear-gradient(135deg, ${C.cyan}, ${C.blue})` : `${C.border}`,
            color: pronto ? '#012' : C.ink3, transition: 'all .2s',
            boxShadow: pronto ? `0 0 20px ${C.blue}44` : 'none',
          }}>
          Enviar para {profName.split(' ')[0]}
        </button>
      </div>
    </div>
  );
}
