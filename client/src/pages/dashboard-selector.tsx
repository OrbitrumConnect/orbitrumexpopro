import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from '@/lib/isAdmin';
import { User, Briefcase, Shield, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import NetworkAside from "@/components/NetworkAside";

const C = {
  bg: '#020914', card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
};

export default function DashboardSelector() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 900);

  useEffect(() => {
    const onR = () => setMobile(window.innerWidth < 900);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  const isAdmin = isAdminUser(user);
  const userType = user?.userType || "client";

  const canAccessClient = userType === 'client' || userType === 'professional' || isAdmin;
  const canAccessPro = userType === 'professional' || isAdmin;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% -10%, #06223B, #020D18 55%, #00060F)', color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 14px clamp(18px, 14vw, 56px)', borderBottom: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.82)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>Meu Painel</div>
            <div style={{ fontSize: 13, color: C.ink2 }}>Olá, {user?.username || 'Usuário'}</div>
          </div>
        </header>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) clamp(12px, 3vw, 24px)' }}>
          <div style={{ fontSize: 15, color: C.ink2, marginBottom: 24 }}>Selecione o painel que deseja acessar</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Cliente */}
            <DashCard
              icon={<User size={24} />}
              title="Painel do Cliente"
              desc="Conexões, perfil, documentos e histórico de atividade"
              color={C.cyan}
              enabled={canAccessClient}
              onClick={() => setLocation('/dashboard-client')}
              tag={userType === 'professional' ? 'Profissionais também consomem' : undefined}
            />

            {/* Profissional */}
            <DashCard
              icon={<Briefcase size={24} />}
              title="Painel Profissional"
              desc="Solicitações, agenda, documentos e presença na rede"
              color="#5BF5A0"
              enabled={canAccessPro}
              onClick={() => setLocation('/dashboard-professional')}
              tag={!canAccessPro ? 'Restrito a profissionais' : undefined}
            />
          </div>

          {/* Admin */}
          {isAdmin && (
            <div style={{ marginTop: 20 }}>
              <DashCard
                icon={<Shield size={24} />}
                title="Administração"
                desc="Usuários, moderação, analytics e configurações da rede"
                color="#FF7A7A"
                enabled
                onClick={() => setLocation('/admin')}
              />
            </div>
          )}
        </div>
      </div>
      {!mobile && <NetworkAside />}
      </div>
    </div>
  );
}

function DashCard({ icon, title, desc, color, enabled, onClick, tag }: {
  icon: React.ReactNode; title: string; desc: string; color: string;
  enabled: boolean; onClick: () => void; tag?: string;
}) {
  return (
    <button
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      style={{
        textAlign: 'left', width: '100%', cursor: enabled ? 'pointer' : 'default',
        background: C.card, border: `1px solid ${enabled ? color + '44' : C.border}`, borderRadius: 14,
        padding: 20, opacity: enabled ? 1 : 0.5, transition: 'border-color .2s, transform .15s',
      }}
      onMouseEnter={e => { if (enabled) { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = enabled ? color + '44' : C.border; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: C.ink, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 13, color: C.ink2, lineHeight: 1.4 }}>{desc}</div>
          {tag && <div style={{ fontSize: 11, color: C.ink3, marginTop: 4 }}>{tag}</div>}
        </div>
        {enabled && <ArrowRight size={18} color={C.ink3} style={{ flexShrink: 0 }} />}
      </div>
    </button>
  );
}
