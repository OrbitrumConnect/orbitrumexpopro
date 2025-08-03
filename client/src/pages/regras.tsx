import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";

export default function Regras() {
  return (
    <div className="min-h-screen bg-[var(--space-black)] text-white">
      <div className="max-w-4xl mx-auto p-6 py-20">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="glassmorphism hover:bg-opacity-30 transition-all">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="glassmorphism hover:bg-opacity-30 transition-all">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8 neon-text text-center">
          Regras da Plataforma - Orbitrum Connect
        </h1>
        
        <div className="glassmorphism rounded-xl p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">1. Sistema de Gamificação e Tokens</h2>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4 border border-red-500/30 bg-red-900/20">
                <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ IMPORTANTE - Natureza Não-Financeira</h3>
                <ul className="text-red-200 space-y-1 list-disc list-inside">
                  <li><strong>NÃO É INVESTIMENTO:</strong> Tokens não são produtos financeiros ou de investimento</li>
                  <li><strong>NÃO HÁ GARANTIAS:</strong> Cashbacks são benefícios da plataforma, não rendimentos garantidos</li>
                  <li><strong>PLATAFORMA DE SERVIÇOS:</strong> Orbitrum é intermediadora de contatos profissionais</li>
                  <li><strong>JOGOS RECREATIVOS:</strong> Atividades gamificadas são para entretenimento e engajamento</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-cyan-500/30">
                <h3 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">1.1 Como Funcionam os Tokens</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Tokens são moeda virtual para uso exclusivo na plataforma</li>
                  <li>Obtidos através de atividades gamificadas e planos de assinatura</li>
                  <li>Usados para intermediação de contatos e acesso a funcionalidades</li>
                  <li>Conversível em créditos conforme regras específicas da plataforma</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-green-500/30">
                <h3 className="text-lg font-semibold text-green-400 mb-2">1.2 Tipos de Tokens</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Tokens do Plano:</strong> Recebidos ao contratar planos pagos</li>
                  <li><strong>Tokens de Jogo:</strong> Ganhos através de atividades gamificadas</li>
                  <li><strong>Tokens Comprados:</strong> Adquiridos diretamente na plataforma</li>
                  <li><strong>Tokens de Recompensa:</strong> Bônus por performance e rankings</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-yellow-500/30">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">1.3 Limites e Restrições por Tipo de Usuário</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-red-500 pl-3">
                    <h4 className="font-semibold text-red-400 mb-1">Modo Free (Não Logado):</h4>
                    <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                      <li>Máximo 1 pesquisa por mês no sistema orbital</li>
                      <li>Jogo apenas no modo diversão (sem ganho de tokens)</li>
                      <li>Visualização limitada de perfis profissionais</li>
                      <li>Sem acesso a Teams, contratações ou cashback</li>
                    </ul>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-3">
                    <h4 className="font-semibold text-green-400 mb-1">Usuários com Plano Ativo:</h4>
                    <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                      <li>Limite máximo de 3 jogos por dia para ganho de tokens</li>
                      <li>Benefícios crescentes de plataforma conforme plano e atividade</li>
                      <li>Limite mensal de saque de 8,7% do saldo acumulado</li>
                      <li>Bloqueio de saque antes de 6 meses de plano ativo</li>
                      <li>Tokens nunca expiram, mas estão sujeitos às regras de conversão</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">2. Regras de Saque e Monetização</h2>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">2.1 Condições para Saque</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Necessário ter plano ativo por pelo menos 6 meses</li>
                  <li>Limite mensal de 8,7% do cashback acumulado</li>
                  <li>Tokens comprados podem ser sacados livremente após conversão</li>
                  <li>Verificação de identidade obrigatória para saques</li>
                  <li>Processamento em até 5 dias úteis</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-red-500/30">
                <h3 className="text-lg font-semibold text-red-400 mb-2">2.2 Sistema de Benefícios por Plano</h3>
                <div className="text-gray-300 space-y-2">
                  <p><strong>Básico (R$ 7):</strong> Créditos base + bônus por atividade</p>
                  <p><strong>Standard (R$ 14):</strong> Mais créditos base + bônus aprimorado</p>
                  <p><strong>Pro (R$ 21):</strong> Créditos elevados + bônus premium</p>
                  <p><strong>Max (R$ 30):</strong> Máximos créditos + bônus exclusivo</p>
                </div>
                <p className="text-sm text-red-300 mt-2">
                  <strong>Importante:</strong> Benefícios são créditos de plataforma, não produtos financeiros. 
                  Valores convertíveis limitados ao pool disponível de 8,7% mensal após 6 meses.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">3. Proibições e Penalidades</h2>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4 border border-red-600/50">
                <h3 className="text-lg font-semibold text-red-400 mb-2">3.1 Atividades Proibidas</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Múltiplas contas:</strong> Criação de contas falsas ou duplicadas</li>
                  <li><strong>Manipulação de tokens:</strong> Tentativas de burlar o sistema</li>
                  <li><strong>Uso de bots:</strong> Automação não autorizada de atividades</li>
                  <li><strong>Fraude em jogos:</strong> Uso de scripts ou trapaças</li>
                  <li><strong>Lavagem de tokens:</strong> Transferências suspeitas</li>
                  <li><strong>Comportamento abusivo:</strong> Assédio, spam ou atividades prejudiciais</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-orange-500/30">
                <h3 className="text-lg font-semibold text-orange-400 mb-2">3.2 Penalidades</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Advertência:</strong> Para infrações leves</li>
                  <li><strong>Suspensão temporária:</strong> Bloqueio de 7 a 30 dias</li>
                  <li><strong>Confisco de tokens:</strong> Perda de tokens obtidos irregularmente</li>
                  <li><strong>Banimento permanente:</strong> Para infrações graves ou reincidentes</li>
                  <li><strong>Bloqueio de saque:</strong> Impedimento de conversão por período determinado</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">4. Direitos e Deveres dos Profissionais</h2>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4 border border-blue-500/30">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">4.1 Direitos dos Profissionais</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Receber tokens pelos serviços contratados através da plataforma</li>
                  <li>Definir próprios preços e condições de trabalho</li>
                  <li>Acesso às ferramentas de gestão de perfil e portfolio</li>
                  <li>Proteção contra avaliações injustas ou abusivas</li>
                  <li>Suporte técnico e resolução de disputas</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-blue-500/30">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">4.2 Deveres dos Profissionais</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Manter informações de perfil atualizadas e verdadeiras</li>
                  <li>Fornecer documentação obrigatória (CPF, CEP, comprovante, Pix)</li>
                  <li>Prestar serviços com qualidade e dentro dos prazos acordados</li>
                  <li>Comunicar-se de forma respeitosa e profissional</li>
                  <li>Reportar problemas ou irregularidades na plataforma</li>
                  <li>Cumprir as leis e regulamentações aplicáveis aos seus serviços</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">4.3 Sistema de Avaliações</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Avaliações devem ser honestas e baseadas na experiência real</li>
                  <li>Proibido solicitar avaliações falsas ou em troca de benefícios</li>
                  <li>Profissionais podem responder às avaliações de forma educada</li>
                  <li>Avaliações abusivas podem ser contestadas e removidas</li>
                  <li>Média de avaliações influencia posicionamento na plataforma</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">5. Comunicação e Comportamento</h2>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4 border border-green-500/30">
                <h3 className="text-lg font-semibold text-green-400 mb-2">5.1 Diretrizes de Comunicação</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Linguagem respeitosa e profissional em todas as interações</li>
                  <li>Proibido conteúdo ofensivo, discriminatório ou inadequado</li>
                  <li>Respeitar privacidade e não compartilhar dados pessoais de terceiros</li>
                  <li>Não usar a plataforma para spam ou marketing não autorizado</li>
                  <li>Reportar comportamentos inadequados através dos canais oficiais</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-yellow-500/30">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">5.2 Resolução de Conflitos</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Tentativa de resolução amigável como primeira opção</li>
                  <li>Mediação da plataforma em casos de disputa</li>
                  <li>Documentação de evidências para análise</li>
                  <li>Decisões baseadas em termos de uso e evidências apresentadas</li>
                  <li>Possibilidade de recurso em decisões contestáveis</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">6. Mecânicas de Jogo</h2>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4 border border-cyan-500/30">
                <h3 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">6.1 Regras do Orbit Shooter</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Restrição de acesso:</strong> Sistema de tokens válido apenas para planos pagos</li>
                  <li>Custo: 250 tokens consumidos ao entrar no jogo</li>
                  <li>Fonte: Tokens debitados da carteira do usuário (qualquer tipo)</li>
                  <li>Duração: 50 segundos por rodada</li>
                  <li>Sistema de vidas: 3 vidas (inimigos = -1, luas = -2)</li>
                  <li>Pontuação: 16 tokens por inimigo eliminado</li>
                  <li>Meta mínima: 400 tokens para ganhar prêmios</li>
                  <li>Vitória: Tokens ganhos acima de 400 vão para carteira do usuário</li>
                  <li>Derrota: Tokens perdidos vão para carteira administrativa</li>
                  <li>Limite: 2 partidas por dia máximo</li>
                  <li>Controles: WASD/Setas + Espaço (Desktop) ou Toque (Mobile)</li>
                  <li>Obstáculos: Luas rotativas causam duplo dano</li>
                  <li>Plano gratuito: apenas diversão, sem consumo de tokens ou recompensas</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-amber-500/30">
                <h3 className="text-lg font-semibold text-amber-400 mb-2">6.2 Sistema de Pagamento do Jogo (Planos Pagos)</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Elegibilidade:</strong> Apenas usuários com planos ativos (Básico, Standard, Pro, Max)</li>
                  <li>Consumo obrigatório: 250 tokens são debitados automaticamente ao iniciar</li>
                  <li>Pagamento forçado: Não é possível jogar sem o débito dos tokens</li>
                  <li>Fonte dos tokens: Aceita tokens de planos ou tokens comprados</li>
                  <li>Fluxo de ganhos: Acima de 400 tokens → carteira do usuário</li>
                  <li>Fluxo de perdas: Abaixo de 400 tokens → carteira administrativa</li>
                  <li>Sistema equilibrado: Recompensa habilidade, penaliza baixa performance</li>
                  <li><strong>Plano gratuito:</strong> Não tem acesso ao sistema de tokens, apenas modo diversão</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">6.3 Sistema de Rankings</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Rankings mensais baseados em performance nos jogos</li>
                  <li>Prêmios especiais para top 10 jogadores do mês</li>
                  <li>Rankings separados por categoria de plano</li>
                  <li>Reset mensal para dar oportunidade igual a todos</li>
                  <li>Histórico de conquistas permanente no perfil</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">7. Responsabilidades da Plataforma</h2>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4 border border-blue-500/30">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">7.1 O que Garantimos</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Funcionamento estável da plataforma</li>
                  <li>Segurança dos dados dos usuários</li>
                  <li>Processamento correto de tokens e transações</li>
                  <li>Suporte técnico e atendimento ao usuário</li>
                  <li>Moderação de conteúdo e comportamentos inadequados</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-orange-500/30">
                <h3 className="text-lg font-semibold text-orange-400 mb-2">7.2 Limitações de Responsabilidade</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Não nos responsabilizamos pela qualidade dos serviços prestados</li>
                  <li>Relação direta entre cliente e profissional para execução de trabalhos</li>
                  <li>Não garantimos resultados específicos em jogos ou atividades</li>
                  <li>Não somos responsáveis por problemas técnicos do dispositivo do usuário</li>
                  <li>Limitação de indenização ao valor pago pelos serviços da plataforma</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">8. Atualizações das Regras</h2>
            <div className="glassmorphism rounded-lg p-4 border border-cyan-500/30">
              <p className="text-gray-300 mb-4">
                Estas regras podem ser atualizadas para melhorar a experiência da plataforma 
                e adaptar-se a novas funcionalidades ou requisitos legais.
              </p>
              <ul className="text-cyan-300 space-y-1 list-disc list-inside">
                <li><strong>Notificação:</strong> Usuários serão notificados sobre mudanças significativas</li>
                <li><strong>Período de adaptação:</strong> 30 dias para adequação a novas regras</li>
                <li><strong>Grandfathering:</strong> Direitos adquiridos serão respeitados quando possível</li>
                <li><strong>Transparência:</strong> Histórico de alterações disponível na plataforma</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">9. Suporte e Dúvidas</h2>
            <div className="glassmorphism rounded-lg p-4 border border-green-500/30">
              <p className="text-gray-300 mb-4">
                Para dúvidas sobre estas regras ou questões relacionadas ao uso da plataforma:
              </p>
              <ul className="text-green-300 space-y-1 list-disc list-inside">
                <li><strong>Central de Ajuda:</strong> Disponível na interface da plataforma</li>
                <li><strong>Suporte técnico:</strong> Chat em tempo real durante horário comercial</li>
                <li><strong>FAQ:</strong> Perguntas frequentes atualizadas regularmente</li>
                <li><strong>Tempo de resposta:</strong> Até 24 horas para questões gerais</li>
                <li><strong>Casos complexos:</strong> Até 72 horas para análise detalhada</li>
              </ul>
            </div>
          </section>

          <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-600">
            <p>Última atualização: Janeiro 2025</p>
            <p>Orbitrum Connect - Regras claras para uma experiência justa</p>
            <div className="mt-2 space-x-4">
              <span>/regras</span>
              <span>/termos</span>
              <span>/privacidade</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}