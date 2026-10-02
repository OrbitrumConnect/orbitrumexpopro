import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { ProfessionalModal } from '@/components/professional-modal';
import ConversaModal from '@/components/ConversaModal';
import Sidebar from '@/components/Sidebar';
import NetworkAside from '@/components/NetworkAside';
import { useAuth } from '@/hooks/useAuth';

const C = {
  bg: '#00060F', cyan: '#00E5FF', blue: '#00AEEF', ink: '#EAF8FF', ink2: '#7FA9C2', ink3: '#5b7a90',
  border: 'rgba(0,190,255,0.22)', borderHot: 'rgba(0,220,255,0.5)', bg2: '#011527', card: 'rgba(3,18,32,0.9)',
};

interface Prof { id: number; name: string; title?: string; avatar?: string | null; latitude?: number | null; longitude?: number | null; chips?: string[] }

type TabMapa = 'disponiveis' | 'rede' | 'todos';

const counterFilter = 'contrast(1.176) brightness(0.667) hue-rotate(180deg) invert(1)';

function pino(foto?: string | null, ocupado?: boolean) {
  const cor = ocupado ? '#FF9800' : C.cyan;
  const inner = foto
    ? `<div style="filter:${counterFilter};width:36px;height:36px"><img src="${foto}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid ${cor};box-shadow:0 0 0 3px ${cor}55"/></div>`
    : `<div style="width:28px;height:28px;border-radius:50%;background:${cor};border:2px solid #001019;box-shadow:0 0 0 4px ${cor}44"></div>`;
  return L.divIcon({ className: '', html: inner, iconSize: [36, 36], iconAnchor: [18, 18] });
}

function Avatar({ src, name }: { src?: string | null; name: string }) {
  if (src) return <img src={src} alt={name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}` }} />;
  return <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${C.blue}33`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700 }}>{name?.[0]?.toUpperCase() || '?'}</div>;
}

function Chip({ label }: { label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.ink,
      background: `${C.blue}14`, border: `1px solid ${C.border}`, borderRadius: 11, padding: '2px 8px' }}>
      <span style={{ color: C.cyan }}>✓</span>{label}
    </span>
  );
}

