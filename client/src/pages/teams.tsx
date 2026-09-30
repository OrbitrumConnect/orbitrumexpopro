import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, X, UserPlus, Briefcase, Eye, UserMinus, Lock, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import { ProfessionalModal } from "@/components/professional-modal";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { Professional, User } from "@shared/schema";

const C = {
  bg: '#020914', bg2: '#061A2D', card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
};

export default function Teams() {
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [professionalModalOpen, setProfessionalModalOpen] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null);
  const [criarOpen, setCriarOpen] = useState(false);
  const [nomeTime, setNomeTime] = useState('');
  const [profsSelecionados, setProfsSelecionados] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, user: authUser } = useAuth();
  const [, setLocation] = useLocation();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/1"],
    enabled: isAuthenticated && !authUser?.email,
  });

  const currentUser = authUser || user;

  const { data: teamsData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/teams"],
    enabled: isAuthenticated,
  });
  const teams = teamsData ?? [];

  const { data: professionalsData } = useQuery<Professional[]>({
    queryKey: ["/api/professionals"],
  });
  const professionals = professionalsData ?? [];

  const removeFromTeamMutation = useMutation({
    mutationFn: async ({ teamId, professionalId }: { teamId: number; professionalId: number }) => {
      return apiRequest(`/api/teams/${teamId}/remove-professional`, 'POST', JSON.stringify({ professionalId }));
    },
    onSuccess: () => {
      toast({ title: "Profissional removido", description: "Removido do time com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });

  const criarTimeMutation = useMutation({
    mutationFn: async () => {
      const team = await apiRequest('/api/teams', 'POST', JSON.stringify({
        userId: currentUser?.id || 1,
        name: nomeTime.trim() || 'Meu Time',
        professionalIds: profsSelecionados,
      }));
      return team;
    },
    onSuccess: () => {
      toast({ title: "Time criado", description: `"${nomeTime.trim() || 'Meu Time'}" criado com sucesso.` });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setCriarOpen(false);
      setNomeTime('');
      setProfsSelecionados([]);
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível criar o time.", variant: "destructive" });
    },
  });

  const toggleProf = (id: string) => {
    setProfsSelecionados(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length >= 10 ? prev : [...prev, id]
    );
  };

  const getTeamProfessionals = (team: any) => {
    if (!team.professionalIds || team.professionalIds.length === 0) return [];
    return (professionals || []).filter(p => team.professionalIds.includes(p.id.toString()));
  };

  const handleViewProfile = (professionalId: number) => {
    setSelectedProfessionalId(professionalId);
    setProfessionalModalOpen(true);
  };

  const handleRemoveFromTeam = (teamId: number, professionalId: number) => {
    if (confirm("Tem certeza que deseja remover este profissional do time?")) {
      removeFromTeamMutation.mutate({ teamId, professionalId });
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% -10%, #06223B, #020D18 55%, #00060F)', color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, textAlign: 'center', maxWidth: 320 }}>
          <Lock size={28} color={C.ink3} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Acesso restrito</div>
          <div style={{ color: C.ink2, fontSize: 13, marginBottom: 16 }}>Faça login para acessar seus times</div>
          <Link href="/">
            <button style={{ border: 'none', borderRadius: 10, padding: '9px 24px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Voltar ao Início
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const customTeams = teams.filter(t => t.name !== "Por Todos");
  const porTodos = teams.find(t => t.name === "Por Todos");
  const porTodosProfessionals = porTodos ? getTeamProfessionals(porTodos) : [];

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% -10%, #06223B, #020D18 55%, #00060F)', color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 14px clamp(18px, 14vw, 56px)', borderBottom: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.82)', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} /> Equipes
            </div>
            <div style={{ fontSize: 13, color: C.ink2 }}>Monte times de profissionais para seus projetos</div>
          </div>
          <button onClick={() => { setCriarOpen(true); setNomeTime(''); setProfsSelecionados([]); }}
            style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, border: 'none', borderRadius: 10, padding: '8px 16px', color: '#012', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserPlus size={14} /> Criar Time
          </button>
        </header>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(16px, 3vw, 28px)' }}>
          {/* Times personalizados */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
            {customTeams.map(team => {
              const profs = getTeamProfessionals(team);
              const isOpen = expandedTeam === team.id;
              return (
                <div key={team.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  <button onClick={() => setExpandedTeam(isOpen ? null : team.id)}
                    style={{ width: '100%', textAlign: 'left', padding: '16px 18px', background: 'none', border: 'none', color: C.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{team.name}</div>
                      <div style={{ fontSize: 12, color: C.ink2, marginTop: 2 }}>{profs.length}/10 profissionais</div>
                    </div>
                    {isOpen ? <ChevronUp size={16} color={C.ink3} /> : <ChevronDown size={16} color={C.ink3} />}
                  </button>
                  {isOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0 18px 16px', borderTop: `1px solid ${C.border}` }}>
                      {profs.length === 0 ? (
                        <div style={{ color: C.ink2, fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
                          Nenhum profissional adicionado. Busque na rede e adicione ao time.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
                          {profs.map(prof => (
                            <ProfCard key={prof.id} prof={prof}
                              onView={() => handleViewProfile(prof.id)}
                              onRemove={() => handleRemoveFromTeam(team.id, prof.id)} />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {customTeams.length === 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, textAlign: 'center', marginBottom: 24 }}>
              <Users size={32} color={C.ink3} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Nenhum time criado</div>
              <div style={{ color: C.ink2, fontSize: 13, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
                Navegue pelos perfis na tela inicial e clique em "Adicionar ao Time" nos profissionais que desejar.
              </div>
            </div>
          )}

          {/* Equipe completa */}
          {porTodos && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Briefcase size={16} color={C.cyan} /> Equipe completa
                  </div>
                  <div style={{ fontSize: 12, color: C.ink2, marginTop: 2 }}>Todos os profissionais disponíveis na rede</div>
                </div>
                <span style={{ fontSize: 13, color: C.cyan }}>{porTodosProfessionals.length} profissionais</span>
              </div>
              {porTodosProfessionals.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                  {porTodosProfessionals.slice(0, 20).map(prof => (
                    <ProfCard key={prof.id} prof={prof} onView={() => handleViewProfile(prof.id)} compact />
                  ))}
                </div>
              ) : (
                <div style={{ color: C.ink2, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                  Nenhum profissional cadastrado ainda na rede.
                </div>
              )}
            </div>
          )}

          {/* Como funciona */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Como funciona</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { icon: <UserPlus size={20} color={C.cyan} />, title: 'Adicione profissionais', desc: 'Navegue pelos perfis na rede e adicione quem precisar ao seu time.' },
                { icon: <Users size={20} color={C.cyan} />, title: 'Organize times', desc: 'Monte equipes de até 10 profissionais para diferentes projetos.' },
                { icon: <Briefcase size={20} color={C.cyan} />, title: 'Coordene', desc: 'Gerencie suas equipes e coordene diferentes especialidades num projeto.' },
              ].map((step, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ margin: '0 auto 8px', width: 40, height: 40, borderRadius: 10, background: `${C.cyan}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ color: C.ink2, fontSize: 12, lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Criar Time */}
      {criarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setCriarOpen(false); }}>
          <div style={{ background: '#061222', border: `1px solid ${C.borderHot}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color={C.cyan} /> Criar Time
              </div>
              <button onClick={() => setCriarOpen(false)} style={{ background: 'none', border: 'none', color: C.ink3, cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: C.ink2, marginBottom: 6, display: 'block' }}>Nome do time</label>
              <input value={nomeTime} onChange={e => setNomeTime(e.target.value)} placeholder="Ex: Reforma da casa"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'rgba(0,8,20,0.7)', color: C.ink, fontSize: 14, outline: 'none' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: C.ink2, marginBottom: 6, display: 'block' }}>
                Profissionais ({profsSelecionados.length}/10)
              </label>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'rgba(0,8,20,0.7)', color: C.ink2, fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{profsSelecionados.length > 0 ? `${profsSelecionados.length} selecionado${profsSelecionados.length > 1 ? 's' : ''}` : 'Selecionar profissionais...'}</span>
                  <ChevronDown size={14} />
                </button>
                {dropdownOpen && professionals.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#071829', border: `1px solid ${C.borderHot}`, borderRadius: 10, marginTop: 4, maxHeight: 240, overflowY: 'auto' }}>
                    {professionals.map(p => {
                      const sel = profsSelecionados.includes(p.id.toString());
                      return (
                        <button key={p.id} onClick={() => toggleProf(p.id.toString())}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: sel ? `${C.cyan}15` : 'transparent', border: 'none', borderBottom: `1px solid ${C.border}`, color: C.ink, cursor: 'pointer', textAlign: 'left' }}>
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}` }} />
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${C.cyan}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700, fontSize: 11 }}>{p.name?.[0]?.toUpperCase() || '?'}</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                            <div style={{ color: C.ink2, fontSize: 11 }}>{p.title}</div>
                          </div>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${sel ? C.cyan : C.border}`, background: sel ? C.cyan : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <span style={{ color: '#012', fontSize: 12, fontWeight: 700 }}>✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {profsSelecionados.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {profsSelecionados.map(id => {
                  const p = professionals.find(pr => pr.id.toString() === id);
                  if (!p) return null;
                  return (
                    <span key={id} onClick={() => toggleProf(id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${C.cyan}18`, border: `1px solid ${C.border}`, borderRadius: 16, padding: '4px 10px', fontSize: 12, color: C.ink, cursor: 'pointer' }}>
                      {p.name} <X size={12} color={C.ink3} />
                    </span>
                  );
                })}
              </div>
            )}

            <button onClick={() => criarTimeMutation.mutate()} disabled={criarTimeMutation.isPending}
              style={{ width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 14, cursor: criarTimeMutation.isPending ? 'wait' : 'pointer', opacity: criarTimeMutation.isPending ? 0.7 : 1 }}>
              {criarTimeMutation.isPending ? 'Criando...' : 'Criar Time'}
            </button>
          </div>
        </div>
      )}

      {professionalModalOpen && selectedProfessionalId && (
        <ProfessionalModal
          isOpen={professionalModalOpen}
          onClose={() => { setProfessionalModalOpen(false); setSelectedProfessionalId(null); }}
          professionalId={selectedProfessionalId}
        />
      )}
    </div>
  );
}

function ProfCard({ prof, onView, onRemove, compact }: { prof: Professional; onView: () => void; onRemove?: () => void; compact?: boolean }) {
  return (
    <div style={{ background: 'rgba(0,8,20,0.5)', border: `1px solid ${C.border}`, borderRadius: 10, padding: compact ? '10px 12px' : '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      {prof.avatar ? (
        <img src={prof.avatar} alt={prof.name} style={{ width: compact ? 30 : 36, height: compact ? 30 : 36, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0 }} />
      ) : (
        <div style={{ width: compact ? 30 : 36, height: compact ? 30 : 36, borderRadius: '50%', background: `${C.cyan}22`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          {prof.name?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prof.name}</div>
        <div style={{ color: C.ink2, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prof.title}</div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button onClick={e => { e.stopPropagation(); onView(); }}
          style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: 6, color: C.cyan, cursor: 'pointer', display: 'flex' }}>
          <Eye size={14} />
        </button>
        {onRemove && (
          <button onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{ background: 'none', border: '1px solid rgba(255,74,74,0.25)', borderRadius: 6, padding: 6, color: '#FF7A7A', cursor: 'pointer', display: 'flex' }}>
            <UserMinus size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
