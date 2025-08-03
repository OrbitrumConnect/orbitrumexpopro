import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, MapPin, Star, Clock, Zap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfessionalMatch {
  id: number;
  name: string;
  title: string;
  rating: number;
  hourlyRate: number;
  aiMatchScore: number;
  aiExplanation: string;
  distance?: number;
  city?: string;
  state?: string;
  skills: string[];
  workPreferences: string[];
  avatar: string;
}

interface SearchCriteria {
  projectType: string;
  budget: number;
  urgency: "baixa" | "normal" | "alta" | "urgente";
  workPreference: "presencial" | "remoto" | "hibrido";
  experienceRequired: "junior" | "pleno" | "senior";
  location?: {
    latitude: number;
    longitude: number;
  };
}

export default function IAMatchingSearch() {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    projectType: "",
    budget: 5000,
    urgency: "normal",
    workPreference: "remoto",
    experienceRequired: "pleno"
  });
  
  const [matches, setMatches] = useState<ProfessionalMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  
  const { toast } = useToast();

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalização Indisponível",
        description: "Seu navegador não suporta geolocalização.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        });
      });

      setCriteria(prev => ({
        ...prev,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      }));

      setLocationPermission("granted");
      
      toast({
        title: "Localização Obtida",
        description: "Agora podemos mostrar profissionais próximos a você!",
        variant: "default",
      });
      
      return true;
    } catch (error) {
      setLocationPermission("denied");
      console.error("Erro ao obter localização:", error);
      
      toast({
        title: "Localização Negada",
        description: "A busca funcionará sem filtro geográfico.",
        variant: "default",
      });
      
      return false;
    }
  };

  const performAISearch = async () => {
    try {
      setIsSearching(true);
      
      console.log('🤖 Iniciando busca com IA:', criteria);
      
      const response = await fetch('/api/professionals/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(criteria)
      });

      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMatches(data.professionals);
        setHasSearched(true);
        
        toast({
          title: "Busca IA Concluída",
          description: `Encontrados ${data.professionals.length} profissionais compatíveis`,
          variant: "default",
        });
        
        console.log('🎯 IA Matches:', data.professionals);
      } else {
        throw new Error(data.message || "Erro na busca");
      }
      
    } catch (error) {
      console.error("Erro na busca IA:", error);
      toast({
        title: "Erro na Busca",
        description: "Falha ao buscar profissionais. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Critérios */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Bot className="h-5 w-5" />
            Busca Inteligente com IA
          </CardTitle>
          <CardDescription className="text-slate-400">
            Nossa IA analisa compatibilidade técnica, geográfica e pessoal para encontrar os melhores profissionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectType" className="text-slate-300">Tipo de Projeto</Label>
              <Input
                id="projectType"
                value={criteria.projectType}
                onChange={(e) => setCriteria(prev => ({ ...prev, projectType: e.target.value }))}
                placeholder="Ex: Desenvolvimento de app, Design gráfico..."
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-slate-300">Orçamento (R$)</Label>
              <Input
                id="budget"
                type="number"
                value={criteria.budget}
                onChange={(e) => setCriteria(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Urgência</Label>
              <Select value={criteria.urgency} onValueChange={(value: any) => setCriteria(prev => ({ ...prev, urgency: value }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa - Flexível</SelectItem>
                  <SelectItem value="normal">Normal - 2-4 semanas</SelectItem>
                  <SelectItem value="alta">Alta - 1-2 semanas</SelectItem>
                  <SelectItem value="urgente">Urgente - Menos de 1 semana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Modalidade de Trabalho</Label>
              <Select value={criteria.workPreference} onValueChange={(value: any) => setCriteria(prev => ({ ...prev, workPreference: value }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remoto">Remoto</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Nível de Experiência</Label>
              <Select value={criteria.experienceRequired} onValueChange={(value: any) => setCriteria(prev => ({ ...prev, experienceRequired: value }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior (0-2 anos)</SelectItem>
                  <SelectItem value="pleno">Pleno (2-8 anos)</SelectItem>
                  <SelectItem value="senior">Senior (5+ anos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Localização</Label>
              <Button 
                onClick={requestLocation}
                variant={locationPermission === "granted" ? "default" : "outline"}
                className="w-full"
                disabled={isSearching}
              >
                <MapPin className="mr-2 h-4 w-4" />
                {locationPermission === "granted" ? "📍 Localização Ativa" : "Permitir Localização"}
              </Button>
            </div>
          </div>

          <Button 
            onClick={performAISearch}
            disabled={!criteria.projectType || isSearching}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                IA Analisando Compatibilidade...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                Buscar com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {hasSearched && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Profissionais Recomendados pela IA
          </h3>
          
          {matches.length === 0 ? (
            <Card className="border-slate-700 bg-slate-800/30">
              <CardContent className="pt-6 text-center">
                <p className="text-slate-400">Nenhum profissional encontrado com os critérios especificados.</p>
                <p className="text-sm text-slate-500 mt-2">Tente ajustar os filtros ou ampliar o escopo da busca.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((professional) => (
                <Card key={professional.id} className="border-slate-700 bg-slate-800/50 hover:bg-slate-800/70 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={professional.avatar} 
                          alt={professional.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <CardTitle className="text-white text-base">{professional.name}</CardTitle>
                          <CardDescription className="text-slate-400">{professional.title}</CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold">
                        {professional.aiMatchScore}% Match
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{professional.rating}</span>
                      </div>
                      <div className="text-slate-300">
                        R$ {professional.hourlyRate}/hora
                      </div>
                    </div>

                    {professional.distance && (
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <MapPin className="h-4 w-4" />
                        <span>{professional.distance.toFixed(1)}km • {professional.city}, {professional.state}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {professional.skills?.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                            {skill}
                          </Badge>
                        ))}
                        {professional.skills?.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-slate-600 text-slate-400">
                            +{professional.skills.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="bg-slate-700/50 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Bot className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-300">{professional.aiExplanation}</p>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                      <Clock className="mr-2 h-4 w-4" />
                      Contratar Profissional
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}