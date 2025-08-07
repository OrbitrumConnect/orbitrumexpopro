// 🤖 SISTEMA DE IA PARA MATCHING INTELIGENTE
// Algoritmo que analisa compatibilidade entre clientes e profissionais

export interface ClientProfile {
  id: number;
  projectType: string;
  budget: number;
  urgency: "baixa" | "normal" | "alta" | "urgente";
  workPreference: "presencial" | "remoto" | "hibrido";
  communicationStyle: "formal" | "casual" | "técnico";
  experienceRequired: "junior" | "pleno" | "senior";
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
  };
}

export interface ProfessionalProfile {
  id: number;
  name: string;
  title: string;
  skills: string[];
  experienceYears: number;
  rating: number;
  completedProjects: number;
  responseTimeHours: number;
  hourlyRate: number;
  workPreferences: string[];
  specializations: string[];
  communicationStyle: string;
  personalityType: string;
  workMethodology: string;
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    workRadius: number;
  };
  available: boolean;
  aiMatchScore: number;
}

/**
 * 🧠 ALGORITMO PRINCIPAL DE MATCHING IA
 * 
 * Funciona assim Pedro:
 * 1. COMPATIBILIDADE TÉCNICA (40%): Skills, experiência, especialização
 * 2. PROXIMIDADE GEOGRÁFICA (25%): Distância, raio de atendimento
 * 3. COMPATIBILIDADE PESSOAL (20%): Comunicação, metodologia, personalidade  
 * 4. DISPONIBILIDADE (15%): Rating, projetos, tempo resposta
 * 
 * Retorna score 0-100 para cada profissional
 */
export function calculateAIMatchScore(
  client: ClientProfile, 
  professional: ProfessionalProfile
): number {
  let score = 0;
  const weights = {
    technical: 0.4,    // 40% - Mais importante
    geographic: 0.25,  // 25% - Muito importante no Brasil
    personal: 0.2,     // 20% - Compatibilidade cultural
    availability: 0.15 // 15% - Performance histórica
  };

  // 1. 🔧 COMPATIBILIDADE TÉCNICA (40%)
  const technicalScore = calculateTechnicalCompatibility(client, professional);
  score += technicalScore * weights.technical;

  // 2. 📍 PROXIMIDADE GEOGRÁFICA (25%) 
  const geographicScore = calculateGeographicCompatibility(client, professional);
  score += geographicScore * weights.geographic;

  // 3. 👥 COMPATIBILIDADE PESSOAL (20%)
  const personalScore = calculatePersonalCompatibility(client, professional);
  score += personalScore * weights.personal;

  // 4. ⭐ DISPONIBILIDADE E PERFORMANCE (15%)
  const availabilityScore = calculateAvailabilityScore(professional);
  score += availabilityScore * weights.availability;

  return Math.round(score * 100) / 100; // Arredondar para 2 casas decimais
}

/**
 * 🔧 COMPATIBILIDADE TÉCNICA
 * Analisa se o profissional tem as skills necessárias
 */
function calculateTechnicalCompatibility(
  client: ClientProfile, 
  professional: ProfessionalProfile
): number {
  let score = 0;

  // Experiência adequada ao projeto
  const expRequirement = {
    "junior": { min: 0, max: 2, optimal: 1 },
    "pleno": { min: 2, max: 8, optimal: 5 }, 
    "senior": { min: 5, max: 20, optimal: 10 }
  };
  
  const reqExp = expRequirement[client.experienceRequired];
  if (professional.experienceYears >= reqExp.min && professional.experienceYears <= reqExp.max) {
    score += 0.4; // 40% da pontuação técnica
    if (professional.experienceYears === reqExp.optimal) {
      score += 0.1; // Bônus se for exatamente o ideal
    }
  }

  // Skills matching (simplificado - em produção seria mais sofisticado)
  const hasRelevantSkills = professional.skills.some(skill => 
    skill.toLowerCase().includes(client.projectType.toLowerCase()) ||
    client.projectType.toLowerCase().includes(skill.toLowerCase())
  );
  if (hasRelevantSkills) {
    score += 0.3; // 30% da pontuação técnica
  }

  // Projetos completados (confiabilidade)
  if (professional.completedProjects >= 10) score += 0.2;
  else if (professional.completedProjects >= 5) score += 0.15;
  else if (professional.completedProjects >= 1) score += 0.1;

  // Especialização específica
  const hasSpecialization = professional.specializations.some(spec =>
    spec.toLowerCase().includes(client.projectType.toLowerCase())
  );
  if (hasSpecialization) {
    score += 0.1; // Bônus por especialização
  }

  return Math.min(score, 1); // Máximo 1.0
}

/**
 * 📍 COMPATIBILIDADE GEOGRÁFICA  
 * Calcula distância e preferência de trabalho
 */
