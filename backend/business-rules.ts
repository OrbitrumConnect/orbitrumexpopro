// REGRAS DE NEGÓCIO - ORBITRUM CONNECT
// Sistema de diferenciação entre compra de tokens e planos mensais

export interface BusinessRules {
  tokenPurchase: {
    requiresDocuments: boolean;
    hasCashback: boolean;
    canWithdraw: boolean;
    description: string;
  };
  serviceHiring: {
    requiresDocuments: boolean;
    canHire: boolean;
    description: string;
  };
  monthlyPlan: {
    requiresDocuments: boolean;
    hasCashback: boolean;
    cashbackRate: number;
    canWithdraw: boolean;
    description: string;
  };
  professional: {
    requiresDocuments: boolean;
    canWork: boolean;
    description: string;
  };
}

export const BUSINESS_RULES: BusinessRules = {
  // COMPRA DE TOKENS (R$ 3, 6, 9, 18, 32)
  tokenPurchase: {
    requiresDocuments: false,        // ❌ Documentos NÃO obrigatórios
    hasCashback: false,              // ❌ SEM cashback 8,7%
    canWithdraw: false,              // ❌ SEM direito a saques
    description: "Tokens para consumir serviços profissionais - uso imediato sem documentação"
  },

  // CONTRATAR SERVIÇOS PROFISSIONAIS
  serviceHiring: {
    requiresDocuments: true,         // ✅ Documentos OBRIGATÓRIOS
    canHire: false,                  // ❌ Não pode contratar sem documentos
    description: "Para contratar profissionais é obrigatório verificação de documentos"
  },

  // PLANOS MENSAIS (R$ 7, 14, 21, 30)
  monthlyPlan: {
    requiresDocuments: true,         // ✅ Documentos OBRIGATÓRIOS
    hasCashback: true,               // ✅ Cashback 8,7% mensal
    cashbackRate: 8.7,               // 8,7% de rendimento
    canWithdraw: true,               // ✅ Direito a saques (dia 3)
    description: "Planos com benefícios mensais - requer verificação de documentos para cashback/saques"
  },

  // PROFISSIONAIS
  professional: {
    requiresDocuments: true,         // ✅ Documentos OBRIGATÓRIOS
    canWork: false,                  // ❌ Não pode trabalhar sem documentos
    description: "Profissionais devem ter documentos verificados para oferecer serviços"
  }
};

// Função para validar se usuário pode realizar ação específica
export function canUserPerformAction(
  userType: 'client' | 'professional' | 'admin',
  action: 'buyTokens' | 'hireServices' | 'subscribePlan' | 'withdrawCashback' | 'workAsProfessional',
  hasDocuments: boolean
): { allowed: boolean; reason?: string; requiresDocuments?: boolean } {

  switch (action) {
    case 'buyTokens':
      // Compra de tokens sempre liberada (sem documentos necessários)
      return { 
        allowed: true, 
        requiresDocuments: false 
      };

    case 'hireServices':
      // Contratar serviços exige documentos verificados
      if (!hasDocuments) {
        return { 
          allowed: false, 
          reason: "Documentos obrigatórios para contratar serviços profissionais",
          requiresDocuments: true 
        };
      }
      return { allowed: true };

    case 'subscribePlan':
      // Plano pode ser comprado, mas cashback só com documentos
      return { 
        allowed: true, 
        requiresDocuments: true,
        reason: hasDocuments ? undefined : "Documentos necessários para receber cashback 8,7% e realizar saques"
      };

    case 'withdrawCashback':
      // Saques só para quem tem planos E documentos verificados
      if (!hasDocuments) {
        return { 
          allowed: false, 
          reason: "Verificação de documentos obrigatória para saques",
          requiresDocuments: true 
        };
      }
      return { allowed: true };

    case 'workAsProfessional':
      // Profissionais precisam documentos verificados para trabalhar
      if (userType !== 'professional') {
        return { 
          allowed: false, 
          reason: "Apenas profissionais cadastrados podem oferecer serviços" 
        };
      }
      if (!hasDocuments) {
        return { 
          allowed: false, 
          reason: "Documentos obrigatórios para profissionais trabalharem na plataforma",
          requiresDocuments: true 
        };
      }
      return { allowed: true };

    default:
      return { allowed: false, reason: "Ação não reconhecida" };
  }
}

// Mensagens para notificar usuários sobre benefícios perdidos
export const NOTIFICATION_MESSAGES = {
  tokenPurchaseSuccess: "Tokens creditados! Para aproveitar cashback 8,7% e saques, considere assinar um plano mensal.",
  serviceHiringBlocked: "⚠️ Para contratar profissionais é necessário verificar seus documentos primeiro.",
  planWithoutDocuments: "⚠️ Plano ativo! Envie seus documentos para receber cashback 8,7% mensal e poder sacar.",
  professionalBlocked: "⚠️ Profissionais precisam de documentos verificados para oferecer serviços na plataforma.",
  withdrawalBlocked: "⚠️ Saques disponíveis apenas para usuários com documentos verificados."
};