import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star, Home, Sparkles, Monitor, BookOpen, Heart, Truck, Music, ChefHat, Scale } from 'lucide-react';
import type { ProfessionalCategory } from '@shared/schema';

const iconMap = {
  Home,
  Sparkles,
  Monitor,
  BookOpen,
  Heart,
  Truck,
  Music,
  ChefHat,
  Scale,
};

export default function CadastroProfissional() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<ProfessionalCategory | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    cpf: '',
    cep: '',
    address: '',
    pixKey: '',
    hourlyRate: '',
    bio: '',
  });

  // Buscar categorias profissionais
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/professional-categories'],
  });

  const handleCategorySelect = (category: ProfessionalCategory) => {
    setSelectedCategory(category);
    setSelectedSkills([]);
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      toast({
        title: "Categoria obrigatória",
        description: "Por favor, selecione uma categoria profissional",
        variant: "destructive",
      });
      return;
    }

    if (selectedSkills.length === 0) {
      toast({
        title: "Especialidades obrigatórias",
        description: "Selecione pelo menos uma especialidade",
        variant: "destructive",
      });
      return;
    }

    // Aqui você implementaria o envio para o backend
    console.log('Dados do profissional:', {
      ...formData,
      categoryId: selectedCategory.id,
      services: selectedSkills,
    });

    toast({
      title: "Cadastro enviado!",
      description: "Seu cadastro profissional foi enviado para análise",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
            Cadastro Profissional
          </h1>
          <p className="text-gray-400 text-lg">
            Junte-se ao Orbtrum Connect e faça parte da nossa rede de profissionais
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seleção de Categoria */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">Escolha sua Categoria Profissional</CardTitle>
              <CardDescription>
                Selecione a categoria que melhor representa seus serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories?.map((category: ProfessionalCategory) => {
                  const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Home;
                  const isSelected = selectedCategory?.id === category.id;
                  
                  return (
                    <Card
                      key={category.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20' 
                          : 'bg-gray-800/50 border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => handleCategorySelect(category)}
                    >
                      <CardContent className="p-4 text-center">
                        <IconComponent className={`w-8 h-8 mx-auto mb-3 ${
                          isSelected ? 'text-cyan-400' : 'text-gray-400'
                        }`} />
                        <h3 className="font-semibold mb-2">{category.name}</h3>
                        <p className="text-sm text-gray-400">{category.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Especialidades */}
          {selectedCategory && (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Suas Especialidades</CardTitle>
                <CardDescription>
                  Selecione os serviços que você oferece em {selectedCategory.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {selectedCategory.skills?.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <Badge
                        key={skill}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer p-3 text-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-cyan-500 text-black hover:bg-cyan-400' 
                            : 'text-gray-300 hover:text-white hover:border-gray-400'
                        }`}
                        onClick={() => handleSkillToggle(skill)}
                      >
                        {skill}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dados Pessoais */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">Dados Pessoais</CardTitle>
              <CardDescription>
                Informações necessárias para seu cadastro profissional
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-800 border-gray-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título Profissional *</Label>
                <Input
                  id="title"
                  placeholder="ex: Eletricista Residencial"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-gray-800 border-gray-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                  className="bg-gray-800 border-gray-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Valor por Hora (R$) *</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="45"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  className="bg-gray-800 border-gray-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                  className="bg-gray-800 border-gray-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pixKey">Chave PIX *</Label>
                <Input
                  id="pixKey"
                  placeholder="CPF, email ou telefone"
                  value={formData.pixKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, pixKey: e.target.value }))}
                  className="bg-gray-800 border-gray-600"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, cidade"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="bg-gray-800 border-gray-600"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="bio">Apresentação Profissional</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre sua experiência e diferenciais..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-gray-800 border-gray-600 min-h-20"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold px-12 py-3"
              disabled={!selectedCategory || selectedSkills.length === 0}
            >
              <Star className="w-5 h-5 mr-2" />
              Enviar Cadastro Profissional
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}