// CAMADA DE CONTINUIDADE ("Continuar") — Documento Mestre.
// "Orbitrum conecta. O ecossistema executa. O usuário escolhe. A rede aprende."
// Depois de conectar, mostra "Como deseja continuar?" e faz DEEP-LINK para os apps que a
// pessoa já usa (WhatsApp/Maps/Uber/LinkedIn) — NÃO reconstrói esses serviços.
// Honesto: só mostra o que existe no banco (telefone, coordenadas, linkedin). Nada fabricado.

const C = {
  cyan: '#00D9FF', blue: '#00AEEF', ink: '#EAF8FF', ink2: '#7FA9C2', ink3: '#5b7a90',
  border: 'rgba(0,190,255,0.22)', card: 'rgba(3,18,32,0.9)',
};

interface Prof {
  name: string; city?: string | null; state?: string | null;
  phone?: string | null; address?: string | null;
  latitude?: number | null; longitude?: number | null; linkedinUrl?: string | null;
}

interface Props {
  prof: Prof;
  onIndicar?: () => void;
  onNovaBusca?: () => void;
  onSolicitar?: () => void;
}

function Acao({ label, icon, href, onClick }: { label: string; icon: string; href?: string; onClick?: () => void }) {
  const style: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 12,
    border: `1px solid ${C.border}`, background: C.card, color: C.ink, fontSize: 13, cursor: 'pointer',
    textDecoration: 'none',
  };
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={style}><span>{icon}</span>{label}</a>;
  return <button onClick={onClick} style={{ ...style, font: 'inherit' }}><span>{icon}</span>{label}</button>;
}

export default function Continuar({ prof, onIndicar, onNovaBusca, onSolicitar }: Props) {
  const temGeo = prof.latitude != null && prof.longitude != null;
  const destino = temGeo ? `${prof.latitude},${prof.longitude}` : (prof.address || [prof.city, prof.state].filter(Boolean).join(', '));
  const whats = prof.phone ? prof.phone.replace(/\D/g, '') : '';

  const acoes: Array<{ label: string; icon: string; href?: string; onClick?: () => void }> = [];
  if (whats) acoes.push({ label: 'Conversar no WhatsApp', icon: '💬', href: `https://wa.me/55${whats}` });
  if (temGeo) acoes.push({ label: 'Ir até ele (Uber)', icon: '🚗', href: `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${prof.latitude}&dropoff[longitude]=${prof.longitude}&dropoff[nickname]=${encodeURIComponent(prof.name)}` });
  if (destino) acoes.push({ label: 'Ver rota no mapa', icon: '📍', href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}` });
  if (prof.linkedinUrl) acoes.push({ label: 'Ver LinkedIn', icon: '💼', href: prof.linkedinUrl });
  if (onIndicar) acoes.push({ label: 'Indicar para alguém', icon: '🔗', onClick: onIndicar });
  if (onSolicitar) acoes.push({ label: 'Solicitar novamente', icon: '↻', onClick: onSolicitar });
  if (onNovaBusca) acoes.push({ label: 'Ver outras opções', icon: '◎', onClick: onNovaBusca });

  if (acoes.length === 0) return null;

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 16 }}>
      <div style={{ fontSize: 12, color: C.ink3, letterSpacing: 1, marginBottom: 10 }}>COMO DESEJA CONTINUAR?</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {acoes.map((a, i) => <Acao key={i} {...a} />)}
      </div>
      <div style={{ fontSize: 10, color: C.ink3, marginTop: 10 }}>
        O Orbitrum conecta e registra a experiência; a ação acontece no app que você já usa.
      </div>
    </div>
  );
}
