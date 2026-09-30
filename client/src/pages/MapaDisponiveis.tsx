import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ProfessionalModal } from '@/components/professional-modal';
import ConversaModal from '@/components/ConversaModal';

// MAPA DA REDE — os profissionais/usuários dispostos à chamada, no mapa (design-alvo, elite).
// O usuário vê quem está na rede pela localização e CONECTA ali mesmo (abre o perfil-tese).
// Honesto: só marca quem tem coordenada real no banco. Nada fabricado. Grátis (OSM/Leaflet).

const C = {
  bg: '#00060F', cyan: '#00D9FF', blue: '#00AEEF', ink: '#EAF8FF', ink2: '#7FA9C2', ink3: '#5b7a90',
  border: 'rgba(0,190,255,0.22)', bg2: '#011527',
};

interface Prof { id: number; name: string; title?: string; avatar?: string | null; latitude?: number | null; longitude?: number | null; available?: boolean }

function pino(color: string, foto?: string | null) {
  const inner = foto
    ? `<img src="${foto}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid ${color};box-shadow:0 0 0 3px ${color}55"/>`
    : `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:2px solid #001019;box-shadow:0 0 0 4px ${color}44"></div>`;
  return L.divIcon({ className: '', html: inner, iconSize: [34, 34], iconAnchor: [17, 17] });
}

export default function MapaDisponiveis() {
  const [, setLocation] = useLocation();
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [profModalId, setProfModalId] = useState<number | null>(null);
  const [conversaId, setConversaId] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true, attributionControl: false });
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    map.setView([-22.9, -43.2], 11); // Rio como centro inicial; ajusta aos marcadores abaixo

    fetch('/api/orbitmatch/disponiveis')
      .then(r => r.json())
      .then((j: any) => {
        const comGeo: Prof[] = Array.isArray(j?.itens) ? j.itens : [];
        setTotal(comGeo.length);
        const pts: [number, number][] = [];
        comGeo.forEach(p => {
          const cor = p.available === false ? C.ink3 : C.cyan;
          const m = L.marker([p.latitude!, p.longitude!], { icon: pino(cor, p.avatar) }).addTo(map);
          m.bindTooltip(`${p.name}${p.title ? ' · ' + p.title : ''}`, { direction: 'top' });
          m.on('click', () => setProfModalId(p.id));
          pts.push([p.latitude!, p.longitude!]);
        });
        if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.3));
      })
      .catch(() => {});

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: C.bg2 }}>
        <button onClick={() => setLocation('/')} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 16, padding: '6px 14px', color: C.ink2, fontSize: 13, cursor: 'pointer' }}>← Início</button>
        <div style={{ fontWeight: 700, letterSpacing: 1 }}>Mapa da rede</div>
        <div style={{ fontSize: 12, color: C.ink2 }}>{total != null ? `${total} disponíveis` : '…'}</div>
      </header>
      <div style={{ padding: '8px 18px', fontSize: 12, color: C.ink2, display: 'flex', gap: 6, alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ color: C.cyan }}>◉</span> Só quem está <b style={{ color: C.cyan, fontWeight: 600 }}>disponível</b> na rede aparece aqui. Toque num profissional pra ver por que apareceu e conectar.
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: 'calc(100vh - 96px)' }}>
        <div ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        {total === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(1,21,39,0.92)', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, maxWidth: 320, textAlign: 'center', pointerEvents: 'auto' }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Ninguém disponível agora</div>
              <p style={{ color: C.ink2, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Quando alguém ativar a presença na rede (toggle “Disponível”), aparece aqui no mapa,
                pronto pra chamada. Ative a sua também.
              </p>
            </div>
          </div>
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
  );
}
