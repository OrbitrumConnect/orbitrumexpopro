import { useState, useEffect } from 'react';

const C = {
  bg: '#020914', card: 'rgba(3,18,32,0.92)', surface: '#0A1929',
  cyan: '#00E5FF', blue: '#00AEEF', green: '#4ADE80',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#5b7a90',
  border: 'rgba(0,190,255,0.18)', borderHot: 'rgba(0,190,255,0.4)',
};

const LABELS: Record<string, string> = {
  conversando: 'Conexão iniciada',
  combinado: 'Serviço combinado',
  a_caminho: 'Deslocamento',
  chegou: 'Chegada confirmada',
  em_servico: 'Serviço em andamento',
  concluido: 'Serviço concluído',
  validado: 'Experiência validada',
};

interface Transition { estado: string; by: number; at: string }

interface Props {
  chatId: string;
  profName: string;
  profTitle?: string;
  profAvatar?: string;
  clientName: string;
  clienteUserId: number;
  profUserId: number;
  onClose: () => void;
}

export default function RelatorioExperiencia({
  chatId, profName, profTitle, profAvatar, clientName,
  clienteUserId, profUserId, onClose,
}: Props) {
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [consentimento, setConsentimento] = useState(false);
  const [publicado, setPublicado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch(`/api/service-flow/${chatId}`)
      .then(r => r.json())
      .then(j => { if (j.transitions) setTransitions(j.transitions); })
      .catch(() => {});
  }, [chatId]);

  const inicio = transitions[0]?.at;
  const fim = transitions[transitions.length - 1]?.at;
  const duracao = inicio && fim
    ? Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 60000)
    : null;

  async function publicar() {
    if (!consentimento) return;
    setSalvando(true);
    try {
      await fetch('/api/relational-facts/relatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          clientId: clienteUserId,
          professionalId: profUserId,
          consentimento: true,
          transitions,
        }),
      });
      setPublicado(true);
    } catch {}
    setSalvando(false);
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.borderHot}`, borderRadius: 16, padding: 20, margin: '0 18px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.green }} />
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.green }}>
          Relatório de Experiência
        </h3>
      </div>

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ background: C.surface, borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: C.ink3, marginBottom: 2 }}>Profissional</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{profName}</div>
          {profTitle && <div style={{ fontSize: 11, color: C.ink2 }}>{profTitle}</div>}
        </div>
        <div style={{ background: C.surface, borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: C.ink3, marginBottom: 2 }}>Cliente</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{clientName}</div>
        </div>
        {inicio && (
          <div style={{ background: C.surface, borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: C.ink3, marginBottom: 2 }}>Data</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
              {new Date(inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        )}
        {duracao !== null && (
          <div style={{ background: C.surface, borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: C.ink3, marginBottom: 2 }}>Duração total</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
              {duracao < 60 ? `${duracao} min` : `${Math.floor(duracao / 60)}h${duracao % 60 > 0 ? `${duracao % 60}min` : ''}`}
            </div>
          </div>
        )}
      </div>

      {/* Timeline das transições */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.ink2, marginBottom: 8 }}>TRILHA DA EXPERIÊNCIA</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {transitions.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: i === transitions.length - 1 ? C.green : C.cyan,
                  border: `2px solid ${i === transitions.length - 1 ? C.green : C.cyan}`,
                }} />
                {i < transitions.length - 1 && (
                  <div style={{ width: 1, height: 24, background: C.border }} />
                )}
              </div>
              <div style={{ paddingBottom: i < transitions.length - 1 ? 14 : 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>
                  {LABELS[t.estado] || t.estado}
                </div>
                <div style={{ fontSize: 10, color: C.ink3 }}>
                  {new Date(t.at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                  {' · '}
                  {t.by === clienteUserId ? 'cliente' : 'profissional'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* §35 — Explicação do que isso significa */}
      <div style={{ background: `${C.cyan}08`, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: C.ink2, lineHeight: 1.5 }}>
        <strong style={{ color: C.ink }}>O que isso significa na rede:</strong> esta experiência
        validada por ambos os lados fortalece o perfil relacional de {profName} e o seu.
        Futuras buscas na rede considerarão esta conexão real — não como nota ou avaliação,
        mas como fato verificado de que o serviço aconteceu e foi confirmado.
      </div>

      {/* Consentimento LGPD (§44) */}
      {!publicado && (
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={consentimento} onChange={e => setConsentimento(e.target.checked)}
            style={{ marginTop: 3, accentColor: C.cyan, width: 16, height: 16, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.ink2, lineHeight: 1.5 }}>
            Consinto que este relatório de experiência seja registrado no meu perfil relacional
            do Orbitrum, visível para outros usuários da rede como fato verificado. Posso
            solicitar a remoção a qualquer momento conforme a LGPD (Lei 13.709/2018).
          </span>
        </label>
      )}

      {/* Ações */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {publicado ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.green, marginBottom: 8 }}>
              ✓ Experiência publicada na rede
            </div>
            <button onClick={onClose} style={{
              background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 16,
              padding: '8px 20px', color: C.ink2, fontSize: 12, cursor: 'pointer',
            }}>
              Voltar à rede
            </button>
          </div>
        ) : (
          <>
            <button onClick={publicar} disabled={!consentimento || salvando} style={{
              flex: 1, border: 'none', borderRadius: 12, padding: '11px 0', cursor: consentimento ? 'pointer' : 'not-allowed',
              background: consentimento ? `linear-gradient(135deg, ${C.green}, ${C.cyan})` : C.surface,
              color: consentimento ? C.bg : C.ink3, fontWeight: 600, fontSize: 13, opacity: salvando ? 0.6 : 1,
            }}>
              {salvando ? 'Publicando...' : 'Publicar na rede'}
            </button>
            <button onClick={onClose} style={{
              border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 16px',
              background: 'transparent', color: C.ink2, fontSize: 12, cursor: 'pointer',
            }}>
              Depois
            </button>
          </>
        )}
      </div>
    </div>
  );
}
