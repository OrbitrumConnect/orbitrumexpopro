import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const C = {
  bg2: '#061A2D', card: 'rgba(3,18,32,0.92)', surface: '#0A1929',
  cyan: '#00E5FF', blue: '#00AEEF', green: '#4ADE80', amber: '#F59E0B', red: '#EF4444',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.4)',
};

interface Membro {
  profId: number;
  nome: string;
  titulo: string;
  especialidade: string;
  status: 'convidado' | 'confirmado' | 'recusado' | 'indicou_outro';
  convidadoEm: string;
  respondidoEm?: string;
  indicouProfId?: number;
}

interface Equipe {
  id: string;
  titulo: string;
  descricao: string;
  responsavelId: number;
  regiao: string;
  dataInicio: string;
  dataFim: string;
  especialidades: string[];
  membros: Membro[];
  status: 'montando' | 'ativa' | 'concluida' | 'desfeita';
  criadaEm: string;
}

interface Convite {
  equipe: Equipe;
  membro: Membro;
}

type View = 'lista' | 'criar' | 'detalhes' | 'convites' | 'analytics';

export default function EquipesTab() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('lista');
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [equipeAtual, setEquipeAtual] = useState<Equipe | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [form, setForm] = useState({ titulo: '', descricao: '', regiao: '', dataInicio: '', dataFim: '', especialidades: '' });
  const [msg, setMsg] = useState('');

  const userId = user?.id_interno || user?.id || 1;

  useEffect(() => { carregarEquipes(); carregarConvites(); }, []);

  const carregarEquipes = () => {
    fetch(`/api/equipes/minhas/${userId}`).then(r => r.json()).then(j => {
      if (j.success) setEquipes(j.equipes);
    }).catch(() => {});
  };

  const carregarConvites = () => {
    fetch(`/api/equipes/convites/${userId}`).then(r => r.json()).then(j => {
      if (j.success) setConvites(j.convites);
    }).catch(() => {});
  };

  const criarEquipe = async () => {
    if (!form.titulo.trim()) return;
    const r = await fetch('/api/equipes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        responsavelId: userId,
        especialidades: form.especialidades.split(',').map(s => s.trim()).filter(Boolean),
      }),
    });
    const j = await r.json();
    if (j.success) {
      setMsg('Equipe criada!');
      setForm({ titulo: '', descricao: '', regiao: '', dataInicio: '', dataFim: '', especialidades: '' });
      carregarEquipes();
      setEquipeAtual(j.equipe);
      setView('detalhes');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const responderConvite = async (equipeId: string, profId: number, resposta: string) => {
    await fetch(`/api/equipes/${equipeId}/responder`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profId, resposta }),
    });
    carregarConvites();
    setMsg(resposta === 'aceitar' ? 'Convite aceito!' : 'Convite respondido.');
    setTimeout(() => setMsg(''), 3000);
  };

  const desfazerEquipe = async (id: string) => {
    const r = await fetch(`/api/equipes/${id}/desfazer`, { method: 'POST' });
    const j = await r.json();
    if (j.success) {
      setMsg(j.mensagem);
      carregarEquipes();
      setView('lista');
      setTimeout(() => setMsg(''), 5000);
    }
  };

  const concluirEquipe = async (id: string) => {
    const r = await fetch(`/api/equipes/${id}/concluir`, { method: 'POST' });
    const j = await r.json();
    if (j.success) {
      setMsg(j.mensagem);
      carregarEquipes();
      setTimeout(() => setMsg(''), 5000);
    }
  };

  const repetirEquipe = async (id: string) => {
    const r = await fetch(`/api/equipes/${id}/repetir`, { method: 'POST' });
    const j = await r.json();
    if (j.success) {
      setMsg(j.mensagem);
      carregarEquipes();
      setEquipeAtual(j.equipe);
      setView('detalhes');
      setTimeout(() => setMsg(''), 5000);
    }
  };

  const abrirAnalytics = async (id: string) => {
    const r = await fetch(`/api/equipes/${id}/analytics`);
    const j = await r.json();
    if (j.success) {
      setAnalytics(j.analytics);
      setView('analytics');
    }
  };

  const statusIcon = (s: Membro['status']) =>
    s === 'confirmado' ? '🟢' : s === 'convidado' ? '🟡' : s === 'recusado' ? '🔴' : '🔗';
  const statusLabel = (s: Membro['status']) =>
    s === 'confirmado' ? 'Confirmado' : s === 'convidado' ? 'Pendente' : s === 'recusado' ? 'Recusado' : 'Indicou outro';

  const btnStyle = (bg: string, color = '#012') => ({
    border: 'none', borderRadius: 10, padding: '8px 16px', background: bg,
    color, fontWeight: 600 as const, fontSize: 13, cursor: 'pointer' as const,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {msg && (
        <div style={{ background: `${C.green}15`, border: `1px solid ${C.green}33`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: C.green }}>
          {msg}
        </div>
      )}

      {/* HEADER + TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: C.ink }}>Equipes</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['lista', 'criar', 'convites'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ border: `1px solid ${view === v ? C.cyan : C.border}`, background: view === v ? `${C.cyan}15` : 'transparent', color: view === v ? C.cyan : C.ink2, borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: view === v ? 600 : 400 }}>
              {v === 'lista' ? 'Minhas' : v === 'criar' ? '+ Criar' : `Convites${convites.length > 0 ? ` (${convites.length})` : ''}`}
            </button>
          ))}
        </div>
      </div>
      <div style={{ color: C.ink3, fontSize: 12 }}>Monte times de profissionais para seus projetos.</div>

      {/* CRIAR EQUIPE */}
      {view === 'criar' && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: C.ink, marginBottom: 14 }}>Nova equipe</div>
          {[
            { key: 'titulo', label: 'Nome do projeto', placeholder: 'Ex: Reforma apartamento — Botafogo' },
            { key: 'descricao', label: 'Descrição', placeholder: 'Detalhes do projeto' },
            { key: 'regiao', label: 'Região', placeholder: 'Ex: Botafogo, Zona Sul RJ' },
            { key: 'especialidades', label: 'Especialidades (separadas por vírgula)', placeholder: 'elétrica, pintura, hidráulica' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.ink2, display: 'block', marginBottom: 4 }}>{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                style={{ width: '100%', padding: '8px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.ink, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: C.ink2, display: 'block', marginBottom: 4 }}>Data início</label>
              <input type="date" value={form.dataInicio} onChange={e => setForm({ ...form, dataInicio: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.ink, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: C.ink2, display: 'block', marginBottom: 4 }}>Data fim</label>
              <input type="date" value={form.dataFim} onChange={e => setForm({ ...form, dataFim: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.ink, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button onClick={criarEquipe} disabled={!form.titulo.trim()}
            style={{ ...btnStyle(`linear-gradient(135deg, ${C.cyan}, ${C.blue})`), width: '100%', opacity: form.titulo.trim() ? 1 : 0.5 }}>
            Criar equipe
          </button>
        </div>
      )}

      {/* LISTA DE EQUIPES */}
      {view === 'lista' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {equipes.length === 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>👥</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.ink, marginBottom: 6 }}>Nenhuma equipe ainda</div>
              <div style={{ color: C.ink3, fontSize: 12, marginBottom: 14 }}>
                Monte times de profissionais para seus projetos. Encontre no OrbitMatch, adicione ao time e convide.
              </div>
              <button onClick={() => setView('criar')} style={btnStyle(`linear-gradient(135deg, ${C.cyan}, ${C.blue})`)}>+ Criar equipe</button>
            </div>
          )}
          {equipes.map(eq => {
            const confirmados = eq.membros.filter(m => m.status === 'confirmado').length;
            const pendentes = eq.membros.filter(m => m.status === 'convidado').length;
            return (
              <div key={eq.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: C.ink }}>{eq.titulo}</div>
                    <div style={{ fontSize: 12, color: C.ink3 }}>{eq.membros.length} profissionais</div>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 600,
                    background: eq.status === 'concluida' ? `${C.green}15` : eq.status === 'desfeita' ? `${C.red}15` : `${C.cyan}15`,
                    color: eq.status === 'concluida' ? C.green : eq.status === 'desfeita' ? C.red : C.cyan,
                    border: `1px solid ${eq.status === 'concluida' ? C.green : eq.status === 'desfeita' ? C.red : C.cyan}33`,
                  }}>{eq.status === 'concluida' ? 'Concluída' : eq.status === 'desfeita' ? 'Desfeita' : eq.status === 'ativa' ? 'Ativa' : 'Montando'}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: C.ink2, marginBottom: 8, flexWrap: 'wrap' }}>
                  {confirmados > 0 && <span>🟢 {confirmados} confirmado{confirmados > 1 ? 's' : ''}</span>}
                  {pendentes > 0 && <span>🟡 {pendentes} pendente{pendentes > 1 ? 's' : ''}</span>}
                  {eq.regiao && <span>📍 {eq.regiao}</span>}
                  {eq.dataInicio && <span>📅 {eq.dataInicio}{eq.dataFim ? ` — ${eq.dataFim}` : ''}</span>}
                </div>
                {eq.especialidades.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                    {eq.especialidades.map((e, i) => (
                      <span key={i} style={{ fontSize: 11, background: `${C.blue}14`, border: `1px solid ${C.border}`, borderRadius: 10, padding: '2px 8px', color: C.ink }}>
                        {e}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => { setEquipeAtual(eq); setView('detalhes'); }}
                    style={btnStyle(`${C.cyan}15`, C.cyan)}>Abrir equipe</button>
                  <button onClick={() => { setEquipeAtual(eq); abrirAnalytics(eq.id); }}
                    style={btnStyle(`${C.blue}15`, C.blue)}>Analytics</button>
                  {eq.status === 'concluida' && (
                    <button onClick={() => repetirEquipe(eq.id)}
                      style={btnStyle(`${C.green}15`, C.green)}>Montar novamente</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETALHES DA EQUIPE */}
      {view === 'detalhes' && equipeAtual && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setView('lista')} style={{ alignSelf: 'flex-start', border: 'none', background: 'transparent', color: C.ink2, cursor: 'pointer', fontSize: 13 }}>← Voltar</button>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: C.ink, marginBottom: 4 }}>{equipeAtual.titulo}</div>
            {equipeAtual.descricao && <div style={{ color: C.ink2, fontSize: 13, marginBottom: 8 }}>{equipeAtual.descricao}</div>}
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: C.ink3, marginBottom: 14, flexWrap: 'wrap' }}>
              {equipeAtual.regiao && <span>📍 {equipeAtual.regiao}</span>}
              {equipeAtual.dataInicio && <span>📅 {equipeAtual.dataInicio}{equipeAtual.dataFim ? ` — ${equipeAtual.dataFim}` : ''}</span>}
            </div>

            <div style={{ fontWeight: 600, fontSize: 14, color: C.ink, marginBottom: 10 }}>
              Membros ({equipeAtual.membros.length})
            </div>
            {equipeAtual.membros.length === 0 && (
              <div style={{ color: C.ink3, fontSize: 13, padding: 12, textAlign: 'center' }}>
                Nenhum membro ainda. Encontre profissionais no OrbitMatch e adicione ao time.
              </div>
            )}
            {equipeAtual.membros.map(m => (
              <div key={m.profId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 16 }}>{statusIcon(m.status)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.ink }}>{m.nome || `Profissional #${m.profId}`}</div>
                  <div style={{ fontSize: 11, color: C.ink3 }}>{m.titulo}{m.especialidade ? ` · ${m.especialidade}` : ''}</div>
                </div>
                <span style={{ fontSize: 11, color: m.status === 'confirmado' ? C.green : m.status === 'convidado' ? C.amber : C.ink3 }}>
                  {statusLabel(m.status)}
                </span>
              </div>
            ))}

            {equipeAtual.status !== 'desfeita' && equipeAtual.status !== 'concluida' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {equipeAtual.membros.some(m => m.status === 'confirmado') && (
                  <button onClick={() => concluirEquipe(equipeAtual.id)} style={btnStyle(`${C.green}15`, C.green)}>Concluir equipe</button>
                )}
                <button onClick={() => { if (confirm('Desfazer esta equipe? Convites pendentes serão cancelados. As relações permanecem na rede.')) desfazerEquipe(equipeAtual.id); }}
                  style={btnStyle(`${C.red}15`, C.red)}>Desfazer equipe</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONVITES RECEBIDOS */}
      {view === 'convites' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {convites.length === 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📩</div>
              <div style={{ fontWeight: 600, color: C.ink, marginBottom: 6 }}>Nenhum convite pendente</div>
              <div style={{ color: C.ink3, fontSize: 12 }}>Quando alguém montar uma equipe e convidar você, aparece aqui.</div>
            </div>
          )}
          {convites.map(c => (
            <div key={c.equipe.id} style={{ background: C.card, border: `1px solid ${C.borderHot}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.ink, marginBottom: 4 }}>{c.equipe.titulo}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: C.ink2, marginBottom: 8, flexWrap: 'wrap' }}>
                {c.membro.especialidade && <span>🎯 {c.membro.especialidade}</span>}
                {c.equipe.regiao && <span>📍 {c.equipe.regiao}</span>}
                {c.equipe.dataInicio && <span>📅 {c.equipe.dataInicio}</span>}
                <span>👥 {c.equipe.membros.length} profissionais</span>
              </div>
              {c.equipe.descricao && <div style={{ color: C.ink3, fontSize: 12, marginBottom: 10 }}>{c.equipe.descricao}</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => responderConvite(c.equipe.id, c.membro.profId, 'aceitar')}
                  style={btnStyle(C.green, '#012')}>Aceitar</button>
                <button onClick={() => responderConvite(c.equipe.id, c.membro.profId, 'recusar')}
                  style={btnStyle(`${C.red}15`, C.red)}>Recusar</button>
                <button onClick={() => {
                  const outroId = prompt('ID do profissional que deseja indicar:');
                  if (outroId) {
                    fetch(`/api/equipes/${c.equipe.id}/responder`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ profId: c.membro.profId, resposta: 'indicar_outro', indicarProfId: Number(outroId) }),
                    }).then(() => { carregarConvites(); setMsg('Indicação registrada na rede!'); setTimeout(() => setMsg(''), 3000); });
                  }
                }}
                  style={btnStyle(`${C.cyan}15`, C.cyan)}>Indicar outro profissional</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ANALYTICS */}
      {view === 'analytics' && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setView('lista')} style={{ alignSelf: 'flex-start', border: 'none', background: 'transparent', color: C.ink2, cursor: 'pointer', fontSize: 13 }}>← Voltar</button>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.ink, marginBottom: 14 }}>Desempenho da equipe</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Profissionais', value: analytics.totalProfissionais, color: C.cyan },
                { label: 'Confirmados', value: analytics.confirmados, color: C.green },
                { label: 'Pendentes', value: analytics.pendentes, color: C.amber },
                { label: 'Indicações', value: analytics.indicacoes, color: C.blue },
                { label: 'Taxa resposta', value: `${analytics.taxaResposta}%`, color: C.cyan },
                { label: 'Tempo médio', value: analytics.tempoMedioRespostaMin ? `${analytics.tempoMedioRespostaMin}min` : '—', color: C.ink2 },
              ].map((kpi, i) => (
                <div key={i} style={{ background: C.surface, borderRadius: 10, padding: 12, textAlign: 'center', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: C.ink3 }}>{kpi.label}</div>
                </div>
              ))}
            </div>
            {analytics.especialidadesUsadas.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 6 }}>Especialidades utilizadas</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {analytics.especialidadesUsadas.map((e: string, i: number) => (
                    <span key={i} style={{ fontSize: 11, background: `${C.blue}14`, border: `1px solid ${C.border}`, borderRadius: 10, padding: '3px 10px', color: C.ink }}>{e}</span>
                  ))}
                </div>
              </div>
            )}
            {analytics.regiao && (
              <div style={{ marginTop: 10, fontSize: 12, color: C.ink3 }}>📍 {analytics.regiao} · 📅 {analytics.periodo.inicio || '—'}{analytics.periodo.fim ? ` — ${analytics.periodo.fim}` : ''}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
