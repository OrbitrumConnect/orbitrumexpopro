import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { DocumentVerificationModal } from '@/components/document-verification-modal';
import Sidebar from '@/components/Sidebar';

const C = {
  bg: '#020914', bg2: '#061A2D', card: 'rgba(3,18,32,0.9)',
  cyan: '#00E5FF', blue: '#00AEEF',
  border: 'rgba(0,174,255,0.18)', borderHot: 'rgba(0,220,255,0.5)',
  ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#607A91',
};

interface Plan {
  id: string;
  name: string;
  price: number;
  subtitle: string;
  features: string[];
  limits?: string[];
  highlight?: boolean;
  free?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'gratis',
    name: 'Grátis',
    price: 0,
    subtitle: 'Experimente a rede',
    free: true,
    features: [
      'Criar perfil completo',
      'Buscar profissionais',
      'Conectar e conversar',
      'Contratar serviços',
      'Confirmar experiências',
      'Construir histórico relacional',
    ],
    limits: [
      '3 buscas por dia',
      '5 conversas ativas por mês',
      'Perfil básico',
    ],
  },
  {
    id: 'indicador',
    name: 'Indicador',
    price: 9.90,
    subtitle: 'Expanda sua rede',
    features: [
      'Tudo do Grátis, sem limites de busca',
      'Indicar pessoas e profissionais',
      'Ferramentas de indicação',
      'Acompanhar conexões e indicações',
      'Orbit Reward por indicação que virou serviço real',
      '15 conversas ativas por mês',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 14.90,
    subtitle: 'Produtividade profissional',
    highlight: true,
    features: [
      'Tudo do Indicador, sem limites',
      'Gestão de oportunidades',
      'Agenda e histórico completo',
      'Ferramentas de produtividade',
      'OrbitMatch avançado (IA)',
      'Conversas ilimitadas',
      'Prioridade no match da rede',
    ],
  },
  {
    id: 'empresa',
    name: 'Empresa',
    price: 29.90,
    subtitle: 'Gestão de equipe e operação',
    features: [
      'Tudo do Pro',
      'Equipes ilimitadas',
      'Gestão de profissionais e conexões',
      'Recursos empresariais',
      'Painel operacional B2B',
      'Relatórios de experiências da equipe',
    ],
  },
];

