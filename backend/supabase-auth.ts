import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Configuração do Supabase Auth (será configurado quando tivermos as keys)
let supabase: ReturnType<typeof createClient> | null = null;

// Função para detectar URL base automaticamente com SSL
function getBaseUrl(): string {
  // Verificar se estamos acessando pelo domínio personalizado
  if (process.env.NODE_ENV === 'production' || process.env.REPLIT_DOMAINS) {
    // Usar o domínio Replit atual para Google OAuth
    return `https://gnvxnsgewhjucdhwrrdi-00-yjltuxvct4sz.janeway.replit.dev`;
  }
  return 'http://localhost:5000';
}

export function initializeSupabase(url: string, anonKey: string) {
  supabase = createClient(url, anonKey);
  return supabase;
}

export function getSupabase() {
  return supabase;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  message: string;
  requiresVerification?: boolean;
}

/**
 * Registro de novo usuário com verificação de email
 */
export async function registerUser(
  email: string, 
  password: string, 
  username: string,
  fullName: string,
  phone?: string
): Promise<AuthResult> {
  try {
    console.log('🔍 registerUser chamado:', { email, username, supabaseConfigured: !!supabase });
    
    // Verificar se email já existe
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return { success: false, message: "Email já cadastrado" };
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Se Supabase Auth estiver configurado, usar ele
    if (supabase) {
      console.log('🚀 Usando Supabase Auth para registro...');
      
      // SISTEMA AUTOMÁTICO DE REGISTRO COM EMAIL DE CONFIRMAÇÃO
      console.log('📧 Iniciando registro automático com email de confirmação...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getBaseUrl() + '/auth/confirm',
          data: {
            username,
            full_name: fullName,
            phone,
            user_type: 'client'
          }
        }
      });

      if (error) {
        console.error('❌ Erro no registro Supabase:', error.message);
        // Se o erro for de usuário já existente, ainda assim tentamos confirmar o email
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          console.log('👤 Usuário já existe, tentando reenviar email de confirmação...');
          
          // Tentar reenviar email para usuário existente
          const resendResult = await resendConfirmationEmail(email);
          if (resendResult.success) {
            return { 
              success: true, 
              message: "✅ Usuário já existe. Email de confirmação reenviado! Verifique sua caixa de entrada.",
              requiresVerification: true 
            };
          }
        }
        return { success: false, message: `Erro no registro: ${error.message}` };
      }

      console.log('✅ Registro Supabase realizado com sucesso!');
      console.log('📧 Email de confirmação enviado automaticamente pelo Supabase');
      
      // Se o usuário precisa confirmar email
      if (data.user && !data.user.email_confirmed_at) {
        console.log('⏳ Usuário precisa confirmar email antes do primeiro login');
      }

      // Criar usuário no nosso banco de dados local
      const user = await storage.createUser({
        username,
        email,
        fullName,
        phone,
        emailVerified: false, // Sempre falso até confirmação
        passwordHash,
        supabaseId: data.user?.id,
        userType: "client",
        termsAccepted: true,
        termsAcceptedAt: new Date()
      });

      console.log('👤 Usuário criado no banco local:', { id: user.id, email, username });

      // SISTEMA AUTOMÁTICO DE BACKUP: Garantir que email seja enviado
      // Enviar email de backup após 3 segundos automaticamente
      setTimeout(async () => {
        try {
          console.log('🔄 BACKUP AUTOMÁTICO: Verificando confirmação de email...');
          const backupResult = await resendConfirmationEmail(email);
          if (backupResult.success) {
            console.log('✅ Email de backup enviado automaticamente');
          } else {
            console.log('⚠️ Email de backup não foi necessário ou falhou:', backupResult.message);
          }
        } catch (error) {
          console.error('❌ Erro no sistema de backup automático:', error);
        }
      }, 3000); // 3 segundos de delay

      return { 
        success: true, 
        user, 
        message: "✅ Conta criada com sucesso! Email de confirmação enviado automaticamente. Verifique sua caixa de entrada e pasta de spam. O email será reenviado automaticamente se necessário.",
        requiresVerification: true 
      };
    } else {
      // Fallback para autenticação local (desenvolvimento)
      const user = await storage.createUser({
        username,
        email,
        fullName,
        phone,
        emailVerified: true, // Auto-verificado em desenvolvimento
        passwordHash,
        userType: "client",
        termsAccepted: true,
        termsAcceptedAt: new Date()
      });

      return { success: true, user, message: "Conta criada com sucesso!" };
    }
  } catch (error) {
    console.error('Erro no registro:', error);
    return { success: false, message: "Erro interno do servidor" };
  }
}

