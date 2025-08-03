import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, Navigation, Star, Phone, Mail, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NearbyProfessional {
  id: number;
  name: string;
  title: string;
  rating: number;
  hourlyRate: number;
  distance: number;
  city: string;
  state: string;
  phone?: string;
  email: string;
  skills: string[];
  avatar: string;
  workRadius: number;
  available: boolean;
}

interface SearchLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function GeolocationSearch() {
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null);
  const [radius, setRadius] = useState(35); // Raio padrão: 35km
  const [professionals, setProfessionals] = useState<NearbyProfessional[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  
  const { toast } = useToast();

  const requestUserLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalização Indisponível",
        description: "Seu navegador não suporta geolocalização GPS.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLocationStatus("requesting");
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // Cache por 5 minutos
          }
        );
      });

      const location: SearchLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      // Tentar obter endereço via reverse geocoding (opcional)
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=pt`
        );
        const data = await response.json();
        location.address = `${data.city}, ${data.principalSubdivision}`;
      } catch (geocodeError) {
        console.log("Geocoding falhou, continuando sem endereço:", geocodeError);
      }

      setSearchLocation(location);
      setLocationStatus("granted");
      
      toast({
        title: "Localização Obtida",
        description: location.address || "Coordenadas GPS capturadas com sucesso!",
        variant: "default",
      });
      
      return true;
      
    } catch (error) {
      setLocationStatus("denied");
      console.error("Erro ao obter localização:", error);
      
      toast({
        title: "Erro de Localização",
        description: "Não foi possível obter sua localização. Você pode inserir coordenadas manualmente.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const searchNearbyProfessionals = async () => {
    if (!searchLocation) {
      toast({
        title: "Localização Necessária",
        description: "Obtenha sua localização primeiro ou insira coordenadas manualmente.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSearching(true);
      
      console.log('📍 Buscando profissionais próximos:', { 
        latitude: searchLocation.latitude, 
        longitude: searchLocation.longitude, 
        radius 
      });
      
      const response = await fetch(
        `/api/professionals/nearby?latitude=${searchLocation.latitude}&longitude=${searchLocation.longitude}&radius=${radius}`
      );

      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setProfessionals(data.professionals);
        setHasSearched(true);
        
        toast({
          title: "Busca Concluída",
          description: `Encontrados ${data.professionals.length} profissionais em um raio de ${radius}km`,
          variant: "default",
        });
        
        console.log('📍 Profissionais encontrados:', data.professionals);
      } else {
        throw new Error(data.message || "Erro na busca geográfica");
      }
      
    } catch (error) {
      console.error("Erro na busca geográfica:", error);
      toast({
        title: "Erro na Busca",
        description: "Falha ao buscar profissionais próximos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const manualLocationInput = (lat: string, lng: string) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      toast({
        title: "Coordenadas Inválidas",
        description: "Digite coordenadas válidas (ex: -23.5505, -46.6333)",
        variant: "destructive",
      });
      return;
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      toast({
        title: "Coordenadas Fora do Alcance",
        description: "Latitude: -90 a 90, Longitude: -180 a 180",
        variant: "destructive",
      });
      return;
    }
    
    setSearchLocation({ latitude, longitude, address: "Localização Manual" });
    setLocationStatus("granted");
    
    toast({
      title: "Localização Definida",
      description: `Coordenadas: ${latitude}, ${longitude}`,
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      {/* Controles de Localização */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <MapPin className="h-5 w-5" />
            Busca por Proximidade Geográfica
          </CardTitle>
          <CardDescription className="text-slate-400">
            Encontre profissionais próximos à sua localização usando GPS ou coordenadas manuais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Localização</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={requestUserLocation}
                  disabled={locationStatus === "requesting"}
                  className={`flex-1 ${
                    locationStatus === "granted" 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {locationStatus === "requesting" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Obtendo GPS...
                    </>
                  ) : locationStatus === "granted" ? (
                    <>
                      <Navigation className="mr-2 h-4 w-4" />
                      GPS Ativo
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Usar Minha Localização
                    </>
                  )}
                </Button>
              </div>
              
              {searchLocation && (
                <div className="text-sm text-slate-400 bg-slate-700/50 p-2 rounded">
                  <p>📍 {searchLocation.address || "Localização capturada"}</p>
                  <p className="text-xs">
                    Lat: {searchLocation.latitude.toFixed(6)}, 
                    Lng: {searchLocation.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius" className="text-slate-300">Raio de Busca (km)</Label>
              <Input
                id="radius"
                type="number"
                min="1"
                max="200"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value) || 20)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* Localização Manual */}
          <div className="border-t border-slate-600 pt-4">
            <Label className="text-slate-300 mb-2 block">Ou insira coordenadas manualmente:</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Latitude (ex: -23.5505)"
                className="bg-slate-700 border-slate-600 text-white"
                id="manual-lat"
              />
              <Input
                placeholder="Longitude (ex: -46.6333)"
                className="bg-slate-700 border-slate-600 text-white"
                id="manual-lng"
              />
              <Button 
                onClick={() => {
                  const lat = (document.getElementById('manual-lat') as HTMLInputElement)?.value;
                  const lng = (document.getElementById('manual-lng') as HTMLInputElement)?.value;
                  if (lat && lng) manualLocationInput(lat, lng);
                }}
                variant="outline"
                className="border-slate-600"
              >
                Definir
              </Button>
            </div>
          </div>

          <Button 
            onClick={searchNearbyProfessionals}
            disabled={!searchLocation || isSearching}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando Profissionais...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Buscar Profissionais Próximos
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {hasSearched && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Navigation className="h-5 w-5 text-green-400" />
            Profissionais Próximos ({professionals.length})
          </h3>
          
          {professionals.length === 0 ? (
            <Card className="border-slate-700 bg-slate-800/30">
              <CardContent className="pt-6 text-center">
                <MapPin className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum profissional encontrado nesta região.</p>
                <p className="text-sm text-slate-500 mt-2">Tente aumentar o raio de busca ou escolher outra localização.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {professionals.map((professional) => (
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
                      <Badge 
                        className={`${
                          professional.available 
                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        {professional.available ? "Disponível" : "Ocupado"}
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

                    <div className="flex items-center gap-1 text-sm text-green-400">
                      <MapPin className="h-4 w-4" />
                      <span>{professional.distance.toFixed(1)}km • {professional.city}, {professional.state}</span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Atende até {professional.workRadius}km de distância
                    </div>

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

                      <div className="flex gap-2 pt-2">
                        {professional.phone && (
                          <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-slate-300">
                            <Phone className="mr-1 h-3 w-3" />
                            Ligar
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-slate-300">
                          <Mail className="mr-1 h-3 w-3" />
                          Email
                        </Button>
                        <Button size="sm" className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Ver Perfil
                        </Button>
                      </div>
                    </div>
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