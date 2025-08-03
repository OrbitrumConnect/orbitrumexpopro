import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Edit3, MapPin, Phone, Star, Upload, User, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Schema para validação do perfil
const profileSchema = z.object({
  displayName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  bio: z.string().max(500, "Bio deve ter no máximo 500 caracteres").optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  profession: z.string().optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  hourlyRate: z.number().min(0).optional(),
  availability: z.enum(['disponivel', 'ocupado', 'offline']).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditorProps {
  userType: 'client' | 'professional';
}

const PROFESSION_OPTIONS = [
  // CASA E CONSTRUÇÃO
  'Pedreiro', 'Pintor', 'Eletricista', 'Encanador', 'Marceneiro', 'Carpinteiro', 'Serralheiro', 'Soldador',
  'Vidraceiro', 'Gesseiro', 'Azulejista', 'Telhadista', 'Tapeceiro', 'Piscineiro', 'Paisagista', 'Jardineiro',
  'Arquiteto', 'Engenheiro Civil', 'Decorador', 'Designer de Interiores', 'Empreiteiro', 'Mestre de Obras',
  
  // TECNOLOGIA E DIGITAL
  'Desenvolvedor Web', 'Desenvolvedor Mobile', 'Programador', 'Analista de Sistemas', 'DevOps', 'DBA',
  'UI/UX Designer', 'Designer Gráfico', 'Webdesigner', 'Social Media', 'Copywriter', 'Editor de Vídeo',
  'Fotógrafo Digital', 'Especialista em SEO', 'Consultor de TI', 'Suporte Técnico', 'Técnico em Informática',
  
  // SAÚDE E BEM-ESTAR
  'Médico', 'Enfermeiro', 'Fisioterapeuta', 'Nutricionista', 'Psicólogo', 'Dentista', 'Veterinário',
  'Farmacêutico', 'Terapeuta', 'Fonoaudiólogo', 'Terapia Ocupacional', 'Acupunturista', 'Quiropraxista',
  'Personal Trainer', 'Instrutor de Yoga', 'Instrutor de Pilates', 'Massagista', 'Reflexologista',
  
  // EDUCAÇÃO E ENSINO
  'Professor Particular', 'Tutor Acadêmico', 'Professor de Inglês', 'Professor de Espanhol', 'Professor de Música',
  'Instrutor de Dança', 'Coach', 'Mentor', 'Palestrante', 'Instrutor de Informática', 'Professor de Matemática',
  'Professor de Física', 'Professor de Química', 'Professor de Biologia', 'Professor de História',
  
  // BELEZA E ESTÉTICA
  'Cabeleireiro', 'Barbeiro', 'Manicure', 'Pedicure', 'Esteticista', 'Maquiador', 'Depiladora',
  'Massoterapeuta', 'Dermopigmentador', 'Extensionista de Cílios', 'Design de Sobrancelhas', 'Podólogo',
  'Terapeuta Capilar', 'Visagista', 'Nail Designer', 'Micropigmentador',
  
  // GASTRONOMIA E ALIMENTAÇÃO
  'Chef de Cozinha', 'Cozinheiro', 'Confeiteiro', 'Padeiro', 'Salgadeiro', 'Barista', 'Sommelier',
  'Bartender', 'Garçom', 'Nutricionista Esportiva', 'Personal Chef', 'Doceira', 'Chocolateiro',
  'Pizzaiolo', 'Churrasqueiro', 'Catering', 'Organizador de Eventos Gastronômicos',
  
  // JURÍDICO E CONSULTORIA
  'Advogado', 'Contador', 'Consultor Empresarial', 'Consultor Financeiro', 'Analista Financeiro',
  'Assessor de Investimentos', 'Consultor de Marketing', 'Consultor de RH', 'Auditor', 'Perito Judicial',
  'Despachante', 'Corretor de Imóveis', 'Corretor de Seguros', 'Planejador Financeiro',
  
  // SERVIÇOS DOMÉSTICOS
  'Diarista', 'Faxineira', 'Passadeira', 'Babá', 'Cuidadora de Idosos', 'Governanta', 'Copeira',
  'Organizadora', 'Personal Organizer', 'Lavadeira', 'Arrumadeira', 'Zeladora', 'Porteiro',
  
  // TRANSPORTE E LOGÍSTICA
  'Motorista Particular', 'Motorista de App', 'Entregador', 'Motoboy', 'Motorista de Caminhão',
  'Despachante', 'Corretor de Fretes', 'Operador Logístico', 'Transportador', 'Mudanceiro',
  
  // ARTE E ENTRETENIMENTO
  'Fotógrafo', 'Videomaker', 'Músico', 'DJ', 'Animador de Festas', 'Palhaço', 'Mágico',
  'Ator', 'Locutor', 'Apresentador', 'Artista Plástico', 'Tatuador', 'Ilustrador', 'Cartunista',
  
  // MODA E VESTUÁRIO
  'Costureiro', 'Alfaiate', 'Designer de Moda', 'Modelista', 'Sapateiro', 'Personal Stylist',
  'Consultor de Imagem', 'Vendedor de Roupas', 'Comerciante de Moda', 'Estilista',
  
  // ESPORTES E FITNESS
  'Personal Trainer', 'Professor de Educação Física', 'Instrutor de Natação', 'Técnico Esportivo',
  'Preparador Físico', 'Fisioterapeuta Esportiva', 'Nutricionista Esportiva', 'Massoterapeuta Esportiva',
  
  // VENDAS E COMÉRCIO
  'Vendedor', 'Representante Comercial', 'Consultor de Vendas', 'Promotor de Vendas', 'Atendente',
  'Caixa', 'Gerente de Loja', 'Supervisor de Vendas', 'Demonstrador', 'Merchandiser',
  
  // MANUTENÇÃO E REPAROS
  'Técnico em Eletrônicos', 'Técnico em Celulares', 'Técnico em Computadores', 'Chaveiro',
  'Sapateiro', 'Relojoeiro', 'Técnico em Eletrodomésticos', 'Mecânico', 'Funileiro', 'Pintor Automotivo',
  
  // CUIDADOS COM ANIMAIS
  'Veterinário', 'Tosador de Pets', 'Adestrador', 'Passeador de Cães', 'Pet Sitter', 'Banhista de Pets',
  'Auxiliar Veterinário', 'Especialista em Comportamento Animal', 'Criador de Animais',
  
  // SEGURANÇA E PROTEÇÃO
  'Segurança', 'Vigilante', 'Porteiro', 'Controlador de Acesso', 'Bombeiro Civil', 'Técnico em Segurança',
  'Instrutor de Autodefesa', 'Guarda-Vidas', 'Segurança Eletrônica',
  
  // AGRICULTURA E MEIO AMBIENTE
  'Agricultor', 'Jardineiro', 'Paisagista', 'Engenheiro Agrônomo', 'Técnico Agrícola', 'Floricultora',
  'Especialista em Permacultura', 'Consultor Ambiental', 'Técnico em Meio Ambiente',
  
  // OUTROS SERVIÇOS
  'Tradutor', 'Intérprete', 'Revisor de Textos', 'Redator', 'Jornalista', 'Editor', 'Bibliotecário',
  'Arquivista', 'Recepcionista', 'Secretária', 'Assistente Virtual', 'Telefonista', 'Operador de Telemarketing'
];

const SKILLS_OPTIONS = [
  'Programação', 'Design', 'Marketing', 'Vendas', 'Gestão', 'Educação',
  'Construção Civil', 'Elétrica', 'Encanamento', 'Pintura', 'Jardinagem',
  'Limpeza', 'Cozinha', 'Fotografia', 'Consultoria', 'Tradução'
];

export default function ProfileEditor({ userType }: ProfileEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar perfil atual
  const { data: profile, isLoading } = useQuery({
    queryKey: [`/api/profile/${userType}`, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${userType}/${user?.id}`);
      if (!response.ok && response.status !== 404) throw new Error('Erro ao carregar perfil');
      return response.ok ? response.json() : null;
    },
    enabled: !!user?.id
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || user?.username || '',
      bio: profile?.bio || '',
      phone: profile?.phone || '',
      city: profile?.city || '',
      state: profile?.state || '',
      profession: profile?.profession || '',
      experience: profile?.experience || '',
      skills: profile?.skills || [],
      hourlyRate: profile?.hourlyRate || 0,
      availability: profile?.availability || 'disponivel',
    },
  });

  // Mutation para salvar perfil
  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const profileData = {
        ...data,
        skills: selectedSkills,
        profileImage,
        userType
      };
      
      const response = await apiRequest('POST', `/api/profile/${userType}`, profileData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${userType}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/professionals'] });
      setIsOpen(false);
      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram salvas com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível atualizar seu perfil",
        variant: "destructive",
      });
    },
  });

  // Upload de imagem
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setUploadingImage(true);
    try {
      // Converter para base64 para demo (em produção usar storage real)
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImage(result);
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingImage(false);
      toast({
        title: "Erro no Upload",
        description: "Não foi possível fazer upload da imagem",
        variant: "destructive",
      });
    }
  };

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const onSubmit = (data: ProfileFormData) => {
    saveProfileMutation.mutate(data);
  };

  const completionPercentage = () => {
    const fields = [
      profile?.displayName,
      profile?.bio,
      profile?.phone,
      profile?.city,
      profileImage || profile?.profileImage,
      userType === 'professional' ? profile?.profession : true,
      userType === 'professional' ? profile?.hourlyRate : true,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-700 h-20 rounded-lg"></div>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="glassmorphism border-cyan-500/30 cursor-pointer hover:border-cyan-400/50 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profileImage || profile?.profileImage} />
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                    {(profile?.displayName || user?.username || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full w-6 h-6 flex items-center justify-center">
                  <Edit3 className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-white font-medium">
                  {profile?.displayName || user?.username || 'Completar Perfil'}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-600 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${completionPercentage()}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{completionPercentage()}%</span>
                </div>
              </div>
              
              {userType === 'professional' && profile?.profession && (
                <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                  {profile.profession}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="glassmorphism max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-cyan-400 flex items-center gap-2">
            <User className="w-5 h-5" />
            {userType === 'professional' ? 'Perfil Profissional' : 'Perfil do Cliente'}
          </DialogTitle>
          <DialogDescription>
            Complete seu perfil para {userType === 'professional' ? 'aparecer nas buscas e receber mais solicitações' : 'uma melhor experiência na plataforma'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Upload de Foto */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileImage || profile?.profileImage} />
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-2xl">
                    {(profile?.displayName || user?.username || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              
              <p className="text-xs text-gray-400 text-center">
                {userType === 'professional' 
                  ? 'Foto profissional aumenta suas chances de ser contratado'
                  : 'Adicione uma foto para personalizar seu perfil'
                }
              </p>
            </div>

            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input {...field} className="glassmorphism" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(11) 99999-9999" className="glassmorphism" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Localização */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} className="glassmorphism" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input {...field} className="glassmorphism" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {userType === 'professional' ? 'Apresentação Profissional' : 'Sobre Você'}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      className="glassmorphism min-h-20" 
                      placeholder={
                        userType === 'professional' 
                          ? 'Descreva sua experiência e especialidades...'
                          : 'Conte um pouco sobre você...'
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos específicos do profissional */}
            {userType === 'professional' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria Profissional *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="glassmorphism">
                              <SelectValue placeholder="Selecione sua área" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            {PROFESSION_OPTIONS.map(profession => (
                              <SelectItem key={profession} value={profession}>{profession}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor por Hora (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0" 
                            step="0.01"
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            className="glassmorphism" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Habilidades */}
                <div>
                  <Label className="text-sm font-medium">Habilidades</Label>
                  <div className="mt-2 space-y-3">
                    <Select onValueChange={(value) => addSkill(value)}>
                      <SelectTrigger className="glassmorphism">
                        <SelectValue placeholder="Adicionar habilidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {SKILLS_OPTIONS.filter(skill => !selectedSkills.includes(skill)).map(skill => (
                          <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedSkills.map(skill => (
                          <Badge 
                            key={skill} 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-red-500/20"
                            onClick={() => removeSkill(skill)}
                          >
                            {skill} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status de Disponibilidade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="glassmorphism">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="ocupado">Ocupado</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={saveProfileMutation.isPending}
                className="flex-1 neon-button"
              >
                {saveProfileMutation.isPending ? 'Salvando...' : 'Salvar Perfil'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}