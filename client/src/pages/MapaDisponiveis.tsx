import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ProfessionalModal } from '@/components/professional-modal';
import ConversaModal from '@/components/ConversaModal';
import Sidebar from '@/components/Sidebar';

// MAPA DA REDE — só quem está DISPONÍVEL (fato disponivel_em vigente). Mapa CONTIDO (com borda) +
// lista dos disponíveis abaixo. O usuário vê no mapa e conecta ali. Grátis (OSM/Leaflet). Nada fabricado.

const C = {
  bg: '#00060F', cyan: '#00D9FF', blue: '#00AEEF', ink: '#EAF8FF', ink2: '#7FA9C2', ink3: '#5b7a90',
  border: 'rgba(0,190,255,0.22)', borderHot: 'rgba(0,220,255,0.5)', bg2: '#011527', card: 'rgba(3,18,32,0.9)',
};

interface Prof { id: number; name: string; title?: string; avatar?: string | null; latitude?: number | null; longitude?: number | null }

function pino(foto?: string | null) {
  const inner = foto
    ? `<img src="${foto}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid ${C.cyan};box-shadow:0 0 0 3px ${C.cyan}55"/>`
    : `<div style="width:28px;height:28px;border-radius:50%;background:${C.cyan};border:2px solid #001019;box-shadow:0 0 0 4px ${C.cyan}44"></div>`;
  return L.divIcon({ className: '', html: inner, iconSize: [32, 32], iconAnchor: [16, 16] });
}

function Avatar({ src, name }: { src?: string | null; name: string }) {
  if (src) return <img src={src} alt={name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}` }} />;
  return <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700 }}>{name?.[0]?.toUpperCase() || '?'}</div>;
}

export default function MapaDisponiveis() {
  const [, setLocation] = useLocation();
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [profModalId, setProfModalId] = useState<number | null>(null);
  const [conversaId, setConversaId] = useState<number | null>(null);
  const [profs, setProfs] = useState<Prof[]>([]);
  const [carregou, setCarregou] = useState(false);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true, attributionControl: false });
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    map.setView([-22.9, -43.2], 11);

    fetch('/api/orbitmatch/disponiveis')
      .then(r => r.json())
      .then((j: any) => {
        const list: Prof[] = Array.isArray(j?.itens) ? j.itens : [];
        setProfs(list); setCarregou(true);
        const pts: [number, number][] = [];
        list.forEach(p => {
          if (p.latitude == null || p.longitude == null) return;
          const m = L.marker([p.latitude, p.longitude], { icon: pino(p.avatar) }).addTo(map);
          m.bindTooltip(`${p.name}${p.title ? ' · ' + p.title : ''}`, { direction: 'top' });
          m.on('click', () => setProfModalId(p.id));
          pts.push([p.latitude, p.longitude]);
        });
        if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.35));
      })
      .catch(() => setCarregou(true));

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(circle at 50% -10%, #06223B, #020D18 55%, #00060F)`, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 12px clamp(18px, 14vw, 56px)', borderBottom: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.82)' }}>
        <div style={{ fontWeight: 700, letterSpacing: 1 }}>Mapa da rede</div>
        <div style={{ fontSize: 12, color: C.ink2 }}>{carregou ? `${profs.length} disponíveis` : '…'}</div>
      </header>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(12px, 3vw, 24px)' }}>
        <p style={{ color: C.ink2, fontSize: 13, margin: '0 0 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ color: C.cyan }}>◉</span> Só quem está <b style={{ color: C.cyan, fontWeight: 600 }}>disponível</b> na rede aparece aqui. Toque no pino ou no card pra ver por que apareceu e conectar.
        </p>

        {/* MAPA CONTIDO — com borda, altura fixa responsiva (não full-screen) */}
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.borderHot}`, boxShadow: `0 0 30px ${C.blue}18` }}>
          <div ref={ref} style={{ height: 'clamp(280px, 42vh, 440px)', width: '100%' }} />
          {carregou && profs.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(1,21,39,0.94)', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, maxWidth: 300, textAlign: 'center' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Ninguém disponível agora</div>
                <p style={{ color: C.ink2, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Quando alguém ativar a presença (toggle “Disponível”), aparece aqui pronto pra chamada.</p>
              </div>
            </div>
          )}
        </div>

        {/* LISTA dos disponíveis (infos embaixo) — cards úteis, escaláveis */}
        {profs.length > 0 && (
          <>
            <div style={{ fontWeight: 600, fontSize: 15, margin: '20px 0 10px' }}>Disponíveis agora</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {profs.map(p => (
                <div key={p.id} onClick={() => setProfModalId(p.id)}
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar src={p.avatar} name={p.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ color: C.ink2, fontSize: 12 }}>{p.title}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4, fontSize: 11, color: C.cyan }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.cyan, boxShadow: `0 0 6px ${C.cyan}` }} /> Disponível
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setConversaId(p.id); }}
                    style={{ border: 'none', cursor: 'pointer', borderRadius: 16, padding: '7px 16px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>Conectar</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {profModalId != null && (
        <ProfessionalModal isOpen={true} professionalId={profModalId} onClose={() => setProfModalId(null)}
          onConectar={(id) => { setProfModalId(null); setConversaId(id); }} />
      )}
      {conversaId != null && (
        <ConversaModal profId={conversaId} onClose={() => setConversaId(null)} />
      )}
      </div>
    </div>
  );
}
