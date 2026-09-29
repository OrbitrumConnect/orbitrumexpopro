import { useLocation } from 'wouter';

// Navegação inferior fixa (design alvo, telas mobile). Início · Rede · + · Conversas · Perfil.
// O + central é a ação principal: iniciar uma necessidade (OrbitMatch).
// Clean/elite: fundo navy, cyan só no item ativo e no botão central.

const C = {
  bg: '#00080F', border: 'rgba(0,190,255,0.16)',
  cyan: '#00D9FF', blue: '#00AEEF', ink2: '#7FA9C2', ink3: '#5b7a90',
};

const ICONS: Record<string, string> = {
  inicio: '⌂', rede: '◎', conversas: '💬', perfil: '☰',
};

export default function BottomNav() {
  const [loc, setLocation] = useLocation();
  const item = (rota: string, chave: string, label: string) => {
    const ativo = loc === rota || (rota !== '/inicio' && loc.startsWith(rota));
    return (
      <button onClick={() => setLocation(rota)}
        style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 0', color: ativo ? C.cyan : C.ink3 }}>
        <span style={{ fontSize: 16 }}>{ICONS[chave]}</span>
        <span style={{ fontSize: 10 }}>{label}</span>
      </button>
    );
  };
  return (
    <nav style={{ position: 'sticky', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center',
      background: C.bg, borderTop: `1px solid ${C.border}`, padding: '0 8px', zIndex: 40 }}>
      {item('/inicio', 'inicio', 'Início')}
      {item('/orbitmatch', 'rede', 'Rede')}
      {/* + central */}
      <button onClick={() => setLocation('/orbitmatch')}
        style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer', margin: '-14px 6px 0',
          background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontSize: 26, fontWeight: 700,
          boxShadow: `0 4px 16px ${C.blue}55`, flexShrink: 0 }}>+</button>
      {item('/conversa', 'conversas', 'Conversas')}
      {item('/dashboard-client', 'perfil', 'Perfil')}
    </nav>
  );
}
