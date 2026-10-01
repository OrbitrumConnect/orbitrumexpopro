export interface DemoPro {
  name: string;
  title: string;
  avatar: string;
  skills: string[];
  city?: string;
  state?: string;
  available?: boolean;
  description?: string;
}

export const DEMO_PROS: Record<number, DemoPro> = {
  1: { name: 'Carlos Silva', title: 'Pintor Residencial', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Pintura residencial', 'Pintura comercial', 'Textura', 'Efeito marmorizado'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Pintor com mais de 10 anos no mercado. Atende Centro, Zona Sul e Zona Norte do Rio. Trabalha com tintas de alta qualidade e acabamento fino.' },
  2: { name: 'João Pereira', title: 'Encanador', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2e5c5b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Encanamento geral', 'Vazamentos', 'Caixa d\'agua', 'Esgoto'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Encanador profissional, atende Tijuca e região. Emergências 24h para vazamentos e entupimentos.' },
  3: { name: 'Rafael Costa', title: 'Eletricista', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Instalacao eletrica', 'Manutencao', 'Quadro de disjuntores', 'Tomadas e interruptores'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Eletricista com CREA ativo. Especialista em instalacoes residenciais e comerciais na Barra da Tijuca e regiao.' },
  4: { name: 'Ana Oliveira', title: 'Chaveiro', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Abertura de portas', 'Copia de chaves', 'Fechaduras digitais', 'Cofres'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Chaveira 24h em Copacabana e arredores. Abertura sem danificar, troca de segredo, fechaduras eletronicas.' },
  5: { name: 'Fernanda Santos', title: 'Babá', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Cuidar de criancas', 'Babá noturna', 'Acompanhamento escolar', 'Recreacao'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Babá com experiencia em criancas de 0 a 10 anos. Atende Botafogo, Flamengo e Laranjeiras. Referencias disponiveis.' },
  6: { name: 'Pedro Almeida', title: 'Passeador de Cachorro', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Passeio com cachorros', 'Dog walker', 'Adestramento basico', 'Pet sitting'], city: 'Niteroi', state: 'RJ', available: true, description: 'Dog walker em Niteroi. Passeios individuais e em grupo, adestramento basico e hospedagem pet.' },
  7: { name: 'Maria Limpeza', title: 'Diarista', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Faxina residencial', 'Limpeza pos-obra', 'Lavagem de estofados', 'Organizacao'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Diarista profissional, atende Recreio e Barra. Limpeza completa, organizacao e higienizacao de estofados.' },
  8: { name: 'Roberto Silva', title: 'Jardineiro', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Jardinagem', 'Poda de arvores', 'Paisagismo', 'Manutencao de jardim'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Jardineiro e paisagista em Jacarepagua. Manutencao de jardins, condominios e areas comerciais.' },
  9: { name: 'José Mecânico', title: 'Mecânico', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Mecanica geral', 'Troca de oleo', 'Freios', 'Suspensao'], city: 'São Gonçalo', state: 'RJ', available: true, description: 'Mecânico com oficina em São Gonçalo. Especialista em carros nacionais e importados. Diagnóstico gratuito.' },
  10: { name: 'Lucas Ferreira', title: 'Desenvolvedor Mobile', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300', skills: ['Apps Android', 'Apps iOS', 'React Native', 'Flutter'], city: 'Rio de Janeiro', state: 'RJ', available: true, description: 'Desenvolvedor mobile com 5 anos de experiência. Apps para iOS e Android, prototipação e publicação nas lojas.' },
};

export const CONF_LABEL: Record<string, string> = {
  declarado: 'Declarado',
  indicado: 'Indicado',
  validado: 'Experiência validada',
  verificado: 'Verificado',
};
