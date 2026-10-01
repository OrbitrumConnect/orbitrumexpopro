import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Briefcase, Upload, Mail, Shield, Star, Eye, EyeOff, Gift } from 'lucide-react';
import { useLocation } from 'wouter';

type UserType = 'user' | 'professional';

interface FormData {
  tipo: UserType;
  nomeCompleto: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  telefone: string;
  cpf: string;
  // Campos específicos para profissionais
  categoria?: string;
  especialidade?: string;
  descricaoServico?: string;
  precoBase?: string;
  pixChave?: string;
}

export default function Cadastro() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'type' | 'form' | 'documents' | 'success'>('type');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [referralInfo, setReferralInfo] = useState<any>(null);
  
  // Detectar parâmetros de referral da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const bonusType = urlParams.get('bonus');
    const source = urlParams.get('source');
    
    if (refCode) {
      
      // Validar o código de referral
      fetch(`/api/referral/validate/${refCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setReferralInfo({
              code: refCode,
              bonusType: data.bonusType || bonusType,
              source,
              referrer: data.referrer,
              message: data.message
            });
            
            toast({
              title: "🎉 Link de Referral Válido!",
              description: data.message,
              variant: "default",
            });
          }
        })
        .catch(error => {
          console.error('Erro ao validar código de referral:', error);
        });
    }
  }, []);
  
  // Mapeamento completo de categorias e especialidades baseado nos 200+ profissionais
  const categorySpecialties = {
    'casa-construcao': {
      name: '🏠 Casa e Construção',
      specialties: [
        'Pintor', 'Pedreiro', 'Eletricista', 'Encanador', 'Marceneiro', 
        'Serralheiro', 'Vidraceiro', 'Telhadista', 'Azulejista', 'Gesseiro',
        'Carpinteiro', 'Soldador', 'Impermeabilizador', 'Paisagista', 'Arquiteto'
      ]
    },
    'cuidados-pessoais': {
      name: '✨ Cuidados Pessoais',
      specialties: [
        'Cabeleireiro', 'Manicure', 'Pedicure', 'Esteticista', 'Massagista',
        'Barbeiro', 'Maquiador', 'Depiladora', 'Designer de Sobrancelhas', 'Terapeuta',
        'Personal Trainer', 'Nutricionista', 'Fisioterapeuta'
      ]
    },
    'servicos-domesticos': {
      name: '🏡 Serviços Domésticos',
      specialties: [
        'Diarista', 'Faxineira', 'Passadeira', 'Cozinheira', 'Babá',
        'Cuidadora de Idosos', 'Jardineiro', 'Motorista', 'Segurança', 'Porteiro',
        'Zelador', 'Lavadeira', 'Organizadora'
      ]
    },
    'tecnologia': {
      name: '💻 Tecnologia',
      specialties: [
        'Desenvolvedor Web', 'Desenvolvedor Mobile', 'Designer UX/UI', 'Analista de Sistemas',
        'Técnico em Informática', 'Especialista em Redes', 'Programador', 'Webdesigner',
        'Analista de Dados', 'DevOps', 'Cybersecurity', 'Game Developer', 'AI Specialist'
      ]
    },
    'educacao': {
      name: '📚 Educação',
      specialties: [
        'Professor Particular', 'Tutor', 'Instrutor de Idiomas', 'Coach',
        'Professor de Música', 'Professor de Arte', 'Pedagogo', 'Psicopedagogo',
        'Instrutor de Informática', 'Professor de Dança', 'Instrutor de Yoga'
      ]
    },
    'saude-bem-estar': {
      name: '❤️ Saúde e Bem-estar',
      specialties: [
        'Enfermeiro', 'Técnico em Enfermagem', 'Farmacêutico', 'Psicólogo',
        'Dentista', 'Veterinário', 'Acupunturista', 'Quiropraxista',
        'Biomédico', 'Radiologista', 'Fonoaudiólogo'
      ]
    },
    'transporte-logistica': {
      name: '🚛 Transporte e Logística',
      specialties: [
        'Motorista de Uber', 'Motorista de Caminhão', 'Entregador', 'Motoboy',
        'Taxista', 'Motorista Particular', 'Operador de Empilhadeira', 'Despachante',
        'Corretor de Seguros', 'Agente de Cargas'
      ]
    },
    'eventos-entretenimento': {
      name: '🎵 Eventos e Entretenimento',
      specialties: [
        'DJ', 'Músico', 'Cantor', 'Fotógrafo', 'Videomaker', 'Animador de Festas',
        'Mágico', 'Palhaço', 'Decorador', 'Cerimonialista', 'Garçom', 'Bartender',
        'Sonoplasta', 'Iluminador'
      ]
    },
    'alimentacao': {
      name: '👨‍🍳 Alimentação',
      specialties: [
        'Chef de Cozinha', 'Cozinheiro', 'Confeiteiro', 'Padeiro', 'Salgadeiro',
        'Doceira', 'Pizzaiolo', 'Churrasqueiro', 'Barista', 'Sommelier',
        'Nutricionista', 'Garçom', 'Atendente de Lanchonete'
      ]
    },
    'juridico-consultoria': {
      name: '⚖️ Jurídico e Consultoria',
      specialties: [
        'Advogado', 'Consultor Jurídico', 'Contador', 'Consultor Financeiro',
        'Consultor de RH', 'Consultor de Marketing', 'Consultor Empresarial',
        'Assessor de Imprensa', 'Tradutor', 'Revisor', 'Redator'
      ]
    }
  };
  
  const [formData, setFormData] = useState<FormData>({
    tipo: 'user',
    nomeCompleto: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    cpf: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    fotoRosto: null as File | null,
    comprovanteResidencia: null as File | null,
    fotoDocumento: null as File | null,
    portfolio: [] as File[],
  });

  const handleUserTypeSelect = (tipo: UserType) => {
    setFormData(prev => ({ ...prev, tipo }));
    setStep('form');
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: string, file: File | File[]) => {
    setUploadedFiles(prev => ({ ...prev, [field]: file }));
  };

  const validateForm = () => {
    if (!formData.nomeCompleto || !formData.email || !formData.senha || !formData.telefone || !formData.cpf) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return false;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast({
        title: "Senhas não coincidem",
        description: "A confirmação de senha deve ser igual à senha",
        variant: "destructive",
      });
      return false;
    }

    if (formData.senha.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return false;
    }

    if (formData.tipo === 'professional') {
      if (!formData.categoria || !formData.especialidade || !formData.descricaoServico || !formData.precoBase || !formData.pixChave) {
        toast({
          title: "Campos profissionais obrigatórios",
          description: "Preencha todos os campos específicos para profissionais",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleFormSubmit = () => {
    if (!validateForm()) return;
    setStep('documents');
  };

  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      
      // Validação básica
      if (!formData.nomeCompleto || !formData.email || !formData.senha || !formData.cpf) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      // Se tem referral, usar sistema de referral
      if (referralInfo && referralInfo.code) {
        const response = await fetch('/api/referral/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referralCode: referralInfo.code,
            email: formData.email,
            userType: formData.tipo === 'user' ? 'client' : 'professional',
            userData: formData
          }),
        });

        const result = await response.json();

        if (result.success) {
          setStep('success');
          toast({
            title: "🎉 Conta criada com bônus!",
            description: result.message,
          });
          
          // Se criou código próprio, mostrar
          if (result.referralCode) {
          }
        } else {
          toast({
            title: "Erro no cadastro",
            description: result.message || "Tente novamente",
            variant: "destructive",
          });
        }
      } else {
        // Cadastro normal sem referral
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nomeCompleto: formData.nomeCompleto,
            email: formData.email,
            senha: formData.senha,
            telefone: formData.telefone,
            cpf: formData.cpf,
            tipo: formData.tipo
          }),
        });

        const result = await response.json();

        if (result.success) {
          setStep('success');
          toast({
            title: "Conta criada!",
            description: result.message,
          });
        } else {
          toast({
            title: "Erro no cadastro",
            description: result.message || "Tente novamente",
            variant: "destructive",
          });
        }
      }

    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'type') {
      setLocation('/');
    } else if (step === 'form') {
      setStep('type');
    } else if (step === 'documents') {
      setStep('form');
    } else if (step === 'success') {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-3 sm:p-6">
      <div className="max-w-3xl mx-auto scale-[0.83]">
        {/* Header com botão voltar */}
        <div className="flex items-center mb-4 sm:mb-8">
          <Button
            variant="ghost"
            onClick={goBack}
            className="text-cyan-400 hover:text-cyan-300 p-1 sm:p-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            {step === 'type' ? 'Início' : 'Voltar'}
          </Button>
        </div>

        {/* Título */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 sm:mb-4">
            Criar Conta no Orbitrum
          </h1>
          
          {/* Banner de Referral */}
          {referralInfo && (
            <div className="mb-4 p-3 rounded-lg glassmorphism border border-green-500/30 bg-green-500/10">
              <div className="flex items-center justify-center gap-2 text-green-400">
                <Gift className="w-5 h-5" />
                <span className="font-semibold">Bônus Especial Ativado!</span>
              </div>
              <p className="text-sm text-green-300 mt-1">
                {referralInfo.message}
              </p>
              {referralInfo.bonusType === 'max30days' && (
                <div className="text-xs text-green-400 mt-1 font-bold">
                  🎁 30 dias GRÁTIS do Plano Max + 50.000 tokens iniciais
                </div>
              )}
            </div>
          )}
          
          <p className="text-gray-400 text-sm sm:text-lg">
            {step === 'type' && 'Escolha o tipo de conta que melhor se adequa a você'}
            {step === 'form' && `Dados ${formData.tipo === 'user' ? 'pessoais' : 'profissionais'}`}
            {step === 'documents' && 'Documentos de verificação'}
            {step === 'success' && 'Conta criada com sucesso!'}
          </p>
        </div>

        {/* Etapa 1: Seleção do tipo de usuário */}
        {step === 'type' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-2xl mx-auto">
            <Card
              className="cursor-pointer transition-all duration-300 hover:scale-105 bg-gray-900/50 border-gray-700 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20"
              onClick={() => handleUserTypeSelect('user')}
            >
              <CardContent className="p-4 sm:p-8 text-center">
                <User className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 text-blue-400" />
                <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Sou Usuário</h3>
                <p className="text-gray-400 mb-3 sm:mb-6 text-sm sm:text-base">
                  Quero encontrar profissionais, jogar e acumular tokens
                </p>
                <ul className="text-xs sm:text-sm text-gray-300 space-y-1 sm:space-y-2 text-left">
                  <li>• Buscar profissionais qualificados</li>
                  <li>• Jogar mini-games e ganhar tokens</li>
                  <li>• Formar equipes de profissionais</li>
                  <li>• Acesso a todas as funcionalidades</li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all duration-300 hover:scale-105 bg-gray-900/50 border-gray-700 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20"
              onClick={() => handleUserTypeSelect('professional')}
            >
              <CardContent className="p-4 sm:p-8 text-center">
                <Briefcase className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 text-green-400" />
                <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Sou Profissional</h3>
                <p className="text-gray-400 mb-3 sm:mb-6 text-sm sm:text-base">
                  Quero oferecer meus serviços e receber pagamentos
                </p>
                <ul className="text-xs sm:text-sm text-gray-300 space-y-1 sm:space-y-2 text-left">
                  <li>• Criar perfil profissional completo</li>
                  <li>• Receber tokens por serviços prestados</li>
                  <li>• Sacar tokens via PIX</li>
                  <li>• Validação de documentos obrigatória</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Etapa 2: Formulário de dados */}
        {step === 'form' && (
          <Card className="bg-gray-900/50 border-gray-700 max-w-2xl mx-auto">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-cyan-400 text-lg sm:text-xl">
                {formData.tipo === 'user' ? 'Dados Pessoais' : 'Dados Profissionais'}
              </CardTitle>
              <CardDescription className="text-sm">
                {formData.tipo === 'user' 
                  ? 'Preencha seus dados para criar a conta de usuário'
                  : 'Preencha seus dados profissionais e informações de serviço'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                  <Input
                    id="nomeCompleto"
                    value={formData.nomeCompleto}
                    onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                    className="bg-gray-800 border-gray-600"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-gray-800 border-gray-600"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? "text" : "password"}
                      value={formData.senha}
                      onChange={(e) => handleInputChange('senha', e.target.value)}
                      className="bg-gray-800 border-gray-600 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirmarSenha"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmarSenha}
                      onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                      className="bg-gray-800 border-gray-600 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone (WhatsApp) *</Label>
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    className="bg-gray-800 border-gray-600"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    className="bg-gray-800 border-gray-600"
                    required
                  />
                </div>
              </div>

              {/* Seção de Documentos para Cashback - Para usuários também */}
              {formData.tipo === 'user' && (
                <div className="border-t border-amber-500/30 pt-6 space-y-4">
                  <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-lg p-4 space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                          <Star className="w-4 h-4 text-amber-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-amber-400 font-semibold text-sm mb-2">
                          💰 Documentos para Cashback Premium
                        </h4>
                        <p className="text-gray-300 text-xs mb-3">
                          Para participar do sistema de cashback e saques dos seus ganhos com jogos e tokens, você precisará enviar documentos de verificação. 
                          <span className="text-amber-400 font-medium"> Isso pode ser feito depois no seu dashboard.</span>
                        </p>
                        
                        <div className="bg-gray-800/50 rounded-md p-3 mb-3">
                          <p className="text-xs text-gray-400 mb-2 font-medium">Documentos necessários para cashback:</p>
                          <ul className="text-xs text-gray-300 space-y-1">
                            <li>• <span className="text-cyan-400">Selfie clara</span> para verificação de identidade</li>
                            <li>• <span className="text-cyan-400">RG ou CNH</span> (frente e verso)</li>
                            <li>• <span className="text-cyan-400">Comprovante de residência</span> atualizado</li>
                            <li>• <span className="text-cyan-400">Chave PIX válida</span> para recebimento</li>
                          </ul>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-3">
                          <p className="text-xs text-amber-400 font-medium mb-1">⚠️ Importante para Planos Pagos</p>
                          <p className="text-xs text-gray-400">
                            Ao aderir aos planos Básico, Standard, Pro ou Max, será <span className="text-amber-400 font-medium">obrigatório</span> completar 
                            a verificação de documentos no seu dashboard para ativar os benefícios de cashback e saques.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Campos específicos para profissionais */}
              {formData.tipo === 'professional' && (
                <div className="border-t border-gray-700 pt-3 sm:pt-6 space-y-3 sm:space-y-6">
                  <h3 className="text-base sm:text-lg font-semibold text-cyan-400">Informações Profissionais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria Profissional *</Label>
                      <Select onValueChange={(value) => {
                        handleInputChange('categoria', value);
                        setSelectedCategory(value);
                        handleInputChange('especialidade', ''); // Reset especialidade
                      }}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 border-2 hover:border-cyan-400 transition-all">
                          <SelectValue placeholder="🎯 Selecione sua área principal" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900/95 border-gray-600 backdrop-blur-sm">
                          {Object.entries(categorySpecialties).map(([key, category]) => (
                            <SelectItem 
                              key={key} 
                              value={key}
                              className="hover:bg-cyan-400/10 focus:bg-cyan-400/20 cursor-pointer py-3"
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCategory && (
                      <div className="space-y-2">
                        <Label htmlFor="especialidade">Especialidade *</Label>
                        <Select onValueChange={(value) => handleInputChange('especialidade', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-600 border-2 hover:border-cyan-400 transition-all">
                            <SelectValue placeholder="⭐ Escolha sua especialidade" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900/95 border-gray-600 backdrop-blur-sm max-h-60">
                            {categorySpecialties[selectedCategory as keyof typeof categorySpecialties]?.specialties.map((specialty) => (
                              <SelectItem 
                                key={specialty} 
                                value={specialty}
                                className="hover:bg-cyan-400/10 focus:bg-cyan-400/20 cursor-pointer py-2"
                              >
                                {specialty}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-cyan-400/70">
                          💡 {categorySpecialties[selectedCategory as keyof typeof categorySpecialties]?.specialties.length}+ especialidades disponíveis
                        </p>
                      </div>
                    )}

                    {!selectedCategory && (
                      <div className="md:col-span-1"></div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="precoBase">Preço Base (R$/hora) *</Label>
                      <Input
                        id="precoBase"
                        type="number"
                        placeholder="45"
                        value={formData.precoBase}
                        onChange={(e) => handleInputChange('precoBase', e.target.value)}
                        className="bg-gray-800 border-gray-600 border-2 hover:border-cyan-400 transition-all"
                        required
                      />
                      <p className="text-xs text-yellow-400/80">
                        💰 Valor referencial - negociação direta fora da plataforma
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pixChave">Chave PIX *</Label>
                      <Input
                        id="pixChave"
                        placeholder="CPF, email ou telefone"
                        value={formData.pixChave}
                        onChange={(e) => handleInputChange('pixChave', e.target.value)}
                        className="bg-gray-800 border-gray-600 border-2 hover:border-cyan-400 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-full">
                    <Label htmlFor="descricaoServico">Descrição do Serviço *</Label>
                    <Textarea
                      id="descricaoServico"
                      placeholder={selectedCategory && formData.especialidade 
                        ? `Descreva sua experiência como ${formData.especialidade}, diferenciais, tempo de atuação...`
                        : "Descreva seus serviços, experiência e diferenciais..."
                      }
                      value={formData.descricaoServico}
                      onChange={(e) => handleInputChange('descricaoServico', e.target.value)}
                      className="bg-gray-800 border-gray-600 border-2 hover:border-cyan-400 transition-all min-h-16 sm:min-h-24 text-sm"
                      required
                    />
                    {selectedCategory && formData.especialidade && (
                      <p className="text-xs text-cyan-400/70">
                        🚀 Especialista em {formData.especialidade} na área de {categorySpecialties[selectedCategory as keyof typeof categorySpecialties]?.name}
                      </p>
                    )}
                  </div>

                  {/* Seção de Documentos para Cashback - Opcional no cadastro */}
                  <div className="col-span-full border-t border-amber-500/30 pt-6 mt-6">
                    <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-lg p-4 space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                            <Star className="w-4 h-4 text-amber-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-amber-400 font-semibold text-sm mb-2">
                            💰 Documentos para Cashback Premium
                          </h4>
                          <p className="text-gray-300 text-xs mb-3">
                            Para participar do sistema de cashback e saques, você precisará enviar documentos de verificação. 
                            <span className="text-amber-400 font-medium"> Isso pode ser feito agora ou depois no seu dashboard.</span>
                          </p>
                          
                          <div className="bg-gray-800/50 rounded-md p-3 mb-3">
                            <p className="text-xs text-gray-400 mb-2 font-medium">Documentos necessários para cashback:</p>
                            <ul className="text-xs text-gray-300 space-y-1">
                              <li>• <span className="text-cyan-400">Selfie clara</span> para verificação de identidade</li>
                              <li>• <span className="text-cyan-400">RG ou CNH</span> (frente e verso)</li>
                              <li>• <span className="text-cyan-400">Comprovante de residência</span> atualizado</li>
                              <li>• <span className="text-cyan-400">Comprovante PIX</span> da chave informada</li>
                            </ul>
                          </div>

                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-3">
                            <p className="text-xs text-amber-400 font-medium mb-1">⚠️ Importante para Planos Pagos</p>
                            <p className="text-xs text-gray-400">
                              Ao aderir aos planos Básico, Standard, Pro ou Max, será <span className="text-amber-400 font-medium">obrigatório</span> completar 
                              a verificação de documentos no seu dashboard para ativar os benefícios de cashback.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <div className="text-xs text-gray-400">
                  💡 Documentos de cashback podem ser enviados depois no dashboard
                </div>
                
                <Button
                  onClick={handleFormSubmit}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold px-4 sm:px-8 py-2 text-sm sm:text-base"
                >
                  {formData.tipo === 'professional' ? 'Pular Documentos' : 'Pular Documentos'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 3: Upload de documentos */}
        {step === 'documents' && (
          <Card className="bg-gray-900/50 border-gray-700 max-w-2xl mx-auto">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-cyan-400 flex items-center text-lg sm:text-xl">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Documentos de Verificação
              </CardTitle>
              <CardDescription className="text-sm">
                Para sua segurança e compliance com LGPD, precisamos validar sua identidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Upload obrigatórios */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-yellow-400 text-sm sm:text-base">Documentos Obrigatórios</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 sm:p-6 text-center hover:border-cyan-400 transition-colors">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-gray-400" />
                    <p className="text-xs sm:text-sm font-medium mb-1">Foto do Rosto</p>
                    <p className="text-xs text-gray-400 mb-2 sm:mb-3">Selfie clara para identificação</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('fotoRosto', e.target.files[0])}
                      className="text-xs"
                    />
                  </div>

                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 sm:p-6 text-center hover:border-cyan-400 transition-colors">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-gray-400" />
                    <p className="text-xs sm:text-sm font-medium mb-1">Documento com Foto</p>
                    <p className="text-xs text-gray-400 mb-2 sm:mb-3">RG ou CNH (frente e verso)</p>
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('fotoDocumento', e.target.files[0])}
                      className="text-xs"
                    />
                  </div>

                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 sm:p-6 text-center hover:border-cyan-400 transition-colors">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-gray-400" />
                    <p className="text-xs sm:text-sm font-medium mb-1">Comprovante de Residência</p>
                    <p className="text-xs text-gray-400 mb-2 sm:mb-3">Conta de luz, água ou telefone</p>
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('comprovanteResidencia', e.target.files[0])}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Upload opcional para profissionais */}
              {formData.tipo === 'professional' && (
                <div className="space-y-3 sm:space-y-4 border-t border-gray-700 pt-3 sm:pt-6">
                  <h3 className="font-semibold text-green-400 text-sm sm:text-base">Portfolio (Opcional)</h3>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 sm:p-6 text-center hover:border-cyan-400 transition-colors">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-gray-400" />
                    <p className="text-xs sm:text-sm font-medium mb-1">Fotos de Trabalhos Anteriores</p>
                    <p className="text-xs text-gray-400 mb-2 sm:mb-3">Até 5 imagens dos seus melhores trabalhos</p>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => e.target.files && handleFileUpload('portfolio', Array.from(e.target.files))}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-400 mb-1">Verificação por Email</p>
                    <p className="text-gray-300">
                      Após enviar o cadastro, você receberá um email de confirmação. 
                      Clique no link para ativar sua conta e fazer login.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-black font-semibold px-4 sm:px-8 py-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Finalizar Cadastro
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 4: Sucesso */}
        {step === 'success' && (
          <div className="text-center max-w-2xl mx-auto">
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-8 mb-8">
              <Mail className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-400 mb-4">Cadastro Enviado com Sucesso!</h2>
              <p className="text-gray-300 mb-6">
                Enviamos um email de confirmação para <strong>{formData.email}</strong>
              </p>
              
              <div className="space-y-4 text-left bg-gray-800/50 rounded-lg p-6">
                <h3 className="font-semibold text-cyan-400">Próximos Passos:</h3>
                <ol className="space-y-2 text-sm text-gray-300">
                  <li>1. Verifique sua caixa de entrada (e spam)</li>
                  <li>2. Clique no link de confirmação no email</li>
                  <li>3. Faça login na plataforma</li>
                  {formData.tipo === 'professional' && (
                    <li>4. Aguarde a validação dos documentos (até 48h)</li>
                  )}
                  <li>{formData.tipo === 'professional' ? '5' : '4'}. Comece a usar o Orbtrum Connect!</li>
                </ol>
              </div>
            </div>

            <Button
              onClick={() => setLocation('/')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold px-4 sm:px-8 py-2 text-sm sm:text-base"
            >
              Voltar ao Início
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}