function calculateGeographicCompatibility(
  client: ClientProfile,
  professional: ProfessionalProfile
): number {
  let score = 0;

  // Se cliente quer remoto e profissional aceita, pontuação máxima
  if (client.workPreference === "remoto" && 
      professional.workPreferences.includes("remoto")) {
    return 1.0;
  }

  // Se não tem localização, assumir compatibilidade média
  if (!client.location || !professional.location) {
    return 0.5;
  }

  // Calcular distância real entre cliente e profissional
  const distance = calculateDistance(
    client.location.latitude, client.location.longitude,
    professional.location.latitude, professional.location.longitude
  );

  // Scoring baseado na distância e raio de atendimento
  if (distance <= professional.location.workRadius) {
    score = 1.0; // Dentro do raio, pontuação máxima
  } else if (distance <= professional.location.workRadius * 1.5) {
    score = 0.7; // Pouco fora do raio, ainda viável
  } else if (distance <= 50) {
    score = 0.4; // Mesma região metropolitana
  } else if (distance <= 200) {
    score = 0.2; // Mesmo estado
  } else {
    score = 0.1; // Estados diferentes
  }

  return score;
}

/**
 * 👥 COMPATIBILIDADE PESSOAL
 * Avalia fit cultural e de comunicação
 */
function calculatePersonalCompatibility(
  client: ClientProfile,
  professional: ProfessionalProfile
): number {
  let score = 0;

  // Estilo de comunicação compatível
  if (client.communicationStyle === professional.communicationStyle) {
    score += 0.4;
  } else {
    // Compatibilidades cruzadas que funcionam bem
    if ((client.communicationStyle === "formal" && professional.communicationStyle === "técnico") ||
        (client.communicationStyle === "técnico" && professional.communicationStyle === "formal") ||
        (client.communicationStyle === "casual" && professional.communicationStyle === "técnico")) {
      score += 0.2;
    }
  }

  // Preferência de trabalho
  if (professional.workPreferences.includes(client.workPreference)) {
    score += 0.3;
  }

  // Metodologia de trabalho (bônus)
  if (client.urgency === "urgente" && professional.workMethodology === "agile") {
    score += 0.2;
  } else if (client.urgency === "baixa" && professional.workMethodology === "waterfall") {
    score += 0.1;
  }

  // Personalidade (simplificado)
  score += 0.1; // Assume compatibilidade básica

  return Math.min(score, 1);
}

/**
 * ⭐ SCORE DE DISPONIBILIDADE
 * Baseado em performance histórica
 */
function calculateAvailabilityScore(professional: ProfessionalProfile): number {
  let score = 0;

  // Rating alto = mais confiável
  if (professional.rating >= 4.5) score += 0.4;
  else if (professional.rating >= 4.0) score += 0.3;
  else if (professional.rating >= 3.5) score += 0.2;
  else score += 0.1;

  // Tempo de resposta rápido
  if (professional.responseTimeHours <= 2) score += 0.3;
  else if (professional.responseTimeHours <= 8) score += 0.2;
  else if (professional.responseTimeHours <= 24) score += 0.1;

  // Disponibilidade atual
  if (professional.available) score += 0.3;

  return Math.min(score, 1);
}

/**
 * 📐 CÁLCULO DE DISTÂNCIA GEOGRÁFICA
 * Fórmula de Haversine para distância entre coordenadas
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em quilômetros
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI/180);
}

/**
 * 🎯 FUNÇÃO PRINCIPAL PARA BUSCA INTELIGENTE
 * Retorna profissionais ordenados por compatibilidade IA
 */
export function findBestMatches(
  client: ClientProfile, 
  professionals: ProfessionalProfile[],
  limit: number = 6
): ProfessionalProfile[] {
  
  // Calcular score para cada profissional
  const withScores = professionals.map(prof => ({
    ...prof,
    aiMatchScore: calculateAIMatchScore(client, prof)
  }));

  // Ordenar por score decrescente e retornar os melhores
  return withScores
    .sort((a, b) => b.aiMatchScore - a.aiMatchScore)
    .slice(0, limit);
}

/**
 * 📝 EXPLICAÇÃO PARA O USUÁRIO
 * Gera texto explicando por que este profissional foi recomendado
 */
export function generateMatchExplanation(
  client: ClientProfile,
  professional: ProfessionalProfile
): string {
  const reasons = [];

  // Análise técnica
  if (professional.experienceYears >= 5) {
    reasons.push(`${professional.experienceYears} anos de experiência comprovada`);
  }
  
  if (professional.rating >= 4.5) {
    reasons.push(`avaliação excelente (${professional.rating}⭐)`);
  }

  // Análise geográfica
  if (professional.workPreferences.includes(client.workPreference)) {
    reasons.push(`atende no formato ${client.workPreference}`);
  }

  if (client.location && professional.location) {
    const distance = calculateDistance(
      client.location.latitude, client.location.longitude,
      professional.location.latitude, professional.location.longitude
    );
    if (distance <= professional.location.workRadius) {
      reasons.push(`atende na sua região (${Math.round(distance)}km)`);
    }
  }

  // Análise pessoal
  if (professional.responseTimeHours <= 8) {
    reasons.push(`resposta rápida (${professional.responseTimeHours}h)`);
  }

  const explanation = reasons.length > 0 
    ? `Recomendado pela IA: ${reasons.join(', ')}.`
    : `Profissional qualificado com score de compatibilidade ${professional.aiMatchScore}%.`;

  return explanation;
}