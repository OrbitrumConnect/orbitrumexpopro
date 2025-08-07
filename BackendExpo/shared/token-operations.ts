/**
 * SISTEMA DE TOKENS ORBITRUM - ORBITRUM CONNECT
 * Controle interno de tokens do plano, ganhos, compras e consumo
 * Cashback progressivo por atividade na plataforma
 * Limite mensal de saque de 8,7% do saldo acumulado
 * Bloqueio de saque antes de 6 meses de plano ativo
 * Histórico de operações para rastreio
 */

export interface TokenUser {
  id: number;
  plano: string;
  dataInicioPlano: string | null;
  tokensPlano: number;
  tokensGanhos: number;
  tokensComprados: number;
  tokensUsados: number;
  creditosAcumulados: number;
  creditosSacados: number;
  tokens: number; // Para compatibilidade com sistema atual
}

export interface OperationResult {
  sucesso: boolean;
  mensagem: string;
  novoSaldo?: number;
}

export interface WalletView {
  tokensPlano: number;
  tokensGanhos: number;
  tokensComprados: number;
  tokensUsados: number;
  saldoTotal: number;
  creditosAcumulados: number;
  creditosSacados: number;
  saldoDisponivelSaque: number;
  limiteSaque: number;
  mesesAtivos: number;
}

/** 
 * Calcula meses ativos do plano, para controle cashback e saque 
 */
export function mesesAtivos(dataInicio: string | null): number {
  if (!dataInicio) return 0;
  const inicio = new Date(dataInicio);
  const hoje = new Date();
  return (
    (hoje.getFullYear() - inicio.getFullYear()) * 12 +
    (hoje.getMonth() - inicio.getMonth())
  );
}

/**
 * Calcula cashback acumulado em tokens por atividade na plataforma
 * Cashback só começa após 6 meses ativos
 * Cashback baseado em atividade e participação
 * Bônus de jogo: por performance acumulada no tempo
 */
export function calcularCashback(user: TokenUser): number {
  const meses = mesesAtivos(user.dataInicioPlano);
  if (meses < 6) return 0;

  const cashbackFixo = 0.087 * user.tokensPlano * 6; // 8.7% mensal
  const bonusJogo = Math.min(0.02 * user.tokensPlano * meses, 0.02 * user.tokensPlano); // 2% max
  const cashbackTotal = Math.min(cashbackFixo + bonusJogo, user.tokensPlano * 0.60); // 60% max

  return Math.round(cashbackTotal);
}

/**
 * Calcula limite mensal para saque (8,7% do cashback acumulado)
 */
export function limiteSaqueMensal(user: TokenUser): number {
  return Math.round(user.creditosAcumulados * 0.087);
}

/**
 * Valida se pode sacar tokens, respeitando limite mensal e saldo disponível
 */
export function validarSaque(user: TokenUser, valor: number): OperationResult {
  const limite = limiteSaqueMensal(user);
  const saldoDisponivel = user.creditosAcumulados - user.creditosSacados;

  if (mesesAtivos(user.dataInicioPlano) < 6) {
    return { sucesso: false, mensagem: 'Saque disponível somente após 6 meses do plano.' };
  }

  if (valor > limite) {
    return { sucesso: false, mensagem: `Valor excede limite mensal de saque (${limite.toFixed(2)} tokens).` };
  }

  if (valor > saldoDisponivel) {
    return { sucesso: false, mensagem: `Saldo insuficiente para saque. Saldo disponível: ${saldoDisponivel.toFixed(2)} tokens.` };
  }

  return { sucesso: true, mensagem: `Saque de ${valor} tokens autorizado.` };
}

/**
 * Valida se pode consumir tokens para uso na plataforma
 */
export function validarConsumo(user: TokenUser, quantidade: number): OperationResult {
  const saldoTokensTotais = user.tokensPlano + user.tokensGanhos + user.tokensComprados - user.tokensUsados;

  if (quantidade > saldoTokensTotais) {
    return { sucesso: false, mensagem: 'Saldo insuficiente para consumir tokens.' };
  }

  return { 
    sucesso: true, 
    mensagem: `${quantidade} tokens autorizados para consumo.`,
    novoSaldo: saldoTokensTotais - quantidade
  };
}

/**
 * Retorna visão resumida da carteira de tokens para exibir no app
 */
export function verCarteira(user: TokenUser): WalletView {
  const saldoTotal = user.tokensPlano + user.tokensGanhos + user.tokensComprados - user.tokensUsados;
  const limiteSaque = limiteSaqueMensal(user);
  const saldoDisponivelSaque = user.creditosAcumulados - user.creditosSacados;

  return {
    tokensPlano: user.tokensPlano,
    tokensGanhos: user.tokensGanhos,
    tokensComprados: user.tokensComprados,
    tokensUsados: user.tokensUsados,
    saldoTotal,
    creditosAcumulados: user.creditosAcumulados,
    creditosSacados: user.creditosSacados,
    saldoDisponivelSaque,
    limiteSaque,
    mesesAtivos: mesesAtivos(user.dataInicioPlano),
  };
}

/**
 * Calcula tokens iniciais baseado no plano
 */
export function tokensIniciais(plano: string): number {
  const planos = {
    'free': 0,
    'basico': 7000,
    'standard': 14000,
    'pro': 21000,
    'max': 30000
  };
  return planos[plano as keyof typeof planos] || 0;
}