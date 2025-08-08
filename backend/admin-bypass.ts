// 🛡️ SISTEMA DE BYPASS ADMINISTRATIVO
// Permite que admin (passossmir4@gmail.com) use todos os recursos sem restrições

import { storage } from "./storage";
import type { User } from "@shared/schema";

/**
 * Verifica se o usuário é o admin master
 */
export function isAdminMaster(user: User | null | undefined): boolean {
  return user?.email === 'passossmir4@gmail.com' || user?.email === 'passosmir4@gmail.com';
}

/**
 * Verifica se o usuário tem acesso administrativo completo
 */
export function hasAdminAccess(user: User | null | undefined): boolean {
  return isAdminMaster(user);
}

/**
 * Middleware para bypass administrativo
 * Admin pode usar qualquer funcionalidade sem restrições
 */
export function adminBypass(user: User | null | undefined) {
  if (!isAdminMaster(user)) {
    return null;
  }

  return {
    // Bypass para jogos
    canPlay: true,
    unlimitedGames: true,
    noTokenDeduction: false, // Admin ainda paga tokens para testar sistema
    
    // Bypass para compras
    canPurchase: true,
    bypassDocumentVerification: true,
    
    // Bypass para teams
    canUseTeams: true,
    unlimitedTeamMembers: true,
    
    // Bypass para busca
    unlimitedSearches: true,
    
    // Bypass para conexões
    canConnectToProfessionals: true,
    
    // Indicador de modo admin
    isAdminMode: true,
    adminLevel: 'master'
  };
}

/**
 * Valida se admin pode executar ação específica
 */
export function validateAdminAction(user: User | null | undefined, action: string): boolean {
  if (!isAdminMaster(user)) {
    return false;
  }

  // Admin pode executar qualquer ação
  const allowedActions = [
    'play_game',
    'purchase_plan',
    'purchase_tokens',
    'use_teams',
    'search_professionals',
    'connect_professional',
    'access_admin_panel',
    'moderate_users',
    'view_financial_data',
    'process_withdrawals'
  ];

  return allowedActions.includes(action);
}

/**
 * Admin não utiliza tokens - apenas permissões
 */
export async function getAdminWallet(userId: number) {
  const user = await storage.getUser(userId);
  
  if (!isAdminMaster(user)) {
    return null;
  }

  // Admin não tem tokens especiais - usa permissões
  return null;
}

/**
 * Admin não utiliza sistema de tokens - apenas permissões
 */
export async function rechargeAdminWallet(): Promise<boolean> {
  // Admin não precisa de recarga de tokens
  return true;
}

/**
 * Verifica se deve mostrar funcionalidades admin
 */
export function shouldShowAdminFeatures(user: User | null | undefined): boolean {
  return isAdminMaster(user);
}

/**
 * Aplica bypass nas validações do sistema
 */
export function applyAdminValidation(user: User | null | undefined, validationType: string): boolean {
  if (!isAdminMaster(user)) {
    return false;
  }

  // Admin bypassa todas as validações
  switch (validationType) {
    case 'document_verification':
    case 'plan_restrictions':
    case 'token_limits':
    case 'search_limits':
    case 'game_limits':
    case 'team_limits':
      return true;
    default:
      return true;
  }
}