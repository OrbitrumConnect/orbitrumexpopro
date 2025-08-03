import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Shield, Award, Scale, FileCheck } from "lucide-react";
import { Link } from "wouter";

export default function Certificacoes() {
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
          <Shield className="inline h-10 w-10 mr-3" />
          Certificações e Conformidade Legal
        </h1>
        
        <div className="glassmorphism rounded-xl p-8 space-y-8">
          
          {/* Conformidade Legal */}
          <section>
            <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 mr-3 text-[var(--neon-cyan)]" />
              <h2 className="text-2xl font-semibold neon-text-legal">1. Conformidade com a Legislação Brasileira</h2>
            </div>
            <div className="glassmorphism rounded-lg p-6 border border-cyan-500/30">
              <h3 className="text-lg font-semibold text-[var(--neon-cyan)] mb-3">Lei Geral de Proteção de Dados (LGPD)</h3>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li><strong>Lei nº 13.709/2018:</strong> Cumprimento integral das diretrizes de proteção de dados pessoais</li>
                <li><strong>Consentimento Expresso:</strong> Coleta de dados apenas com autorização prévia do usuário</li>
                <li><strong>Direitos dos Titulares:</strong> Acesso, correção, exclusão e portabilidade de dados garantidos</li>
                <li><strong>Segurança:</strong> Implementação de medidas técnicas e organizacionais adequadas</li>
              </ul>
            </div>
          </section>

          {/* Certificações Profissionais */}
          <section>
            <div className="flex items-center mb-4">
              <Award className="h-6 w-6 mr-3 text-yellow-400" />
              <h2 className="text-2xl font-semibold neon-text-legal">2. Certificações Profissionais Obrigatórias</h2>
            </div>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4 border border-yellow-500/30">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">2.1 Áreas Regulamentadas pelo CREA/CAU</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Engenheiros:</strong> Registro no CREA obrigatório (Lei 5.194/66)</li>
                  <li><strong>Arquitetos:</strong> Registro no CAU obrigatório (Lei 12.378/10)</li>
                  <li><strong>Técnicos em Edificações:</strong> Registro no CREA necessário</li>
                  <li><strong>Eletricistas (alta tensão):</strong> Curso NR-10 e certificação CREA</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-green-500/30">
                <h3 className="text-lg font-semibold text-green-400 mb-2">2.2 Áreas da Saúde</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Enfermeiros:</strong> Registro no COREN obrigatório</li>
                  <li><strong>Técnicos em Enfermagem:</strong> Registro no COREN necessário</li>
                  <li><strong>Fisioterapeutas:</strong> Registro no CREFITO obrigatório</li>
                  <li><strong>Cuidadores de Idosos:</strong> Curso específico certificado</li>
                </ul>
              </div>

              <div className="glassmorphism rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">2.3 Áreas de Segurança</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Vigilantes:</strong> Curso de Formação de Vigilantes (CFV) obrigatório</li>
                  <li><strong>Porteiros:</strong> Curso de Porteiro Predial certificado</li>
                  <li><strong>Técnicos em Segurança:</strong> Registro no MTE necessário</li>
                  <li><strong>Trabalho em Altura:</strong> Curso NR-35 obrigatório</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Documentação Obrigatória */}
          <section>
            <div className="flex items-center mb-4">
              <FileCheck className="h-6 w-6 mr-3 text-blue-400" />
              <h2 className="text-2xl font-semibold neon-text-legal">3. Documentação Obrigatória para Profissionais</h2>
            </div>
            
            <div className="glassmorphism rounded-lg p-6 border border-blue-500/30">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">Documentos Pessoais</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>CPF válido</li>
                    <li>RG ou CNH</li>
                    <li>Comprovante de residência atualizado</li>
                    <li>Foto 3x4 recente</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">Documentos Profissionais</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>Certificados de cursos técnicos</li>
                    <li>Diplomas de graduação/pós</li>
                    <li>Registros em conselhos profissionais</li>
                    <li>Certidões de antecedentes criminais</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Responsabilidades da Plataforma */}
          <section>
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 mr-3 text-red-400" />
              <h2 className="text-2xl font-semibold neon-text-legal">4. Responsabilidades da Orbitrum Connect</h2>
            </div>
            
            <div className="glassmorphism rounded-lg p-6 border border-red-500/30">
              <h3 className="text-lg font-semibold text-red-400 mb-3">Nossa Função</h3>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li><strong>Intermediação:</strong> Conectamos clientes e profissionais, mas não prestamos serviços diretamente</li>
                <li><strong>Verificação:</strong> Validamos documentos e certificações antes de aprovar profissionais</li>
                <li><strong>Compliance:</strong> Garantimos que apenas profissionais habilitados atendam em suas áreas</li>
                <li><strong>Segurança:</strong> Protegemos dados pessoais conforme LGPD e melhores práticas</li>
                <li><strong>Transparência:</strong> Fornecemos informações claras sobre qualificações de cada profissional</li>
              </ul>
            </div>
            
            <div className="bg-amber-900/20 border border-amber-500/50 rounded-lg p-4 mt-4">
              <p className="text-amber-200 text-sm">
                <strong>⚠️ IMPORTANTE:</strong> A Orbitrum Connect atua exclusivamente como intermediadora. 
                A responsabilidade pela execução dos serviços é do profissional contratado, que deve possuir 
                todas as certificações exigidas por lei para sua área de atuação.
              </p>
            </div>
          </section>

          {/* Contato para Dúvidas */}
          <section>
            <div className="glassmorphism rounded-lg p-6 border border-cyan-500/30 text-center">
              <h3 className="text-lg font-semibold text-[var(--neon-cyan)] mb-3">Dúvidas sobre Certificações?</h3>
              <p className="text-gray-300 mb-4">
                Entre em contato conosco para esclarecimentos sobre documentação e certificações necessárias.
              </p>
              <div className="space-x-4">
                <Link href="mailto:certificacoes@orbitrum.com.br">
                  <Button className="neon-button">
                    Contato Certificações
                  </Button>
                </Link>
                <Link href="/regras">
                  <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                    Ver Regras Completas
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}