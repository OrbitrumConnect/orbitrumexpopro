import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { isAdminUser } from '@/lib/isAdmin';

// SIDEBAR reutilizável (design-alvo) — navegação consistente entre as abas. Destaca a rota ativa.
// Só navegação (as buscas inline vivem na home). Admin só pra admin. Mesma identidade da home.

const C = {
  cyan: '#00E5FF', blue: '#00AEEF', ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)', bg2: '#061A2D',
};

export default function Sidebar() {
  const [loc, setLocation] = useLocation();
  const { user } = useAuth();
  const ehAdmin = isAdminUser(user);

  const rede: Array<[string, string]> = [
    ['Início', '/'], ['Minha Rede', '/'], ['Profissionais', '/'], ['Indicações', '/'],
  ];
  const ferramentas: Array<[string, string]> = [
    ['Meu Painel', '/dashboard-selector'], ['Equipes', '/teams'], ['Mapa · GPS', '/mapa'],
    ...(ehAdmin ? [['Admin', '/admin'] as [string, string]] : []),
  ];
  const conta: Array<[string, string]> = [
    ['Orbit Credits', '/tokens'], ['Recompensas', '/tokens'], ['Assinatura', '/planos'],
  ];

  const item = (label: string, rota: string, size = 15) => {
    const ativo = loc === rota && rota !== '/'; // "/" não fica ativo aqui (evita destacar tudo)
    const inicioAtivo = label === 'Início' && loc === '/';
    const on = ativo || inicioAtivo;
    return (
      <button key={label + rota} onClick={() => setLocation(rota)}
        style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 9, border: on ? `1px solid ${C.borderHot}` : '1px solid transparent',
          background: on ? `${C.blue}22` : 'transparent', color: on ? C.ink : '#A9C6DC', fontSize: size, fontWeight: on ? 600 : 400, letterSpacing: 0.2, cursor: 'pointer', width: '100%' }}>
        {label}
      </button>
    );
  };

  return (
    <aside style={{ width: 186, flexShrink: 0, borderRight: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.82)', backdropFilter: 'blur(6px)', padding: '20px 14px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }} onClick={() => setLocation('/')}>
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
    </aside>
  );
}