export default function MapaDisponiveis() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const [profModalId, setProfModalId] = useState<number | null>(null);
  const [conversaId, setConversaId] = useState<number | null>(null);
  const [profs, setProfs] = useState<Prof[]>([]);
  const [redeProfs, setRedeProfs] = useState<Prof[]>([]);
  const [todosProfs, setTodosProfs] = useState<Prof[]>([]);
  const [carregou, setCarregou] = useState(false);
  const [userLocation, setUserLocation] = useState(false);
  const userLatLng = useRef<[number, number] | null>(null);
  const [disponivel, setDisponivel] = useState(false);
  const [tab, setTab] = useState<TabMapa>('disponiveis');
  const [overlayFechado, setOverlayFechado] = useState(false);
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 900);
  const [ocupados, setOcupados] = useState<Set<number>>(new Set());
  const [bloqueados, setBloqueados] = useState<Set<number>>(new Set());
  const [menuAberto, setMenuAberto] = useState<number | null>(null);
  const [confirmBloquear, setConfirmBloquear] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const onR = () => setMobile(window.innerWidth < 900);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  useEffect(() => {
    if (user?.id_interno) {
      fetch(`/api/facts/availability/${user.id_interno}`)
        .then(r => { if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) throw 0; return r.json(); })
        .then(j => { if (j.success) setDisponivel(!!j.ativo); })
        .catch(() => {});
    }
  }, [user]);

  const toggleDisponibilidade = () => {
    const novo = !disponivel;
    setDisponivel(novo);
    fetch('/api/facts/availability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professionalUserId: user?.id_interno, regiao: user?.city || 'geral', ativo: novo }),
    }).then(r => { if (!r.ok) throw 0; }).catch(() => {});
  };

  const addMarkersToMap = (list: Prof[], map: L.Map, busySet?: Set<number>) => {
    if (clusterRef.current) { map.removeLayer(clusterRef.current); clusterRef.current = null; }
    markersRef.current = [];
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      iconCreateFunction: (c) => {
        const count = c.getChildCount();
        return L.divIcon({
          className: '',
          html: `<div style="filter:${counterFilter};width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,${C.cyan},${C.blue});display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#012;border:2px solid #020914;box-shadow:0 0 12px ${C.cyan}66">${count}</div>`,
          iconSize: [40, 40], iconAnchor: [20, 20],
        });
      },
    });
    const pts: [number, number][] = [];
    list.forEach(p => {
      if (p.latitude == null || p.longitude == null) return;
      const m = L.marker([p.latitude, p.longitude], { icon: pino(p.avatar, busySet?.has(p.id)) });
      const busyLabel = busySet?.has(p.id) ? ' (Ocupado)' : '';
      m.bindTooltip(`${p.name}${p.title ? ' · ' + p.title : ''}${busyLabel}`, { direction: 'top' });
      m.on('click', () => setProfModalId(p.id));
      cluster.addLayer(m);
      markersRef.current.push(m);
      pts.push([p.latitude, p.longitude]);
    });
    map.addLayer(cluster);
    clusterRef.current = cluster;
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.35));
  };

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false });
    mapRef.current = map;
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '' }).addTo(map);
    if (ref.current) ref.current.style.filter = 'invert(1) hue-rotate(180deg) brightness(1.5) contrast(0.85)';
    map.setView([-22.9, -43.2], 12);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 14);
          setUserLocation(true);
          userLatLng.current = [latitude, longitude];
          const userFoto = user?.profilePhoto || (user as any)?.avatar;
          const meIcon = userFoto
            ? L.divIcon({ className: '', html: `<div style="filter:${counterFilter};width:44px;height:44px"><img src="${userFoto}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:3px solid #00E5FF;box-shadow:0 0 12px #00E5FF88"/></div>`, iconSize: [44, 44], iconAnchor: [22, 22] })
            : L.divIcon({ className: '', html: `<div style="width:18px;height:18px;border-radius:50%;background:#00E5FF;border:3px solid #020914;box-shadow:0 0 12px #00E5FF99"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
          L.marker([latitude, longitude], { icon: meIcon, zIndexOffset: 1000 }).addTo(map).bindTooltip('Você', { permanent: false });
        },
        () => {}
      );
    }

    fetch('/api/orbitmatch/disponiveis')
      .then(r => { if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) throw 0; return r.json(); })
      .then((j: any) => {
        const list: Prof[] = Array.isArray(j?.itens) ? j.itens : [];
        setProfs(list); setCarregou(true);
        addMarkersToMap(list, map);
      })
      .catch(() => setCarregou(true));

    const userId = (user as any)?.id_interno ?? (user as any)?.id ?? 0;
    if (userId) {
      fetch(`/api/orbitmatch/search?userId=${userId}`)
        .then(r => { if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return null; return r.json(); })
        .then(j => {
          if (j?.resultados) {
            const rede: Prof[] = j.resultados.map((r: any) => ({
              id: r.profissional.id, name: r.profissional.name, title: r.profissional.title,
              avatar: r.profissional.avatar, latitude: r.profissional.latitude, longitude: r.profissional.longitude,
              chips: r.chips ?? [],
            }));
            setRedeProfs(rede);
          }
        })
        .catch(() => {});
    }

    fetch('/api/professionals')
      .then(r => { if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return []; return r.json(); })
      .then((list: any[]) => {
        const all: Prof[] = (Array.isArray(list) ? list : []).map((p: any) => ({
          id: p.id, name: p.name, title: p.title, avatar: p.avatar,
          latitude: p.latitude, longitude: p.longitude,
        }));
        setTodosProfs(all);
      })
      .catch(() => {});

    fetch('/api/service-flow/status/ocupados')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.success) setOcupados(new Set(j.ocupados)); })
      .catch(() => {});

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const list = tab === 'disponiveis' ? profs : tab === 'rede' ? redeProfs : todosProfs;
    addMarkersToMap(list, mapRef.current, ocupados);
  }, [tab, profs, redeProfs, todosProfs, ocupados]);

  const activeList = (tab === 'disponiveis' ? profs : tab === 'rede' ? redeProfs : todosProfs)
    .filter(p => !bloqueados.has(p.id));
  const tabLabel = { disponiveis: 'Disponíveis agora', rede: 'Minha Rede', todos: 'Todos' };

  const indicarProfissional = (prof: Prof) => {
    if (navigator.share) {
      navigator.share({
        title: `${prof.name} — Orbitrum`,
        text: `Conheça ${prof.name}${prof.title ? ` (${prof.title})` : ''} no Orbitrum`,
        url: `${window.location.origin}/p/${prof.id}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/p/${prof.id}`).then(() => {
        alert(`Link do perfil de ${prof.name} copiado!`);
      }).catch(() => {});
    }
    if (user?.id_interno) {
      fetch('/api/orbitmatch/indicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicadorUserId: user.id_interno, profissionalId: prof.id }),
      }).catch(() => {});
    }
    setMenuAberto(null);
  };

  const bloquearProfissional = async (profId: number) => {
    if (!user?.id_interno) return;
    try {
      await fetch('/api/bloquear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id_interno, profId, motivo: 'bloqueio pelo usuario' }),
      });
      setBloqueados(prev => new Set([...prev, profId]));
    } catch {}
    setConfirmBloquear(null);
    setMenuAberto(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(circle at 50% -10%, #06223B, #020D18 55%, #00060F)`, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: mobile ? '4px 8px 4px 56px' : '14px 24px 14px clamp(18px, 14vw, 56px)', borderBottom: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.82)', gap: mobile ? 4 : 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 6 : 10 }}>
              <div style={{ fontWeight: 700, fontSize: mobile ? 13 : 17, letterSpacing: 0.5 }}>Mapa</div>
              {!mobile && <div style={{ fontSize: 13, color: C.ink2 }}>Terminal operacional — a rede na geografia</div>}
              <div style={{ fontSize: mobile ? 10 : 13, color: C.cyan, fontWeight: 600 }}>{carregou ? `${activeList.length}` : '…'}</div>
            </div>
            <div style={{ display: 'flex', gap: mobile ? 4 : 10, alignItems: 'center' }}>
              {user && (
                <button onClick={toggleDisponibilidade}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: disponivel ? `${C.cyan}1f` : 'transparent', border: `1px solid ${disponivel ? C.borderHot : C.border}`, borderRadius: 14, padding: mobile ? '3px 8px' : '6px 14px', color: disponivel ? C.cyan : C.ink3, fontSize: mobile ? 10 : 12, fontWeight: 500, cursor: 'pointer' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: disponivel ? C.cyan : C.ink3, boxShadow: disponivel ? `0 0 6px ${C.cyan}` : 'none' }} />
                  {disponivel ? 'On' : 'Off'}
                </button>
              )}
            </div>
          </header>

          {/* TABS — terminal do mapa */}
          <div style={{ display: 'flex', gap: 0, padding: mobile ? '0 6px 0 56px' : '10px 24px 0 clamp(18px, 14vw, 56px)', background: 'rgba(4,17,31,0.5)' }}>
            {(['disponiveis', 'rede', 'todos'] as TabMapa[]).map(t => {
              const on = tab === t;
              const mobileLabel = { disponiveis: 'Agora', rede: 'Rede', todos: 'Todos' };
              return (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: mobile ? '3px 8px' : '8px 18px', borderRadius: '6px 6px 0 0',
                    borderTop: on ? `1px solid ${C.borderHot}` : `1px solid transparent`,
                    borderLeft: on ? `1px solid ${C.borderHot}` : `1px solid transparent`,
                    borderRight: on ? `1px solid ${C.borderHot}` : `1px solid transparent`,
                    borderBottom: 'none', background: on ? `${C.blue}22` : 'transparent',
                    color: on ? C.cyan : C.ink2, fontSize: mobile ? 9 : 13, fontWeight: on ? 600 : 400, cursor: 'pointer', letterSpacing: 0.2, lineHeight: 1.2 }}>
                  {t === 'disponiveis' && '● '}{mobile ? mobileLabel[t] : tabLabel[t]}
                </button>
              );
            })}
          </div>

          <div style={{ maxWidth: 1100, margin: '0 auto', padding: mobile ? '6px 8px' : 'clamp(12px, 3vw, 24px)' }}>
            {!mobile && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: 13, color: C.ink2 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.cyan, flexShrink: 0 }} />
                <span>
                  {tab === 'disponiveis' && <>Só quem está <b style={{ color: C.cyan }}>disponível</b> aparece. Toque no pino ou card pra conectar.</>}
                  {tab === 'rede' && <>Profissionais da <b style={{ color: C.cyan }}>sua rede</b> — quem você conhece, quem te indicaram, quem já trabalhou com você.</>}
                  {tab === 'todos' && <>Todos os profissionais cadastrados. A rede explica <b style={{ color: C.cyan }}>por que</b> cada um apareceu.</>}
                </span>
                {userLocation && <span style={{ marginLeft: 'auto', fontSize: 11, color: C.ink3 }}>GPS ativo</span>}
              </div>
            )}

            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.borderHot}`, boxShadow: `0 0 40px ${C.blue}12` }}>
              <div ref={ref} style={{ height: 'clamp(340px, 52vh, 540px)', width: '100%' }} />
              {userLocation && (
                <button onClick={() => { if (mapRef.current && userLatLng.current) mapRef.current.setView(userLatLng.current, 15); }}
                  title="Centralizar na minha localização"
                  style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 999, width: 40, height: 40, borderRadius: '50%',
                    background: '#020914', border: `2px solid ${C.cyan}`, color: C.cyan, fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: `0 0 12px ${C.cyan}44`, backdropFilter: 'blur(6px)' }}>
                  ◎
                </button>
              )}
              {carregou && activeList.length === 0 && !overlayFechado && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ background: 'rgba(2,9,20,0.94)', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, maxWidth: 340, textAlign: 'center', pointerEvents: 'auto', position: 'relative' }}>
                    <button onClick={() => setOverlayFechado(true)}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: C.ink3, fontSize: 18, cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>×</button>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${C.cyan}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <span style={{ fontSize: 22 }}>{tab === 'rede' ? '👥' : '📍'}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                      {tab === 'disponiveis' && 'Ninguém disponível agora'}
                      {tab === 'rede' && 'Sua rede ainda está começando'}
                      {tab === 'todos' && 'Nenhum profissional encontrado'}
                    </div>
                    <p style={{ color: C.ink2, fontSize: 12, margin: '0 0 14px', lineHeight: 1.5 }}>
                      {tab === 'disponiveis' && 'Quando profissionais ativam a presença, aparecem aqui. Ative a sua pra ser encontrado também.'}
                      {tab === 'rede' && 'Conecte com profissionais, valide experiências — a rede cresce com uso real.'}
                      {tab === 'todos' && 'Profissionais cadastrados aparecerão aqui conforme a rede cresce.'}
                    </p>
                    {tab === 'disponiveis' && user && !disponivel && (
                      <button onClick={toggleDisponibilidade}
                        style={{ border: 'none', borderRadius: 10, padding: '9px 20px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                        Ativar minha presença
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {activeList.length > 0 && (
              <div style={{ textAlign: 'center', padding: '10px 0 0', color: C.ink2, fontSize: 12 }}>
                ▼ {activeList.length} {activeList.length === 1 ? 'profissional' : 'profissionais'} abaixo
              </div>
            )}

            {activeList.length > 0 && (
              <>
                <div style={{ fontWeight: 600, fontSize: 15, margin: '20px 0 10px' }}>{tabLabel[tab]}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {activeList.map(p => (
                    <div key={p.id} onClick={() => setProfModalId(p.id)}
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', transition: 'border-color .2s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = C.borderHot)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                      <Avatar src={p.avatar} name={p.name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ color: C.ink2, fontSize: 12 }}>{p.title}</div>
                        {tab === 'disponiveis' && (
                          ocupados.has(p.id) ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4, fontSize: 11, color: '#FF9800' }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF9800', boxShadow: '0 0 6px #FF980088' }} /> Ocupado
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4, fontSize: 11, color: C.cyan }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.cyan, boxShadow: `0 0 6px ${C.cyan}` }} /> Disponível
                            </div>
                          )
                        )}
                        {p.chips && p.chips.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {p.chips.slice(0, 2).map((c, i) => <Chip key={i} label={c} />)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button onClick={(e) => { e.stopPropagation(); if (!ocupados.has(p.id)) setConversaId(p.id); }}
                          style={{ border: 'none', cursor: ocupados.has(p.id) ? 'not-allowed' : 'pointer', borderRadius: 16, padding: '7px 16px', background: ocupados.has(p.id) ? 'rgba(255,152,0,0.2)' : `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: ocupados.has(p.id) ? '#FF9800' : '#012', fontWeight: 600, fontSize: 12, opacity: ocupados.has(p.id) ? 0.7 : 1 }}>{ocupados.has(p.id) ? 'Ocupado' : 'Conectar'}</button>
                        <div style={{ position: 'relative' }}>
                          <button onClick={(e) => { e.stopPropagation(); setMenuAberto(menuAberto === p.id ? null : p.id); }}
                            style={{ border: 'none', background: 'transparent', color: C.ink2, cursor: 'pointer', fontSize: 18, padding: '4px 6px', lineHeight: 1 }}>⋮</button>
                          {menuAberto === p.id && (
                            <div style={{ position: 'absolute', right: 0, top: '100%', background: '#0A1929', border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, zIndex: 50, minWidth: 150, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                              <button onClick={(e) => { e.stopPropagation(); indicarProfissional(p); }}
                                style={{ display: 'block', width: '100%', border: 'none', background: 'transparent', color: C.ink, padding: '8px 12px', fontSize: 13, textAlign: 'left', cursor: 'pointer', borderRadius: 6 }}
                                onMouseEnter={e => (e.currentTarget.style.background = `${C.cyan}15`)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                🔗 Indicar
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setConfirmBloquear({ id: p.id, name: p.name }); setMenuAberto(null); }}
                                style={{ display: 'block', width: '100%', border: 'none', background: 'transparent', color: '#EF4444', padding: '8px 12px', fontSize: 13, textAlign: 'left', cursor: 'pointer', borderRadius: 6 }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                🚫 Remover da rede
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!mobile && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 28 }}>
                {[
                  { icon: '📍', title: 'Localização real', desc: 'Autorizada e temporária.' },
                  { icon: '🔗', title: 'Conecte direto', desc: 'Toque pra ver e conectar.' },
                  { icon: '🛡️', title: 'Privacidade', desc: 'Desativou? Saiu do mapa.' },
                ].map((step, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{step.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{step.title}</div>
                    <div style={{ color: C.ink2, fontSize: 12, lineHeight: 1.4 }}>{step.desc}</div>
                  </div>
                ))}
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

          {confirmBloquear && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setConfirmBloquear(null)}>
              <div onClick={e => e.stopPropagation()}
                style={{ background: '#0A1929', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, maxWidth: 360, width: '90%', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Remover da sua rede?</div>
                <div style={{ color: C.ink2, fontSize: 13, marginBottom: 6 }}>
                  <b>{confirmBloquear.name}</b> não aparecerá mais no seu mapa, busca ou recomendações.
                </div>
                <div style={{ color: C.ink3, fontSize: 12, marginBottom: 20 }}>
                  A pessoa continua no app normalmente — só fica invisível pra você. Você pode desfazer depois.
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => setConfirmBloquear(null)}
                    style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.ink, borderRadius: 10, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={() => bloquearProfissional(confirmBloquear.id)}
                    style={{ border: 'none', background: '#EF4444', color: '#fff', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Remover
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {!mobile && <NetworkAside />}
      </div>
    </div>
  );
}