export default function PlanosPagamento() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'generating' | 'waiting' | 'confirmed'>('idle');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const onR = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  const generatePixMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/payment/generate-pix', {
        plan: planId,
        provider: 'mercadopago',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPixData(data);
      setPaymentStatus('waiting');
      toast({ title: 'PIX gerado', description: 'Escaneie o QR Code ou copie a chave PIX.' });
    },
    onError: (error: Error) => {
      if (error.message.includes('Documentos não verificados') || error.message.includes('DOCUMENTS_NOT_VERIFIED')) {
        toast({ title: 'Documentos pendentes', description: 'Verifique seus documentos primeiro.', variant: 'destructive' });
        setTimeout(() => setShowDocumentModal(true), 1500);
      } else {
        toast({ title: 'Erro ao gerar PIX', description: 'Verifique sua conexão e tente novamente.', variant: 'destructive' });
      }
      setPaymentStatus('idle');
    },
  });

  const checkPaymentMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await apiRequest('POST', '/api/payment/check-status', { transactionId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === 'confirmed') {
        setPaymentStatus('confirmed');
        toast({ title: 'Pagamento confirmado!', description: `Plano ${selectedPlan?.name} ativado.` });
        setTimeout(() => setLocation('/'), 3000);
      }
    },
  });

  useEffect(() => {
    if (pixData?.transactionId && paymentStatus === 'waiting') {
      const interval = setInterval(() => checkPaymentMutation.mutate(pixData.transactionId), 8000);
      return () => clearInterval(interval);
    }
  }, [pixData?.transactionId, paymentStatus]);

  const copyPixKey = () => {
    if (pixData?.pixKey) {
      navigator.clipboard.writeText(pixData.pixKey);
      setCopied(true);
      toast({ title: 'Copiado!', description: 'Chave PIX copiada.' });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const selectPlan = (plan: Plan) => {
    if (plan.free) return;
    setSelectedPlan(plan);
    setPixData(null);
    setPaymentStatus('idle');
  };

  const generatePix = () => {
    if (selectedPlan) {
      setPaymentStatus('generating');
      generatePixMutation.mutate(selectedPlan.id);
    }
  };

  if (paymentStatus === 'confirmed') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: C.card, border: `1px solid rgba(74,222,128,0.3)`, borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 420, width: '100%' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '2px solid #4ADE80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>✓</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Pagamento confirmado</div>
          <div style={{ color: '#4ADE80', fontSize: 15, marginBottom: 16 }}>Plano {selectedPlan?.name} ativado</div>
          <div style={{ color: C.ink3, fontSize: 13 }}>Redirecionando em 3 segundos...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      {!mobile && <Sidebar />}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: mobile ? '14px 16px' : '14px 24px 14px clamp(18px, 14vw, 56px)', borderBottom: `1px solid ${C.border}`, background: 'rgba(4,17,31,0.82)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>Planos</div>
            <div style={{ fontSize: 13, color: C.ink2 }}>Escolha o plano ideal para o seu momento</div>
          </div>
          <button onClick={() => setLocation('/')} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', color: C.ink2, fontSize: 13, cursor: 'pointer' }}>
            ← Início
          </button>
        </header>

        <div style={{ flex: 1, padding: mobile ? '16px 12px 80px' : '24px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>

            {/* Filosofia */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: C.ink2, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
                Conectar, conversar e validar experiências é <strong style={{ color: C.ink }}>grátis para sempre</strong>.
                Planos pagos desbloqueiam ferramentas de produtividade — a rede nunca cobra por existir.
              </p>
            </div>

            {!selectedPlan ? (
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(4, 1fr)', gap: mobile ? 12 : 16 }}>
                {PLANS.map(plan => (
                  <div key={plan.id}
                    onClick={() => selectPlan(plan)}
                    style={{
                      background: C.card,
                      border: `1px solid ${plan.highlight ? C.borderHot : C.border}`,
                      borderRadius: 14,
                      padding: mobile ? 16 : 20,
                      cursor: plan.free ? 'default' : 'pointer',
                      position: 'relative',
                      transition: 'border-color 0.2s, transform 0.2s',
                      ...(plan.highlight ? { boxShadow: `0 0 24px ${C.blue}22` } : {}),
                    }}
                    onMouseEnter={e => { if (!plan.free) e.currentTarget.style.borderColor = C.borderHot; }}
                    onMouseLeave={e => { if (!plan.highlight) e.currentTarget.style.borderColor = C.border; }}>

                    {plan.highlight && (
                      <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50)', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 10 }}>
                        Mais popular
                      </div>
                    )}

                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>
                      <div style={{ fontSize: 12, color: C.ink3 }}>{plan.subtitle}</div>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      {plan.free ? (
                        <div style={{ fontSize: 28, fontWeight: 700, color: '#4ADE80' }}>R$ 0</div>
                      ) : (
                        <div>
                          <span style={{ fontSize: 28, fontWeight: 700, color: C.cyan }}>R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                          <span style={{ fontSize: 13, color: C.ink3 }}>/mês</span>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginBottom: plan.limits ? 10 : 0 }}>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: C.ink2, marginBottom: 6, lineHeight: 1.4 }}>
                          <span style={{ color: C.cyan, flexShrink: 0, fontSize: 11, marginTop: 2 }}>✓</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    {plan.limits && (
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 4 }}>
                        <div style={{ fontSize: 11, color: C.ink3, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>LIMITES</div>
                        {plan.limits.map((l, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.ink3, marginBottom: 4 }}>
                            <span style={{ flexShrink: 0 }}>·</span>
                            <span>{l}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: 16 }}>
                      {plan.free ? (
                        <div style={{ textAlign: 'center', padding: '10px', borderRadius: 10, border: `1px solid rgba(74,222,128,0.2)`, background: 'rgba(74,222,128,0.06)', color: '#4ADE80', fontSize: 13, fontWeight: 600 }}>
                          Seu plano atual
                        </div>
                      ) : (
                        <button style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '11px', background: plan.highlight ? `linear-gradient(135deg, ${C.cyan}, ${C.blue})` : `${C.blue}22`, color: plan.highlight ? '#012' : C.cyan, fontWeight: 600, fontSize: 14 }}>
                          Assinar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : paymentStatus === 'idle' || paymentStatus === 'generating' ? (
              /* Confirmação do plano */
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: mobile ? 20 : 28 }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Confirmar plano {selectedPlan.name}</div>
                    <div style={{ color: C.ink3, fontSize: 13 }}>Revise antes de prosseguir com o pagamento</div>
                  </div>

                  <div style={{ background: C.bg2, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: C.ink3 }}>Plano</div>
                        <div style={{ fontWeight: 600 }}>{selectedPlan.name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: C.ink3 }}>Valor</div>
                        <div style={{ fontWeight: 600, color: C.cyan }}>R$ {selectedPlan.price.toFixed(2).replace('.', ',')}/mês</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: C.ink3, marginBottom: 8, fontWeight: 600 }}>Inclui:</div>
                    {selectedPlan.features.map((f, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: C.ink2, marginBottom: 4 }}>
                        <span style={{ color: C.cyan }}>✓</span>{f}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setSelectedPlan(null)} disabled={paymentStatus === 'generating'}
                      style={{ flex: 1, border: `1px solid ${C.border}`, background: 'transparent', borderRadius: 10, padding: '11px', color: C.ink2, fontSize: 14, cursor: 'pointer' }}>
                      Voltar
                    </button>
                    <button onClick={generatePix} disabled={paymentStatus === 'generating'}
                      style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 10, padding: '11px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#012', fontWeight: 600, fontSize: 14 }}>
                      {paymentStatus === 'generating' ? 'Gerando PIX...' : 'Pagar com PIX'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Tela PIX */
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: mobile ? 20 : 28 }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Pagamento PIX</div>
                    <div style={{ color: C.ink3, fontSize: 13 }}>Plano {selectedPlan.name} — R$ {selectedPlan.price.toFixed(2).replace('.', ',')}</div>
                  </div>

                  <div style={{ background: C.bg2, borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>⬡</div>
                    <div style={{ color: C.ink3, fontSize: 13, marginBottom: 12 }}>Escaneie o QR Code ou copie a chave PIX</div>

                    <div style={{ background: C.bg, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: C.ink3, marginBottom: 6 }}>Chave PIX (Copia e Cola)</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <code style={{ flex: 1, fontSize: 12, color: C.ink, wordBreak: 'break-all', textAlign: 'left' }}>
                          {pixData?.pixKey || pixData?.qrCodeBase64 || 'Gerando...'}
                        </code>
                        <button onClick={copyPixKey} disabled={!pixData?.pixKey}
                          style={{ background: `${C.blue}22`, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', color: C.cyan, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                          {copied ? '✓' : 'Copiar'}
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: C.ink3 }}>
                      <div>Valor: <strong style={{ color: C.ink }}>R$ {selectedPlan.price.toFixed(2).replace('.', ',')}</strong></div>
                      <div>Válido por 30 minutos</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '5px 14px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1.5s infinite' }} />
                      Aguardando pagamento...
                    </span>
                    <div style={{ color: C.ink3, fontSize: 12, marginTop: 8 }}>Verificando automaticamente. Seu plano será ativado assim que confirmado.</div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => { setPixData(null); setSelectedPlan(null); setPaymentStatus('idle'); }}
                      style={{ flex: 1, border: `1px solid ${C.border}`, background: 'transparent', borderRadius: 10, padding: '11px', color: C.ink2, fontSize: 14, cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button onClick={() => checkPaymentMutation.mutate(pixData.transactionId)} disabled={checkPaymentMutation.isPending}
                      style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 10, padding: '11px', background: `${C.blue}22`, color: C.cyan, fontWeight: 600, fontSize: 14 }}>
                      {checkPaymentMutation.isPending ? 'Verificando...' : 'Verificar pagamento'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reward — como funciona */}
            {!selectedPlan && (
              <div style={{ maxWidth: 640, margin: '32px auto 0', background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: mobile ? 16 : 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Como funciona o Orbit Reward</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    ['Indique', 'Compartilhe profissionais com quem precisa — a rede conecta.'],
                    ['Serviço acontece', 'O profissional indicado realiza o serviço.'],
                    ['Validação bilateral', 'Cliente e profissional confirmam — nasce o fato relacional.'],
                    ['Reward liberado', 'Resultado real gera recompensa. Sem resultado, sem reward.'],
                  ].map(([titulo, desc], i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${C.cyan}18`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: C.cyan, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{titulo}</div>
                        <div style={{ fontSize: 12, color: C.ink3 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, padding: '10px 14px', background: `${C.blue}0a`, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.ink3, lineHeight: 1.5 }}>
                  Orbit Reward é recompensa por resultado real — não cashback, não rendimento, não investimento.
                  Validar uma experiência nunca gera remuneração (evita validação falsa). Preços são hipóteses de teste.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DocumentVerificationModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onConfirm={() => { setShowDocumentModal(false); window.location.href = '/verificacao-documentos'; }}
      />
    </div>
  );
}
