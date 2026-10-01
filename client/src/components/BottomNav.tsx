import { useLocation } from 'wouter';

// Navegação inferior fixa (design alvo, telas mobile). Início · Rede · + · Conversas · Perfil.
// O + central é a ação principal: iniciar uma necessidade (OrbitMatch).
// Clean/elite: fundo navy, cyan só no item ativo e no botão central.

const C = {
  bg: '#020914', border: 'rgba(0,190,255,0.16)',
  cyan: '#00D9FF', blue: '#00AEEF', ink2: '#7FA9C2', ink3: '#5b7a90',
};

const ITEMS: Array<[string, string, string]> = [
  ['/', '⌂', 'Início'],
  ['/rede', '◎', 'Rede'],
  ['/mapa', '📍', 'Mapa'],
  ['/dashboard-selector', '☰', 'Painel'],
];

export default function BottomNav() {
  const [loc, setLocation] = useLocation();
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center',
      background: C.bg, borderTop: `1px solid ${C.border}`, padding: '4px 8px env(safe-area-inset-bottom, 0)', zIndex: 1100 }}>
      {ITEMS.map(([rota, icon, label]) => {
        const ativo = rota === '/' ? (loc === '/' || loc === '/inicio' || loc === '/home') : loc.startsWith(rota);
        return (
          <button key={rota} onClick={() => setLocation(rota)}
            style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 0', color: ativo ? C.cyan : C.ink3 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: ativo ? 600 : 400 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
