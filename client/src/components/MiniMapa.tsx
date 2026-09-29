import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// MINI-MAPA "A CAMINHO" — dentro do card da experiência (não é página à parte).
// Estilo Uber, mas HONESTO: usa a posição REAL do cliente (geolocation). O marcador
// do profissional só se move quando houver GPS real do app dele — nunca simula
// movimento fabricado (contrato: apontar o gap, nunca inventar dado).
// Mapa grátis: OpenStreetMap + Leaflet (sem chave paga).

const C = {
  cyan: '#00D9FF', blue: '#00AEEF', ink2: '#7FA9C2', ink3: '#5b7a90',
  border: 'rgba(0,190,255,0.22)', bg2: '#011527',
};

interface Props {
  // Posição do profissional, se o backend/app dele fornecer (lat,lng reais).
  origem?: { lat: number; lng: number } | null;
  nomeProf?: string;
}

function ponto(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #001019;box-shadow:0 0 0 4px ${color}44"></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8],
  });
}

export default function MiniMapa({ origem = null, nomeProf = 'Profissional' }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [status, setStatus] = useState('Obtendo sua localização…');

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false, dragging: true });
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    // fallback inicial (São Paulo) até a geolocation real responder
    map.setView([-23.55, -46.63], 12);

    let cancelado = false;
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        if (cancelado) return;
        const cliente: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        L.marker(cliente, { icon: ponto(C.cyan) }).addTo(map).bindTooltip('Você', { permanent: false });
        if (origem) {
          const prof: [number, number] = [origem.lat, origem.lng];
          L.marker(prof, { icon: ponto(C.blue) }).addTo(map).bindTooltip(nomeProf, { permanent: false });
          L.polyline([prof, cliente], { color: C.cyan, weight: 3, opacity: 0.7, dashArray: '6 8' }).addTo(map);
          map.fitBounds(L.latLngBounds([prof, cliente]).pad(0.4));
          setStatus(`${nomeProf} está a caminho — acompanhe pelo mapa`);
        } else {
          map.setView(cliente, 15);
          setStatus('Sua localização no mapa. O rastreamento ao vivo aparece quando o profissional ativa o GPS.');
        }
      },
      () => { if (!cancelado) setStatus('Não foi possível obter sua localização (permissão negada). Combine o ponto no chat.'); },
      { enableHighAccuracy: true, timeout: 8000 },
    );

    return () => { cancelado = true; map.remove(); mapRef.current = null; };
  }, [origem, nomeProf]);

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, background: C.bg2 }}>
      <div ref={ref} style={{ height: 200, width: '100%' }} />
      <div style={{ padding: '8px 12px', fontSize: 11, color: C.ink2, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ color: C.cyan }}>◉</span>{status}
      </div>
    </div>
  );
}
