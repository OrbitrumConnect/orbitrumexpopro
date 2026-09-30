import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminUser } from '@/lib/isAdmin';

// SIDEBAR reutilizável (design-alvo) — navegação consistente entre as abas. Destaca a rota ativa.
// Responsiva: desktop = coluna fixa; mobile (<900px) = hambúrguer + overlay deslizante. Desktop
// intacto (sem regressão). Só navegação (as buscas inline vivem na home).

const C = {
  cyan: '#00E5FF', blue: '#00AEEF', ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)', bg2: '#061A2D',
};

export default function Sidebar() {
  const [loc, setLocation] = useLocation();
  const { user } = useAuth();
  const ehAdmin = isAdminUser(user);
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 900);
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    const onR = () => setMobile(window.innerWidth < 900);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  const rede: Array<[string, string]> = [
    ['Início', '/'], ['Minha Rede', '/?view=rede'], ['Profissionais', '/?view=profissionais'], ['Indicações', '/?view=indicacoes'],
  ];
  const ferramentas: Array<[string, string]> = [
    ['Meu Painel', '/dashboard-selector'], ['Equipes', '/teams'], ['Mapa · GPS', '/mapa'],
    ...(ehAdmin ? [['Admin', '/admin'] as [string, string]] : []),
  ];
  const conta: Array<[string, string]> = [
    ['Orbit Credits', '/tokens'], ['Recompensas', '/tokens'], ['Assinatura', '/planos'],
  ];

  const ir = (rota: string) => { setLocation(rota); setAberta(false); };

  const search = typeof window !== 'undefined' ? window.location.search : '';
  const item = (label: string, rota: string, size = 15) => {
    const isViewLink = rota.startsWith('/?view=');
    const on = isViewLink
      ? loc === '/' && search === rota.slice(1)
      : (label === 'Início' && loc === '/' && !search.includes('view=')) || (loc === rota && rota !== '/');
    return (
      <button key={label + rota} onClick={() => ir(rota)}
        style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 9, border: on ? `1px solid ${C.borderHot}` : '1px solid transparent',
          background: on ? `${C.blue}22` : 'transparent', color: on ? C.ink : '#A9C6DC', fontSize: size, fontWeight: on ? 600 : 400, letterSpacing: 0.2, cursor: 'pointer', width: '100%' }}>
        {label}
      </button>
    );
  };

  const conteudo = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }} onClick={() => ir('/')}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: `radial-gradient(circle at 50% 40%, ${C.cyan}, ${C.blue} 60%, transparent)` }} />
        <span style={{ letterSpacing: 2, fontWeight: 700, fontSize: 15 }}>ORBITRUM</span>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
        {rede.map(([l, r]) => item(l, r))}
        <div style={{ fontSize: 10, color: C.ink3, letterSpacing: 1.5, margin: '14px 14px 6px' }}>FERRAMENTAS</div>
        {ferramentas.map(([l, r]) => item(l, r, 14))}
        <div style={{ height: 1, background: C.border, margin: '12px 4px' }} />
        {conta.map(([l, r]) => item(l, r, 13))}
      </nav>
    </>
  );

  const asideStyle: React.CSSProperties = {
    width: 186, flexShrink: 0, borderRight: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.82)',
    backdropFilter: 'blur(6px)', padding: '20px 14px', display: 'flex', flexDirection: 'column', minHeight: '100vh',
  };

  if (mobile) {
    return (
      <>
        {/* hambúrguer fixo (sobre o conteúdo) */}
        <button aria-label="Menu" onClick={() => setAberta(true)}
          style={{ position: 'fixed', top: 10, left: 10, zIndex: 1200, width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.92)', color: C.ink, fontSize: 18, cursor: 'pointer' }}>☰</button>
        {aberta && (
          <div onClick={() => setAberta(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,4,10,0.82)', zIndex: 1300 }}>
            <aside onClick={e => e.stopPropagation()} style={{ ...asideStyle, width: 240, maxWidth: '82vw', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 1301, boxShadow: `0 0 40px ${C.blue}33` }}>
              <button onClick={() => setAberta(false)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: C.ink2, fontSize: 22, cursor: 'pointer', marginBottom: 4 }}>×</button>
              {conteudo}
            </aside>
          </div>
        )}
      </>
    );
  }

  return <aside style={asideStyle}>{conteudo}</aside>;
}
