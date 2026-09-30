import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Home,
  MapPin,
  User,
  Calendar,
  FileText,
  Clock,
  Users,
  ArrowRight,
  Briefcase,
  Info,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import GPSTracking from "@/components/GPSTracking";
import InteractiveCalendar from "@/components/InteractiveCalendar";
import ProfileEditor from "@/components/profile/ProfileEditor";
import { DocumentUpload } from "@/components/dashboard/DocumentUpload";
import Sidebar from "@/components/Sidebar";

const C = {
  bg: '#020914', bg2: '#061A2D', card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
};

interface ClientDashboardProps {
  user: any;
}

type TabId = 'overview' | 'profile' | 'documents' | 'calendar' | 'map';

const TABS: Array<{ id: TabId; icon: typeof Home; label: string }> = [
  { id: 'overview', icon: Home, label: 'Visão Geral' },
  { id: 'profile', icon: User, label: 'Perfil' },
  { id: 'documents', icon: FileText, label: 'Documentos' },
  { id: 'calendar', icon: Calendar, label: 'Agenda' },
  { id: 'map', icon: MapPin, label: 'GPS' },
];

export function CleanClientDashboard({ user }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: serviceRequests } = useQuery({
    queryKey: ['/api/service-requests/client', user.id],
    staleTime: 5 * 60 * 1000,
  });

  const { data: atividade } = useQuery({
    queryKey: ['/api/orbitmatch/atividade'],
    staleTime: 60 * 1000,
  });

  const requestsCount = (serviceRequests as any[])?.length || 0;
  const atividades = Array.isArray(atividade) ? atividade : [];

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% -10%, #06223B, #020D18 55%, #00060F)', color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 14px clamp(18px, 14vw, 56px)', borderBottom: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.82)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>Painel do Cliente</div>
            <div style={{ fontSize: 13, color: C.ink2 }}>{user.username}</div>
          </div>
          <Link href="/">
            <button style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', color: C.ink2, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Home size={14} /> Início
            </button>
          </Link>
        </header>

        {/* Stats rápidos */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(12px, 3vw, 24px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            <StatCard icon={<Users size={16} color={C.cyan} />} label="Conexões" value={atividades.length} border={C.cyan} />
            <StatCard icon={<Clock size={16} color="#70B8FF" />} label="Pedidos ativos" value={requestsCount} border="#70B8FF" />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? C.cyan : C.ink2, background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? `2px solid ${C.cyan}` : '2px solid transparent', whiteSpace: 'nowrap',
                }}>
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === 'overview' && <OverviewTab atividades={atividades} requestsCount={requestsCount} />}
            {activeTab === 'profile' && <ProfileEditor userType="client" />}
            {activeTab === 'documents' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                <DocumentUpload user={user} title="Verificação de Documentos" description="Envie seus documentos para liberar funcionalidades avançadas" />
              </div>
            )}
            {activeTab === 'calendar' && <InteractiveCalendar userType="client" userId={user?.id || 1} />}
            {activeTab === 'map' && <GPSTracking userType="client" userId={user?.id || 1} username={user?.username || 'Cliente'} />}
          </motion.div>

          {/* CTA profissional */}
          <div style={{ marginTop: 28, background: C.card, border: `1px solid ${C.borderHot}`, borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={16} color={C.cyan} /> Torne-se profissional na rede
              </div>
              <div style={{ fontSize: 13, color: C.ink2 }}>Cadastre-se e receba conexões reais de clientes</div>
            </div>
            <Link href="/cadastro-profissional">
              <button style={{ border: 'none', borderRadius: 10, padding: '9px 20px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                Cadastrar <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, border }: { icon: React.ReactNode; label: string; value: number; border: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${border}33`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${border}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: C.ink2 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}

function OverviewTab({ atividades, requestsCount }: { atividades: any[]; requestsCount: number }) {
  if (atividades.length === 0 && requestsCount === 0) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, textAlign: 'center' }}>
        <Info size={28} color={C.ink3} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Sua rede está começando</div>
        <div style={{ color: C.ink2, fontSize: 13, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
          Busque profissionais na tela inicial, conecte-se e acompanhe aqui sua atividade. Cada conexão real gera fatos que fortalecem seu histórico na rede.
        </div>
        <Link href="/">
          <button style={{ marginTop: 16, border: 'none', borderRadius: 10, padding: '9px 20px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Buscar profissionais
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={16} color={C.cyan} /> Atividade recente
      </div>
      {atividades.slice(0, 8).map((a: any, i: number) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 13 }}>
          <div style={{ fontWeight: 500 }}>{a.descricao || a.description || 'Atividade registrada'}</div>
          {a.data && <div style={{ color: C.ink3, fontSize: 11, marginTop: 4 }}>{new Date(a.data).toLocaleDateString('pt-BR')}</div>}
        </div>
      ))}
    </div>
  );
}

export default CleanClientDashboard;
