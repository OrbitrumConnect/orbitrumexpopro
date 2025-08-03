// Configuração para evitar conflitos com Supabase online
export const DATABASE_CONFIG = {
  // Prefixo para IDs locais para evitar conflitos
  LOCAL_ID_PREFIX: 'local_',
  
  // Configuração de migração
  MIGRATION: {
    // Se true, usa prefixos nos IDs locais
    USE_LOCAL_PREFIX: true,
    
    // Se true, permite sobrescrever dados existentes
    ALLOW_OVERWRITE: false,
    
    // Backup automático antes da migração
    AUTO_BACKUP: true
  },
  
  // Configuração de IDs
  ID_MANAGEMENT: {
    // Próximo ID local (incrementa automaticamente)
    NEXT_LOCAL_ID: 1000,
    
    // IDs reservados para o Supabase
    RESERVED_IDS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    
    // Mapeamento de IDs locais para IDs online
    ID_MAPPING: new Map<string, number>()
  }
};

// Função para gerar ID local único
export function generateLocalId(): string {
  const id = DATABASE_CONFIG.ID_MANAGEMENT.NEXT_LOCAL_ID++;
  return `${DATABASE_CONFIG.LOCAL_ID_PREFIX}${id}`;
}

// Função para verificar se é ID local
export function isLocalId(id: string | number): boolean {
  return typeof id === 'string' && id.startsWith(DATABASE_CONFIG.LOCAL_ID_PREFIX);
}

// Função para extrair ID numérico de ID local
export function extractLocalId(localId: string): number {
  return parseInt(localId.replace(DATABASE_CONFIG.LOCAL_ID_PREFIX, ''));
}

// Função para preparar dados para migração
export function prepareForMigration(data: any): any {
  if (DATABASE_CONFIG.MIGRATION.USE_LOCAL_PREFIX) {
    // Adicionar prefixo se não tiver
    if (data.id && !isLocalId(data.id)) {
      data.id = generateLocalId();
    }
  }
  return data;
}

// Função para limpar dados locais antes de conectar online
export function clearLocalData(): void {
  console.log('🧹 Limpando dados locais para evitar conflitos...');
  
  // Limpar localStorage
  localStorage.removeItem('orbtrum_auth');
  localStorage.removeItem('local_users');
  localStorage.removeItem('local_professionals');
  
  // Resetar contadores
  DATABASE_CONFIG.ID_MANAGEMENT.NEXT_LOCAL_ID = 1000;
  DATABASE_CONFIG.ID_MANAGEMENT.ID_MAPPING.clear();
  
  console.log('✅ Dados locais limpos com sucesso!');
}

// Função para migrar dados locais para online
export function migrateToOnline(localData: any[], onlineData: any[]): any[] {
  console.log('🔄 Iniciando migração de dados locais para online...');
  
  const migratedData = [...onlineData];
  
  localData.forEach(localItem => {
    if (isLocalId(localItem.id)) {
      // Verificar se já existe no online
      const existingIndex = onlineData.findIndex(onlineItem => 
        onlineItem.email === localItem.email || 
        onlineItem.username === localItem.username
      );
      
      if (existingIndex === -1) {
        // Não existe, adicionar com novo ID
        const newItem = { ...localItem };
        delete newItem.id; // Deixar o Supabase gerar o ID
        migratedData.push(newItem);
        console.log(`✅ Migrado: ${localItem.email || localItem.username}`);
      } else {
        console.log(`⚠️ Já existe: ${localItem.email || localItem.username}`);
      }
    }
  });
  
  console.log(`✅ Migração concluída: ${migratedData.length} itens`);
  return migratedData;
} 