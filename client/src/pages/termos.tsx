import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";

export default function Termos() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#020914' }}>
      <div className="max-w-4xl mx-auto p-6 py-20">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 transition-all">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 transition-all">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-8 text-cyan-400 text-center">
          Termos de Uso - Orbitrum Connect
        </h1>
        
        <div className="glassmorphism rounded-xl p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">1. Definições Gerais</h2>
            <p className="text-gray-300 leading-relaxed">
              A <strong>Orbitrum Connect</strong> é uma plataforma digital 
              futurista que conecta clientes e profissionais através de uma interface interativa com elementos 
              sci-fi e orbs. A plataforma oferece diferentes níveis de acesso conforme o perfil do usuário.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">2. Tipos de Usuários</h2>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4 border border-cyan-500/30">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">2.1 Modo Free (Visitante/Não Logado)</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Pode visualizar perfis profissionais em modo somente leitura</li>
                  <li>Pode clicar no cérebro neural e interagir com orbs</li>
                  <li>Pode jogar no modo diversão (sem recompensas reais)</li>
                  <li><strong className="text-yellow-400">LIMITAÇÃO:</strong> Apenas 1 pesquisa por mês no sistema orbital</li>
                  <li><strong className="text-yellow-400">LIMITAÇÃO:</strong> Não pode acessar funcionalidade de Teams</li>
                  <li>Pode visualizar os planos disponíveis e realizar cadastro</li>
                  <li>Não pode contratar profissionais, criar times ou ganhar tokens</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-green-500/30">
                <h3 className="text-lg font-semibold text-green-400 mb-2">2.2 Cliente Logado</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Pode contratar profissionais e solicitar serviços</li>
                  <li>Pode ganhar tokens através de jogos e atividades</li>
                  <li>Pode criar orbits e gerenciar equipes</li>
                  <li>Pode sacar recompensas conforme regras do plano contratado</li>
                  <li>Tem acesso completo às funcionalidades da plataforma</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">2.3 Profissional Logado</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Pode ofertar serviços e receber contratações</li>
                  <li>Deve fornecer dados obrigatórios: CPF, CEP, comprovante de residência e chave Pix</li>
                  <li>Pode receber tokens e pagamentos pelos serviços prestados</li>
                  <li>Deve manter informações atualizadas e prestar serviços com qualidade</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-red-500/30">
                <h3 className="text-lg font-semibold text-red-400 mb-2">2.4 Administrador</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Conta única criada por email e senha pré-definidos</li>
                  <li>Poder de moderação e gestão da plataforma</li>
                  <li>Responsável pela manutenção da qualidade dos serviços</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">3. Regras de Uso</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">3.1 Proibições</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>É estritamente proibido o uso de bots ou automações não autorizadas</li>
                  <li>É proibida a criação de múltiplas contas com intenção fraudulenta</li>
                  <li>É proibida a manipulação de tokens ou tentativas de burlar o sistema</li>
                  <li>Não é permitido comportamento abusivo, discriminatório ou inadequado</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">3.2 Responsabilidades do Usuário</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Manter dados cadastrais atualizados e verdadeiros</li>
                  <li>Usar a plataforma de forma ética e respeitosa</li>
                  <li>Não compartilhar credenciais de acesso com terceiros</li>
                  <li>Reportar bugs ou comportamentos suspeitos</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">4. Sistema de Créditos Internos ("Tokens")</h2>
            
            <div className="glassmorphism rounded-lg p-4 border border-yellow-500/30 mb-4">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ ESCLARECIMENTO IMPORTANTE</h3>
              <p className="text-gray-300 leading-relaxed">
                Os "tokens" da Orbitrum Connect são <strong>créditos digitais internos</strong> da plataforma, 
                funcionando como um sistema de pré-pagamento ou carteira virtual. <strong>NÃO são criptomoedas</strong>, 
                não possuem valor fora da plataforma e não configuram ativo financeiro ou investimento.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300">
                <strong>4.1 Modo Visitante:</strong> O jogo no modo visitante é puramente recreativo. 
                Não gera ganhos reais, créditos ou qualquer tipo de recompensa monetária.
              </p>
              <p className="text-gray-300">
                <strong>4.2 Modo Logado:</strong> Usuários autenticados podem ganhar créditos internos através 
                de jogos, sujeitos às regras de limite mensal e cashback definidas no plano contratado.
              </p>
              <p className="text-gray-300">
                <strong>4.3 Conversão:</strong> A conversão de créditos possui limite mensal e está sujeita às 
                regras específicas de cada plano. Os créditos são para uso exclusivo dentro da plataforma.
              </p>
              <p className="text-gray-300">
                <strong>4.4 Natureza dos Créditos:</strong> Usuário paga R$X e recebe R$X em créditos para 
                usar nos serviços da plataforma. É um sistema de pré-pagamento, não investimento.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">5. Suspensão de Contas</h2>
            <p className="text-gray-300 leading-relaxed">
              A Orbitrum Connect reserva-se o direito de suspender, temporária ou permanentemente, 
              contas que violem estes termos de uso. Isso inclui, mas não se limita a: uso de bots, 
              criação de múltiplas contas fraudulentas, manipulação de tokens, comportamento abusivo 
              ou qualquer atividade que comprometa a integridade da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">6. Responsabilidades e Garantias da Plataforma</h2>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4 border border-cyan-500/30">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">6.1 O que a Orbitrum OFERECE:</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>🔒 <strong>Plataforma segura e verificada</strong> com profissionais documentados</li>
                  <li>⭐ <strong>Sistema de avaliações confiável</strong> para orientar suas escolhas</li>
                  <li>💬 <strong>Mediação de conflitos</strong> entre clientes e profissionais</li>
                  <li>💰 <strong>Reembolso de tokens</strong> em casos de não entrega conforme acordado</li>
                  <li>🚫 <strong>Moderação ativa</strong> com banimento de usuários problemáticos</li>
                  <li>📊 <strong>Histórico completo</strong> de transações e comunicações</li>
                  <li>🛡️ <strong>Proteção de dados</strong> conforme LGPD</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-yellow-500/30">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">6.2 Limitações de Responsabilidade:</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>❌ <strong>NÃO executamos</strong> os serviços profissionais (pintura, programação, etc.)</li>
                  <li>❌ <strong>NÃO garantimos</strong> a qualidade técnica final do trabalho executado</li>
                  <li>⚖️ <strong>Relação direta</strong> entre cliente e profissional para execução</li>
                  <li>🏢 <strong>Papel de intermediadora</strong> digital e ambiente seguro de negociação</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-green-500/30">
                <h3 className="text-lg font-semibold text-green-400 mb-2">6.3 Processo de Resolução de Problemas:</h3>
                <ol className="text-gray-300 space-y-1 list-decimal list-inside">
                  <li><strong>Abertura de disputa</strong> via plataforma</li>
                  <li><strong>Análise do caso</strong> pela equipe técnica</li>
                  <li><strong>Mediação</strong> entre as partes envolvidas</li>
                  <li><strong>Decisão e ação</strong> (reembolso, nova tentativa, ou encerramento)</li>
                  <li><strong>Bloqueio</strong> de profissional se necessário</li>
                </ol>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">7. Uso do Sistema GPS e Geolocalização</h2>
            <div className="space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">7.1 Consentimento e Ativação</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>O sistema GPS é <strong>opcional</strong> e requer aceite explícito dos termos específicos</li>
                  <li>Você pode ativar ou desativar o rastreamento a qualquer momento</li>
                  <li>Dados de localização são utilizados exclusivamente para conectar com profissionais próximos</li>
                  <li>A recusa do GPS não impede o uso das demais funcionalidades da plataforma</li>
                </ul>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">7.2 Tecnologias Licenciadas</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Leaflet.js</strong> - Licença BSD-2-Clause (código aberto, uso comercial permitido)</li>
                  <li><strong>OpenStreetMap</strong> - Open Database License (dados colaborativos e gratuitos)</li>
                  <li><strong>HTML5 Geolocation</strong> - Padrão W3C implementado pelos navegadores</li>
                  <li>Todas as tecnologias utilizadas são <strong>legalmente licenciadas</strong> para uso comercial</li>
                </ul>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-orange-400 mb-2">7.3 Responsabilidades e Limitações</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>A plataforma <strong>não se responsabiliza</strong> por uso inadequado da localização por profissionais</li>
                  <li>Profissionais devem respeitar a privacidade e segurança dos clientes</li>
                  <li>Comportamentos suspeitos ou invasivos devem ser denunciados imediatamente</li>
                  <li>A precisão do GPS depende do dispositivo e condições ambientais</li>
                  <li>Em caso de problemas técnicos, a funcionalidade pode ser temporariamente desabilitada</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">8. Alterações nos Termos</h2>
            <p className="text-gray-300 leading-relaxed">
              Estes termos podem ser alterados a qualquer momento. Usuários serão notificados sobre 
              mudanças significativas através da plataforma. O uso continuado após as alterações 
              constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">9. Contato</h2>
            <p className="text-gray-300 leading-relaxed">
              Para dúvidas sobre estes termos ou questões relacionadas à plataforma, entre em contato 
              através dos canais oficiais disponíveis na interface da aplicação.
            </p>
          </section>

          <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-600">
            <p>Última atualização: 22 de Julho de 2025 (adicionada seção GPS)</p>
            <p>Orbitrum Connect - Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    </div>
  );
}