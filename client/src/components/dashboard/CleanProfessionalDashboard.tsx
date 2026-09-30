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
  CheckCircle,
  MessageCircle,
  Info,
  Shield,
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

interface ProfessionalDashboardProps {
  user: any;
}

type TabId = 'overview' | 'requests' | 'profile' | 'documents' | 'calendar' | 'map';

const TABS: Array<{ id: TabId; icon: typeof Home; label: string }> = [
  { id: 'overview', icon: Home, label: 'Visão Geral' },
  { id: 'requests', icon: MessageCircle, label: 'Solicitações' },
  { id: 'profile', icon: User, label: 'Perfil' },
  { id: 'documents', icon: FileText, label: 'Documentos' },
  { id: 'calendar', icon: Calendar, label: 'Agenda' },
  { id: 'map', icon: MapPin, label: 'GPS' },
];

export function CleanProfessionalDashboard({ user }: ProfessionalDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: pendingRequests } = useQuery({
    queryKey: ['/api/service-requests/professional', user.id, 'pending'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: acceptedServices } = useQuery({
    queryKey: ['/api/service-requests/professional', user.id, 'accepted'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: atividade } = useQuery({
    queryKey: ['/api/orbitmatch/atividade'],
    staleTime: 60 * 1000,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/professional-stats', user.id],
    staleTime: 5 * 60 * 1000,
  });

  const pendingCount = (pendingRequests as any[])?.length || 0;
  const acceptedCount = (acceptedServices as any[])?.length || 0;
  const experiencias = (stats as any)?.completedServices || acceptedCount;
  const atividades = Array.isArray(atividade) ? atividade : [];

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% -10%, #06223B, #020D18 55%, #00060F)', color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 14px clamp(18px, 14vw, 56px)', borderBottom: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.82)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>Painel Profissional</div>
            <div style={{ fontSize: 13, color: C.ink2 }}>{user.username}</div>
          </div>
          <Link href="/">
            <button style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', color: C.ink2, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Home size={14} /> Início
            </button>
          </Link>
        </header>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(12px, 3vw, 24px)' }}>
          {/* Stats rápidos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            <StatCard icon={<MessageCircle size={16} color="#FF7A7A" />} label="Pendentes" value={pendingCount} border="#FF7A7A" />
            <StatCard icon={<CheckCircle size={16} color="#5BF5A0" />} label="Aceitos" value={acceptedCount} border="#5BF5A0" />
            <StatCard icon={<Shield size={16} color={C.cyan} />} label="Experiências" value={experiencias} border={C.cyan} />
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
                {tab.id === 'requests' && pendingCount > 0 && (
                  <span style={{ background: '#FF4444', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === 'overview' && <OverviewTab atividades={atividades} pendingCount={pendingCount} acceptedCount={acceptedCount} />}
            {activeTab === 'requests' && <RequestsTab pendingCount={pendingCount} acceptedCount={acceptedCount} />}
            {activeTab === 'profile' && <ProfileEditor userType="professional" />}
            {activeTab === 'documents' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                <DocumentUpload user={user} title="Documentos Profissionais" description="Envie seus documentos para aumentar sua credibilidade e liberar serviços avançados" />
              </div>
            )}
            {activeTab === 'calendar' && <InteractiveCalendar userType="professional" userId={user?.id || 1} />}
            {activeTab === 'map' && <GPSTracking userType="professional" userId={user?.id || 1} username={user?.username || 'Profissional'} />}
          </motion.div>
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

function OverviewTab({ atividades, pendingCount, acceptedCount }: { atividades: any[]; pendingCount: number; acceptedCount: number }) {
  if (atividades.length === 0 && pendingCount === 0 && acceptedCount === 0) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, textAlign: 'center' }}>
        <Info size={28} color={C.ink3} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Seu painel profissional</div>
        <div style={{ color: C.ink2, fontSize: 13, lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
          Aqui você acompanha solicitações, histórico e atividade da rede. Ative sua presença na tela inicial para aparecer no mapa e receber conexões.
        </div>
        <Link href="/">
          <button style={{ marginTop: 16, border: 'none', borderRadius: 10, padding: '9px 20px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Ir para o Início
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {pendingCount > 0 && (
        <div style={{ background: 'rgba(255,74,74,0.08)', border: '1px solid rgba(255,74,74,0.25)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14 }}><strong>{pendingCount}</strong> solicitação{pendingCount > 1 ? 'ões' : ''} pendente{pendingCount > 1 ? 's' : ''}</div>
          <button onClick={() => {}} style={{ background: 'rgba(255,74,74,0.15)', border: '1px solid rgba(255,74,74,0.3)', borderRadius: 8, padding: '6px 14px', color: '#FF7A7A', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Ver</button>
        </div>
      )}
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

function RequestsTab({ pendingCount, acceptedCount }: { pendingCount: number; acceptedCount: number }) {
  if (pendingCount === 0 && acceptedCount === 0) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, textAlign: 'center' }}>
        <MessageCircle size={28} color={C.ink3} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Nenhuma solicitação</div>
        <div style={{ color: C.ink2, fontSize: 13, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
          Quando clientes se conectarem a você pela rede, as solicitações aparecem aqui. Mantenha sua presença ativa para ser encontrado.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {pendingCount > 0 && (
        <div style={{ background: 'rgba(255,122,122,0.06)', border: '1px solid rgba(255,74,74,0.2)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</div>
          <div style={{ color: C.ink2, fontSize: 12 }}>Solicitações aguardando sua resposta</div>
        </div>
      )}
      {acceptedCount > 0 && (
        <div style={{ background: 'rgba(91,245,160,0.06)', border: '1px solid rgba(91,245,160,0.2)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{acceptedCount} aceito{acceptedCount > 1 ? 's' : ''}</div>
          <div style={{ color: C.ink2, fontSize: 12 }}>Serviços em andamento</div>
        </div>
      )}
    </div>
  );
}

export default CleanProfessionalDashboard;
