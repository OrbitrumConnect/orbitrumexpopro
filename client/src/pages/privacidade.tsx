import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";

export default function Privacidade() {
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
        
        <h1 className="text-4xl font-bold mb-8 neon-text-legal text-center">
          Política de Privacidade - Orbitrum Connect
        </h1>
        
        <div className="glassmorphism rounded-xl p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold neon-text-legal mb-4">1. Introdução</h2>
            <p className="text-gray-300 leading-relaxed">
              A <strong>Orbitrum Connect</strong> valoriza e protege a privacidade dos seus usuários. 
              Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações 
              pessoais na nossa plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text-legal mb-4">2. Dados Coletados por Tipo de Usuário</h2>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4 border border-cyan-500/30">
                <h3 className="text-lg font-semibold text-[var(--neon-cyan)] mb-2">2.1 Usuários Visitantes (Não Logados)</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Dados NÃO coletados:</strong> Não coletamos dados pessoais identificáveis</li>
                  <li><strong>Cookies anônimos:</strong> Apenas para melhorar a experiência de navegação</li>
                  <li><strong>Dados de navegação:</strong> Páginas visitadas, tempo de permanência (anonimizados)</li>
                  <li><strong>Análise de uso:</strong> Dados agregados para melhorias da plataforma</li>
                </ul>
                <p className="text-sm text-cyan-300 mt-2">
                  <strong>Importante:</strong> No modo visitante, você mantém total anonimato. 
                  Nenhum dado pessoal é solicitado ou armazenado.
                </p>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-green-500/30">
                <h3 className="text-lg font-semibold text-green-400 mb-2">2.2 Usuários Logados (Clientes)</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Dados básicos:</strong> Nome, email, senha (criptografada)</li>
                  <li><strong>Dados de perfil:</strong> Foto, preferências, histórico de atividades</li>
                  <li><strong>Dados de pagamento:</strong> Informações de planos contratados</li>
                  <li><strong>Dados de uso:</strong> Tokens, jogos, interações na plataforma</li>
                  <li><strong>Comunicações:</strong> Mensagens trocadas com profissionais</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">2.3 Profissionais Cadastrados</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Dados básicos:</strong> Nome completo, email, senha (criptografada)</li>
                  <li><strong>Dados obrigatórios:</strong> CPF, CEP, comprovante de residência</li>
                  <li><strong>Dados financeiros:</strong> Chave Pix para recebimentos</li>
                  <li><strong>Dados profissionais:</strong> Portfólio, avaliações, serviços oferecidos</li>
                  <li><strong>Dados de verificação:</strong> Documentos para validação de identidade</li>
                </ul>
                <p className="text-sm text-purple-300 mt-2">
                  <strong>Justificativa:</strong> Dados obrigatórios são necessários para garantir 
                  a segurança das transações e cumprimento de obrigações legais.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text-legal mb-4">3. Como Usamos Seus Dados</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">3.1 Finalidades do Tratamento</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Fornecimento e melhoria dos serviços da plataforma</li>
                  <li>Processamento de pagamentos e transações</li>
                  <li>Comunicação entre usuários e suporte técnico</li>
                  <li>Prevenção de fraudes e atividades suspeitas</li>
                  <li>Cumprimento de obrigações legais e regulamentares</li>
                  <li>Análise estatística para melhorias da plataforma</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">3.2 Base Legal</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Consentimento:</strong> Para dados não essenciais ao serviço</li>
                  <li><strong>Execução contratual:</strong> Para prestação dos serviços contratados</li>
                  <li><strong>Obrigação legal:</strong> Para cumprimento de leis e regulamentos</li>
                  <li><strong>Legítimo interesse:</strong> Para segurança e melhorias da plataforma</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text-legal mb-4">4. Segurança e Proteção dos Dados</h2>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4 border border-red-500/30">
                <h3 className="text-lg font-semibold text-red-400 mb-2">4.1 Medidas de Segurança</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Criptografia:</strong> Todos os dados sensíveis são criptografados</li>
                  <li><strong>Controle de acesso:</strong> Acesso restrito apenas a pessoal autorizado</li>
                  <li><strong>Monitoramento:</strong> Sistemas de detecção de invasões e atividades suspeitas</li>
                  <li><strong>Backups seguros:</strong> Backup regular dos dados em ambientes protegidos</li>
                  <li><strong>Auditoria:</strong> Revisões regulares de segurança e conformidade</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">4.2 Tratamento de Dados Sensíveis</h3>
                <p className="text-gray-300">
                  Dados como CPF, documentos de identidade e informações financeiras recebem 
                  tratamento especial com criptografia avançada e acesso ultra-restrito. 
                  Estes dados são usados exclusivamente para verificação de identidade e 
                  processamento de pagamentos.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text-legal mb-4">5. Compartilhamento de Dados</h2>
            
            <div className="space-y-4">
              <p className="text-gray-300">
                <strong>5.1 Não vendemos dados:</strong> Nunca vendemos, alugamos ou comercializamos 
                seus dados pessoais com terceiros.
              </p>
              
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">5.2 Compartilhamento Limitado</h3>
                <p className="text-gray-300 mb-2">Compartilhamos dados apenas quando necessário:</p>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Com processadores de pagamento (dados financeiros mínimos necessários)</li>
                  <li>Com autoridades legais (quando exigido por lei)</li>
                  <li>Entre usuários da plataforma (apenas informações de perfil público)</li>
                  <li>Com prestadores de serviços técnicos (sob acordos rígidos de confidencialidade)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text-legal mb-4">6. Seus Direitos</h2>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-400 mb-2">6.1 Direitos Garantidos pela LGPD</h3>
              <ul className="text-gray-300 space-y-1 list-disc list-inside">
                <li><strong>Acesso:</strong> Solicitar informações sobre como seus dados são tratados</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Exclusão:</strong> Solicitar a exclusão de dados desnecessários ou tratados indevidamente</li>
                <li><strong>Portabilidade:</strong> Solicitar a portabilidade de seus dados</li>
                <li><strong>Oposição:</strong> Opor-se ao tratamento baseado em legítimo interesse</li>
                <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
              </ul>
              
              <div className="glassmorphism rounded-lg p-4 border border-green-500/30 mt-4">
                <p className="text-green-300">
                  <strong>Como exercer seus direitos:</strong> Entre em contato através dos canais 
                  oficiais da plataforma. Responderemos em até 15 dias úteis.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">7. Retenção de Dados</h2>
            <div className="space-y-4">
              <p className="text-gray-300">
                <strong>7.1 Período de retenção:</strong> Mantemos seus dados apenas pelo tempo 
                necessário para as finalidades descritas ou conforme exigido por lei.
              </p>
              <p className="text-gray-300">
                <strong>7.2 Exclusão automática:</strong> Dados de usuários inativos por mais de 
                2 anos são automaticamente removidos, salvo obrigações legais.
              </p>
              <p className="text-gray-300">
                <strong>7.3 Dados obrigatórios:</strong> Alguns dados podem ser mantidos por 
                períodos legais específicos mesmo após o encerramento da conta.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">8. Cookies e Tecnologias Similares</h2>
            <div className="space-y-4">
              <p className="text-gray-300">
                <strong>8.1 Cookies essenciais:</strong> Necessários para o funcionamento básico da plataforma.
              </p>
              <p className="text-gray-300">
                <strong>8.2 Cookies de análise:</strong> Ajudam a entender como os usuários interagem 
                com a plataforma (podem ser desabilitados).
              </p>
              <p className="text-gray-300">
                <strong>8.3 Controle:</strong> Você pode gerenciar cookies através das configurações 
                do seu navegador.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">9. Sistema GPS e Geolocalização</h2>
            <div className="space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  🗺️ Como protegemos sua localização
                </h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong>• Consentimento explícito:</strong> GPS ativado apenas com sua autorização</p>
                  <p><strong>• Finalidade específica:</strong> Localização usada para conectar com profissionais próximos</p>
                  <p><strong>• Não compartilhamento:</strong> Dados nunca vendidos ou cedidos a terceiros</p>
                  <p><strong>• Controle total:</strong> Rastreamento pode ser desativado a qualquer momento</p>
                </div>
              </div>
              
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  🛡️ Licenças de Software Utilizadas
                </h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong>• Leaflet.js:</strong> BSD-2-Clause (uso comercial permitido)</p>
                  <p><strong>• OpenStreetMap:</strong> Open Database License (dados colaborativos)</p>
                  <p><strong>• Geolocalização HTML5:</strong> Padrão W3C (API nativa dos navegadores)</p>
                  <p className="text-green-400">✅ Todas as tecnologias são licenciadas e seguras para uso comercial</p>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                <p className="text-orange-400 font-medium text-sm">
                  ⚠️ <strong>Importante:</strong> A plataforma não se responsabiliza por uso inadequado das informações de localização por profissionais. Denuncie comportamentos suspeitos.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">10. Alterações na Política</h2>
            <p className="text-gray-300 leading-relaxed">
              Esta política pode ser atualizada periodicamente. Mudanças significativas serão 
              comunicadas através da plataforma. Recomendamos revisar esta política regularmente 
              para se manter informado sobre como protegemos seus dados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold neon-text mb-4">11. Contato e DPO</h2>
            <div className="glassmorphism rounded-lg p-4 border border-cyan-500/30">
              <p className="text-gray-300 mb-2">
                Para questões sobre privacidade, exercício de direitos ou dúvidas sobre esta política:
              </p>
              <ul className="text-cyan-300 space-y-1">
                <li><strong>Canal oficial:</strong> Através da plataforma</li>
                <li><strong>Encarregado de Dados (DPO):</strong> Disponível para questões específicas sobre LGPD</li>
                <li><strong>Tempo de resposta:</strong> Até 15 dias úteis</li>
              </ul>
            </div>
          </section>

          <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-600">
            <p>Última atualização: 22 de Julho de 2025 (adicionada seção GPS)</p>
            <p>Orbitrum Connect - Compromisso com sua privacidade e proteção GPS</p>
          </div>
        </div>
      </div>
    </div>
  );
}