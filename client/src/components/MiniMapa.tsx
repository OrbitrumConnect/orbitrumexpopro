import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const C = {
  cyan: '#00D9FF', blue: '#00AEEF', ink2: '#7FA9C2', ink3: '#5b7a90',
  border: 'rgba(0,190,255,0.22)', bg2: '#011527',
};

interface Props {
  origem?: { lat: number; lng: number } | null;
  nomeProf?: string;
  avatarProf?: string | null;
  avatarUser?: string | null;
}

const counterFilter = 'contrast(1.176) brightness(0.667) hue-rotate(180deg) invert(1)';

function pino(foto?: string | null, cor = C.cyan, size = 36) {
  const inner = foto
    ? `<div style="filter:${counterFilter};width:${size}px;height:${size}px"><img src="${foto}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid ${cor};box-shadow:0 0 0 3px ${cor}55"/></div>`
    : `<div style="filter:${counterFilter};width:${size - 8}px;height:${size - 8}px;border-radius:50%;background:${cor};border:2px solid #001019;box-shadow:0 0 0 4px ${cor}44"></div>`;
  return L.divIcon({ className: '', html: inner, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

export default function MiniMapa({ origem = null, nomeProf = 'Profissional', avatarProf, avatarUser }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userLatLng = useRef<[number, number] | null>(null);
  const followingRef = useRef(true);
  const watchIdRef = useRef<number | null>(null);
  const [status, setStatus] = useState('Obtendo sua localização…');
  const [gpsOk, setGpsOk] = useState(false);
  const [following, setFollowing] = useState(true);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false, dragging: true });
    mapRef.current = map;
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '' }).addTo(map);
    if (ref.current) ref.current.style.filter = 'invert(1) hue-rotate(180deg) brightness(1.5) contrast(0.85)';
    map.setView([-22.91, -43.17], 12);

    map.on('dragstart', () => {
      followingRef.current = false;
      setFollowing(false);
    });

    let profMarker: L.Marker | null = null;
    let routeLine: L.Polyline | null = null;

    if (origem) {
      const prof: [number, number] = [origem.lat, origem.lng];
      profMarker = L.marker(prof, { icon: pino(avatarProf, C.blue, 40) }).addTo(map).bindTooltip(nomeProf, { permanent: false });
    }

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          userLatLng.current = latlng;
          setGpsOk(true);

          if (!userMarkerRef.current) {
            userMarkerRef.current = L.marker(latlng, { icon: pino(avatarUser, C.cyan, 40) }).addTo(map).bindTooltip('Você', { permanent: false });
          } else {
            userMarkerRef.current.setLatLng(latlng);
          }

          if (origem && profMarker) {
            const prof: [number, number] = [origem.lat, origem.lng];
            if (routeLine) map.removeLayer(routeLine);
            routeLine = L.polyline([prof, latlng], { color: C.cyan, weight: 3, opacity: 0.7, dashArray: '6 8' }).addTo(map);

            if (followingRef.current) {
              map.fitBounds(L.latLngBounds([prof, latlng]).pad(0.3));
            }
            setStatus(`${nomeProf} está a caminho — acompanhe pelo mapa`);
          } else {
            if (followingRef.current) {
              map.setView(latlng, 15);
            }
            setStatus('Sua localização no mapa. O rastreamento ao vivo aparece quando o profissional ativa o GPS.');
          }
        },
        () => { setStatus('Não foi possível obter sua localização (permissão negada). Combine o ponto no chat.'); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 },
      );
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
    };
  }, [origem, nomeProf, avatarProf, avatarUser]);

  function recentrar() {
    if (!mapRef.current) return;
    followingRef.current = true;
    setFollowing(true);
    if (userLatLng.current && origem) {
      mapRef.current.fitBounds(L.latLngBounds([[origem.lat, origem.lng], userLatLng.current]).pad(0.3));
    } else if (userLatLng.current) {
      mapRef.current.setView(userLatLng.current, 15);
    }
  }

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, background: C.bg2, position: 'relative' }}>
      <div ref={ref} style={{ height: 'clamp(300px, 56vh, 480px)', minHeight: 300, width: '100%' }} />
      {gpsOk && !following && (
        <button onClick={recentrar}
          title="Recentrar câmera"
          style={{ position: 'absolute', bottom: 40, right: 12, zIndex: 999, width: 36, height: 36, borderRadius: '50%',
            background: '#020914', border: `2px solid ${C.cyan}`, color: C.cyan, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: `0 0 10px ${C.cyan}44` }}>
          ◎
        </button>
      )}
      {gpsOk && following && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 999, background: `${C.cyan}22`, border: `1px solid ${C.cyan}44`,
          borderRadius: 8, padding: '3px 8px', fontSize: 10, color: C.cyan, fontWeight: 600 }}>
          Seguindo
        </div>
      )}
      <div style={{ padding: '8px 12px', fontSize: 11, color: C.ink2, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ color: C.cyan }}>◉</span>{status}
      </div>
    </div>
  );
}
