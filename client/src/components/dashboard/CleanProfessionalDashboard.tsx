import { useState, useEffect, useRef } from "react";
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
  Camera,
  Users,
  Star,
  Image,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import InteractiveCalendar from "@/components/InteractiveCalendar";
import ProfileEditor from "@/components/profile/ProfileEditor";
import { DocumentUpload } from "@/components/dashboard/DocumentUpload";
import Sidebar from "@/components/Sidebar";
import NetworkAside from "@/components/NetworkAside";

const C = {
  bg: '#020914', bg2: '#061A2D', card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
};

interface ProfessionalDashboardProps {
  user: any;
}

type TabId = 'overview' | 'requests' | 'portfolio' | 'profile' | 'documents' | 'calendar' | 'team';

const TABS: Array<{ id: TabId; icon: typeof Home; label: string }> = [
  { id: 'overview', icon: Home, label: 'Visão Geral' },
  { id: 'requests', icon: MessageCircle, label: 'Solicitações' },
  { id: 'portfolio', icon: Camera, label: 'Portfólio' },
  { id: 'profile', icon: User, label: 'Perfil' },
  { id: 'documents', icon: FileText, label: 'Documentos' },
  { id: 'calendar', icon: Calendar, label: 'Agenda' },
  { id: 'team', icon: Users, label: 'Meu Time' },
];

export function CleanProfessionalDashboard({ user }: ProfessionalDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 900);

  useEffect(() => {
    const onR = () => setMobile(window.innerWidth < 900);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

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
      {!mobile && <Sidebar />}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
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

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 24, padding: mobile ? 0 : '0 24px' }}>
        <div style={{ flex: 1, maxWidth: 760, width: '100%', padding: mobile ? '16px 12px 80px' : '24px 0' }}>
          {/* Stats rápidos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            <StatCard icon={<MessageCircle size={16} color="#FF7A7A" />} label="Pendentes" value={pendingCount} border="#FF7A7A" />
            <StatCard icon={<CheckCircle size={16} color="#5BF5A0" />} label="Aceitos" value={acceptedCount} border="#5BF5A0" />
            <StatCard icon={<Shield size={16} color={C.cyan} />} label="Experiências" value={experiencias} border={C.cyan} />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as any}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '10px 12px', fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400,
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
            {activeTab === 'portfolio' && <PortfolioTab user={user} />}
            {activeTab === 'profile' && <ProfileEditor userType="professional" />}
            {activeTab === 'documents' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                <DocumentUpload user={user} title="Documentos Profissionais" description="Envie seus documentos para aumentar sua credibilidade e liberar serviços avançados" />
              </div>
            )}
            {activeTab === 'calendar' && <InteractiveCalendar userType="professional" userId={user?.id || 1} />}
            {activeTab === 'team' && <TeamTab />}
          </motion.div>
        </div>
        {!mobile && <NetworkAside />}
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

function PortfolioTab({ user }: { user: any }) {
  const [fotos, setFotos] = useState<Array<{ id: string; url: string; descricao: string; data: string; servico: string }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        setFotos(prev => [...prev, {
          id: Date.now().toString() + Math.random(),
          url: reader.result as string,
          descricao: '',
          data: new Date().toLocaleDateString('pt-BR'),
          servico: 'Trabalho realizado',
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Camera size={18} color={C.cyan} /> Portfólio de Trabalhos
            </div>
            <div style={{ color: C.ink2, fontSize: 12, marginTop: 4 }}>
              Mostre seus melhores trabalhos. Clientes veem seu portfólio antes de conectar.
            </div>
          </div>
          <button onClick={() => fileRef.current?.click()}
            style={{ border: 'none', borderRadius: 10, padding: '9px 16px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Camera size={14} /> Adicionar fotos
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => handleUpload(e.target.files)} />
        </div>

        {fotos.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {fotos.map(f => (
              <div key={f.id} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, background: C.bg2, position: 'relative' }}>
                <img src={f.url} alt={f.descricao} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{f.servico}</div>
                  <div style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{f.data}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Image size={40} color={C.ink3} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <div style={{ color: C.ink2, fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Seu portfólio está vazio</div>
            <div style={{ color: C.ink3, fontSize: 12, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
              Adicione fotos dos seus trabalhos realizados. Clientes confiam mais quando veem resultados reais. Cada experiência concluída vira evidência no seu perfil.
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.cyan }}>{fotos.length}</div>
          <div style={{ fontSize: 12, color: C.ink3 }}>Fotos no portfólio</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.cyan }}>—</div>
          <div style={{ fontSize: 12, color: C.ink3 }}>Experiências validadas</div>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={16} color={C.cyan} /> Evidências da rede
        </div>
        <div style={{ color: C.ink3, fontSize: 13, lineHeight: 1.6 }}>
          Conforme você conclui serviços e os clientes confirmam, as experiências aparecem aqui vinculadas às fotos do trabalho. Cada validação bilateral vira um fato na rede — evidência real, não estrelas.
        </div>
      </div>
    </div>
  );
}

function TeamTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Users size={18} color={C.cyan} /> Meu Time
        </div>
        <div style={{ color: C.ink2, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          Monte seu time de profissionais. Quando receber um serviço que precisa de mais gente, indique do seu time. A rede registra a colaboração.
        </div>
        <Link href="/teams">
          <button style={{ border: 'none', borderRadius: 10, padding: '9px 20px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} /> Gerenciar equipes
          </button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, textAlign: 'center' }}>
          <Users size={20} color={C.cyan} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 12, color: C.ink2 }}>Membros</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>—</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, textAlign: 'center' }}>
          <CheckCircle size={20} color="#5BF5A0" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 12, color: C.ink2 }}>Serviços juntos</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>—</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, textAlign: 'center' }}>
          <Star size={20} color={C.cyan} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 12, color: C.ink2 }}>Indicações no time</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>—</div>
        </div>
      </div>

      <div style={{ background: `${C.blue}0a`, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 13, color: C.ink2, lineHeight: 1.6 }}>
          <strong style={{ color: C.cyan }}>Como funciona:</strong> Adicione profissionais da rede ao seu time. Quando um cliente precisar de algo fora da sua especialidade, indique alguém do time — a rede registra a indicação e fortalece a confiança dos dois.
        </div>
      </div>
    </div>
  );
}

export default CleanProfessionalDashboard;