/**
 * Reenviar email de confirmação com múltiplas tentativas automáticas
 */
export async function resendConfirmationEmail(email: string): Promise<AuthResult> {
  try {
    if (!supabase) {
      console.log('⚠️ Supabase não configurado para reenvio de email');
      return { success: false, message: "Sistema de email não configurado" };
    }

    console.log('🔄 INICIANDO reenvio automático de email para:', email);

    // Sistema de múltiplas tentativas para garantir entrega
    let success = false;
    let lastError = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`📧 Tentativa ${attempt}/${maxAttempts} de reenvio para ${email}...`);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: getBaseUrl() + '/auth/confirm'
        }
      });

      if (!error) {
        console.log(`✅ SUCESSO na tentativa ${attempt}! Email reenviado para ${email}`);
        success = true;
        break;
      }

      lastError = error;
      console.log(`❌ Falha na tentativa ${attempt}:`, error.message);
      
      // Se não é a última tentativa, aguarda antes de tentar novamente
      if (attempt < maxAttempts) {
        console.log(`⏳ Aguardando ${attempt * 2}s antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // 2s, 4s, 6s
      }
    }

    if (success) {
      console.log(`🎉 EMAIL ENVIADO COM SUCESSO para ${email} após múltiplas tentativas`);
      return { success: true, message: "Email de confirmação enviado com sucesso" };
    } else {
      console.log(`💥 FALHA TOTAL após ${maxAttempts} tentativas para ${email}:`, lastError?.message);
      return { success: false, message: `Falha após ${maxAttempts} tentativas: ${lastError?.message}` };
    }

  } catch (error) {
    console.error('❌ ERRO CRÍTICO no reenvio de confirmação:', error);
    return { success: false, message: "Erro crítico no sistema de reenvio" };
  }
}

/**
 * Login de usuário
 */
/**
 * Login com Google OAuth via Supabase
 */
export async function loginWithGoogle(): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    if (!supabase) {
      console.error('❌ Supabase não inicializado para Google OAuth');
      return { success: false, message: "Supabase não configurado" };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getBaseUrl() + '/auth/callback'
      }
    });

    if (error) {
      console.error('❌ Erro no login Google:', error.message);
      return { success: false, message: `Erro no login Google: ${error.message}` };
    }

    return { 
      success: true, 
      url: data.url,
      message: "Redirecionando para Google..." 
    };
  } catch (error) {
    console.error('❌ Erro no Google OAuth:', error);
    return { success: false, message: "Erro interno no login Google" };
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    console.log('🔐 Tentativa de login para:', email);
    
    // Se Supabase Auth estiver configurado, usar ele
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log('❌ Erro no login Supabase para', email, ':', error.message);
        
        // DETECÇÃO DE EMAIL NÃO CONFIRMADO VIA ERROR MESSAGE
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('email not confirmed') ||
            error.message.includes('not confirmed')) {
          
          console.log('🚨 EMAIL NÃO CONFIRMADO DETECTADO VIA ERROR para:', email);
          console.log('🔄 Iniciando reenvio automático via error handler...');
          
          // TENTAR REENVIO AUTOMÁTICO IMEDIATAMENTE
          try {
            const resendResult = await resendConfirmationEmail(email);
            if (resendResult.success) {
              console.log('✅ Email de confirmação reenviado automaticamente via error handler!');
              return { 
                success: false, 
                message: "❌ Email não confirmado. ✅ Novo email de confirmação enviado automaticamente! Verifique sua caixa de entrada e pasta de spam.",
                requiresVerification: true 
              };
            } else {
              console.log('⚠️ Falha no reenvio automático via error handler:', resendResult.message);
            }
          } catch (resendError) {
            console.error('❌ Erro no reenvio automático via error handler:', resendError);
          }
          
          return { 
            success: false, 
            message: "❌ Email não confirmado. Use o botão 'Reenviar Email' para receber nova confirmação.",
            requiresVerification: true 
          };
        }
        
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, message: "⚠️ Senha incorreta ou email não cadastrado no sistema" };
        }
        
        return { success: false, message: "❌ " + error.message };
      }

      // SISTEMA AUTOMÁTICO DE DETECÇÃO E REENVIO DE EMAIL
      if (!data.user.email_confirmed_at) {
        console.log('🚨 EMAIL NÃO CONFIRMADO DETECTADO para:', email);
        console.log('🔄 Iniciando reenvio automático de confirmação...');
        
        // TENTAR REENVIO AUTOMÁTICO IMEDIATAMENTE
        try {
          const resendResult = await resendConfirmationEmail(email);
          if (resendResult.success) {
            console.log('✅ Email de confirmação reenviado automaticamente!');
            return { 
              success: false, 
              message: "❌ Email não confirmado. ✅ Novo email de confirmação enviado automaticamente! Verifique sua caixa de entrada e pasta de spam.",
              requiresVerification: true 
            };
          } else {
            console.log('⚠️ Falha no reenvio automático:', resendResult.message);
          }
        } catch (error) {
          console.error('❌ Erro no reenvio automático durante login:', error);
        }
        
        return { 
          success: false, 
          message: "❌ Email não confirmado. Use o botão 'Reenviar Email' para receber nova confirmação.",
          requiresVerification: true 
        };
      }

      // Buscar dados adicionais do nosso banco
      let user = await storage.getUserByEmail(email);
      
      // Definir tipo de usuário baseado no email
      const isAdmin = email === 'passosmir4@gmail.com';
      const userType = isAdmin ? 'admin' : 'client';
      
      if (!user) {
        // Se não existe no nosso banco, criar com dados do Supabase
        user = await storage.createUser({
          username: data.user.user_metadata?.username || email.split('@')[0],
          email: email,
          fullName: data.user.user_metadata?.full_name || 'Usuário',
          phone: data.user.user_metadata?.phone,
          emailVerified: true, // Já foi verificado no Supabase
          passwordHash: '', // Não armazenamos hash quando usando Supabase
          supabaseId: data.user.id,
          userType: userType,
          tokens: 0, // Todos os usuários começam com 0 tokens (FREE mode)
          plan: "free", // Todos os usuários começam no plano FREE
          termsAccepted: true,
          termsAcceptedAt: new Date()
        });
      } else {
        // Atualizar status de verificação e tipo se necessário
        const updates: any = {};
        if (!user.emailVerified) updates.emailVerified = true;
        if (user.userType !== userType) updates.userType = userType;
        // Admin mantém plano do usuário (não forçamos plano especial)
        
        if (Object.keys(updates).length > 0) {
          user = await storage.updateUser(user.id, updates);
        }
      }

      return { success: true, user, message: "Login realizado com sucesso" };
    }

    // Fallback para autenticação local
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return { success: false, message: "Email ou senha incorretos" };
    }

    // Verificar senha
    if (!user.passwordHash) {
      return { success: false, message: "Conta inválida" };
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return { success: false, message: "Email ou senha incorretos" };
    }

    // Verificar se email foi verificado
    if (!user.emailVerified) {
      return { 
        success: false, 
        message: "Email não verificado. Verifique sua caixa de entrada.",
        requiresVerification: true 
      };
    }

    return { success: true, user, message: "Login realizado com sucesso!" };
  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, message: "Erro interno do servidor" };
  }
}

/**
 * Verificação de email
 */
export async function verifyEmail(token: string): Promise<AuthResult> {
  try {
    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      return { success: false, message: "Token de verificação inválido" };
    }

    const updatedUser = await storage.verifyUserEmail(user.id);
    if (!updatedUser) {
      return { success: false, message: "Erro ao verificar email" };
    }

    return { success: true, user: updatedUser, message: "Email verificado com sucesso!" };
  } catch (error) {
    console.error('Erro na verificação:', error);
    return { success: false, message: "Erro interno do servidor" };
  }
}