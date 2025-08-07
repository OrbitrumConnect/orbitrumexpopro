import type { Express } from "express";
import { registerUser, loginUser, verifyEmail, initializeSupabase, resendConfirmationEmail, loginWithGoogle } from "./supabase-auth";
import { storage } from "./storage";
import { z } from "zod";

// Função para detectar URL base automaticamente
function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'production' || process.env.REPLIT_DOMAINS) {
    // Usar o domínio Replit atual para Google OAuth
    return `https://gnvxnsgewhjucdhwrrdi-00-yjltuxvct4sz.janeway.replit.dev`;
  }
  return 'http://localhost:5000';
}

// Para acessar a instância do Supabase
let supabase: any = null;

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  fullName: z.string().min(2, "Nome completo obrigatório"),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, "Deve aceitar os termos")
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória")
});

export function setupAuthRoutes(app: Express) {
  // Inicializar Supabase se as keys estiverem disponíveis
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    supabase = initializeSupabase(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    console.log('🔐 Supabase Auth inicializado');
  } else {
    console.log('⚠️ Supabase Auth não configurado - usando autenticação local');
  }

  // Registro via Supabase Auth
  app.post('/api/auth/register', async (req, res) => {
    try {
      // Mapear campos do frontend corretamente
      const { 
        email, 
        password, 
        username, 
        fullName, 
        phone,
        // Campos alternativos para compatibilidade
        nomeCompleto, 
        senha, 
        telefone, 
        cpf, 
        tipo 
      } = req.body;
      
      // Usar campos corretos com fallback
      const finalEmail = email;
      const finalPassword = password || senha;
      const finalFullName = fullName || nomeCompleto || username;
      const finalPhone = phone || telefone;
      
      console.log('📝 Tentativa de cadastro via Supabase:', { finalFullName, finalEmail, finalPassword: '***' });
      
      if (!finalEmail || !finalPassword || !finalFullName) {
        return res.status(400).json({
          success: false,
          message: "Email, senha e nome são obrigatórios"
        });
      }
      
      // Gerar username único baseado no nome
      const baseUsername = (username || finalFullName).toLowerCase().replace(/\s+/g, '_').substring(0, 20);
      let finalUsername = baseUsername;
      let counter = 1;
      
      while (await storage.getUserByUsername(finalUsername)) {
        finalUsername = `${baseUsername}_${counter}`;
        counter++;
      }

      // Usar a função registerUser do Supabase
      const result = await registerUser(
        finalEmail,
        finalPassword,
        finalUsername,
        finalFullName,
        finalPhone
      );

      if (result.success) {
        console.log('✅ Usuário registrado no Supabase:', { email, requiresVerification: result.requiresVerification });
        
        res.status(201).json({
          success: true,
          message: result.requiresVerification 
            ? "Cadastro realizado! Verifique seu email para confirmar a conta."
            : "Conta criada com sucesso!",
          requiresVerification: result.requiresVerification,
          user: result.user ? {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            fullName: result.user.fullName
          } : undefined
        });
      } else {
        console.log('❌ Erro no registro Supabase:', result.message);
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('❌ Erro no cadastro:', error);
      res.status(500).json({
        success: false,
        message: "Erro ao criar conta. Tente novamente."
      });
    }
  });

  // Verificação de email
  app.get('/api/auth/verify', async (req, res) => {
    try {
      const { token, type } = req.query;
      
      console.log('🔐 Tentativa de verificação de email:', { token: token?.toString().substring(0, 20), type });
      
      if (!token) {
        return res.redirect('/?error=token_missing');
      }

      // Usar a função verifyEmail do Supabase
      const result = await verifyEmail(token.toString());
      
      if (result.success) {
        console.log('✅ Email verificado com sucesso:', { email: result.user?.email });
        // Redirecionar para página de sucesso ou login
        res.redirect('/?verified=true');
      } else {
        console.log('❌ Falha na verificação:', result.message);
        res.redirect('/?error=verification_failed');
      }
      
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
      res.redirect('/?error=verification_error');
    }
  });

  // Callback do Google OAuth
  app.get('/auth/callback', async (req, res) => {
    try {
      console.log('🔄 Callback Google OAuth recebido');
      
      if (!supabase) {
        console.error('❌ Supabase não configurado');
        return res.redirect('/?error=supabase_not_configured');
      }

      // Processar o callback do OAuth
      const { data, error } = await supabase.auth.getSessionFromUrl(req.url);
      
      if (error) {
        console.error('❌ Erro no callback Google:', error.message);
        return res.redirect('/?error=oauth_callback_failed');
      }

      if (data.session && data.session.user) {
        const user = data.session.user;
        console.log('✅ Login Google bem-sucedido:', { email: user.email, name: user.user_metadata?.full_name });

        // Criar ou atualizar usuário no nosso sistema
        try {
          let localUser = await storage.getUserByEmail(user.email!);
          const userType = req.session?.pendingUserType || 'client';
          
          if (!localUser) {
            // Para profissionais, não criar ainda - precisa de categoria
            if (userType === 'professional') {
              console.log('👔 Profissional precisa completar categoria primeiro');
              
              // Limpar o tipo pendente da sessão
              if (req.session?.pendingUserType) {
                delete req.session.pendingUserType;
              }
              
              return res.redirect(`/?google_login=success&type=professional&needs_category=true&email=${encodeURIComponent(user.email!)}`);
            }
            
            // Para clientes, criar normalmente
            localUser = await storage.createUser({
              username: user.user_metadata?.full_name?.toLowerCase().replace(/\s+/g, '_') || user.email!.split('@')[0],
              email: user.email!,
              fullName: user.user_metadata?.full_name || user.email!,
              emailVerified: true, // Google OAuth já verifica email
              supabaseId: user.id,
              userType: 'client'
            });
            
            console.log(`👤 Novo usuário cliente criado via Google:`, localUser.email);
          } else {
            // Atualizar usuário existente
            await storage.updateUser(localUser.id, {
              emailVerified: true,
              supabaseId: user.id,
              userType: userType as 'client' | 'professional'
            });
            
            console.log(`🔄 Usuário existente atualizado via Google como ${userType}:`, localUser.email);
          }

          // Limpar o tipo pendente da sessão
          if (req.session?.pendingUserType) {
            delete req.session.pendingUserType;
          }

          // Redirecionar baseado no tipo de usuário
          const redirectPath = userType === 'professional' 
            ? '/?google_login=success&type=professional' 
            : '/?google_login=success&type=client';
          
          return res.redirect(redirectPath);
        } catch (dbError) {
          console.error('❌ Erro ao processar usuário Google:', dbError);
          return res.redirect('/?error=user_processing_failed');
        }
      }

      res.redirect('/?error=no_session');
    } catch (error) {
      console.error('❌ Erro no callback Google:', error);
      res.redirect('/?error=callback_error');
    }
  });

  // Rota alternativa para confirmação (caso o Supabase use um path diferente)
  app.get('/auth/confirm', async (req, res) => {
    try {
      const { token_hash, type, access_token, refresh_token } = req.query;
      
      console.log('🔐 Confirmação via /auth/confirm:', { 
        token_hash: token_hash?.toString().substring(0, 20), 
        access_token: access_token?.toString().substring(0, 20),
        type 
      });
      
      // Se temos access_token, significa que a confirmação foi bem-sucedida
      if (access_token) {
        console.log('✅ Confirmação bem-sucedida via access_token');
        
        // Decodificar o token para obter informações do usuário
        try {
          const tokenParts = access_token.toString().split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            console.log('📧 Email do token:', payload.email);
            
            // Marcar usuário como verificado no nosso banco
            const user = await storage.getUserByEmail(payload.email);
            if (user) {
              await storage.updateUser(user.id, { emailVerified: true });
              console.log('✅ Usuário marcado como verificado:', { id: user.id, email: user.email });
            }
          }
        } catch (error) {
          console.log('⚠️ Erro ao processar token, mas continuando:', error);
        }
        
        return res.redirect('/?verified=true&logged_in=true');
      }
      
      if (!token_hash) {
        return res.redirect('/?error=token_missing');
      }

      // Tentar verificar usando o Supabase diretamente
      if (supabase) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token_hash.toString(),
          type: type as any || 'signup'
        });

        if (error) {
          console.log('❌ Erro na confirmação Supabase:', error.message);
          return res.redirect('/?error=confirmation_failed');
        }

        console.log('✅ Confirmação Supabase bem-sucedida:', { email: data.user?.email });
        return res.redirect('/?verified=true');
      }

      res.redirect('/?error=supabase_not_configured');
      
    } catch (error) {
      console.error('❌ Erro na confirmação:', error);
      res.redirect('/?error=confirmation_error');
    }
  });

  // Login com Google OAuth
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { userType = 'client' } = req.body;
      
      console.log('🔍 Iniciando Google OAuth para tipo:', userType);
      console.log('🔑 GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Configurado' : 'NÃO CONFIGURADO');
      console.log('🔑 GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Configurado' : 'NÃO CONFIGURADO');
      console.log('🌐 Base URL:', getBaseUrl());
      
      // Salvar o tipo de usuário na sessão para usar no callback
      if (req.session) {
        req.session.pendingUserType = userType;
      }
      
      const result = await loginWithGoogle();
      
      if (result.success && result.url) {
        res.json({
          success: true,
          redirectUrl: result.url,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Erro no login Google:', error);
      res.status(500).json({
        success: false,
        message: "Erro interno no login Google"
      });
    }
  });

  // Login de usuário
  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const result = await loginUser(validatedData.email, validatedData.password);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          user: result.user ? {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            emailVerified: result.user.emailVerified,
            userType: result.user.userType,
            plan: result.user.plan,
            tokens: result.user.tokens
          } : undefined
        });
      } else {
        res.status(401).json({
          success: false,
          message: result.message,
          requiresVerification: result.requiresVerification
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: error.errors
        });
      } else {
        console.error('Erro no login:', error);
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor"
        });
      }
    }
  });

  // Verificação de email
  app.get('/api/auth/verify/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const result = await verifyEmail(token);

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Erro na verificação:', error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // Reenviar email de confirmação
  app.post('/api/auth/resend-confirmation', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email é obrigatório"
        });
      }

      console.log('📧 Tentativa de reenvio de confirmação para:', email);

      if (supabase) {
        // Verificar se o usuário existe no nosso banco primeiro
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Email não encontrado no sistema. Verifique se o email está correto ou faça um novo cadastro."
          });
        }

        // Tentar reenvio com múltiplas tentativas
        let attempts = 0;
        const maxAttempts = 3;
        let lastError = null;

        while (attempts < maxAttempts) {
          attempts++;
          console.log(`📧 Tentativa ${attempts}/${maxAttempts} de reenvio para ${email}...`);

          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: getBaseUrl() + '/auth/confirm'
            }
          });

          if (!error) {
            console.log(`✅ Email de confirmação reenviado com sucesso na tentativa ${attempts} para:`, email);
            return res.json({
              success: true,
              message: `✅ Email de confirmação reenviado! Verifique sua caixa de entrada e pasta de spam. (Tentativa ${attempts}/${maxAttempts})`
            });
          }

          lastError = error;
          console.log(`❌ Erro na tentativa ${attempts}:`, error.message);

          // Se não é a última tentativa, aguardar antes de tentar novamente
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        // Se chegou aqui, todas as tentativas falharam
        console.log('❌ Falha após todas as tentativas de reenvio:', lastError?.message);
        return res.status(400).json({
          success: false,
          message: `Falha no envio após ${maxAttempts} tentativas. ${lastError?.message || 'Erro desconhecido'}. Tente novamente em alguns minutos ou entre em contato com o suporte.`
        });

      } else {
        res.status(400).json({
          success: false,
          message: "Sistema de email não configurado"
        });
      }
    } catch (error) {
      console.error('❌ Erro ao reenviar confirmação:', error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // Verificação manual de email (para administradores)
  app.post('/api/auth/manual-verify', async (req, res) => {
    try {
      const { email, adminKey } = req.body;
      
      // Verificação básica de admin (você pode melhorar isso)
      if (adminKey !== 'orbitrum2025admin') {
        return res.status(403).json({
          success: false,
          message: "Acesso negado"
        });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }

      // Marcar email como verificado manualmente
      await storage.updateUser(user.id, { emailVerified: true });
      
      console.log('✅ Email verificado manualmente pelo admin:', email);
      res.json({
        success: true,
        message: "Email verificado manualmente com sucesso"
      });
    } catch (error) {
      console.error('❌ Erro na verificação manual:', error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // Completar cadastro profissional com categoria
  app.post('/api/auth/complete-professional', async (req, res) => {
    try {
      const { email, category, specialty } = req.body;
      
      console.log('📝 Completando cadastro profissional:', { email, category, specialty });
      
      if (!email || !category || !specialty) {
        return res.status(400).json({
          success: false,
          message: 'Email, categoria e especialidade são obrigatórios'
        });
      }

      // Verificar se já existe usuário com este email
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Usuário já existe com este email'
        });
      }

      // Criar usuário profissional com categoria
      const newUser = await storage.createUser({
        username: email.split('@')[0],
        email: email,
        fullName: email.split('@')[0], // Será atualizado no perfil
        emailVerified: true,
        userType: 'professional'
      });

      console.log('✅ Profissional criado com categoria:', { email, category, specialty });
      
      res.json({
        success: true,
        message: 'Cadastro profissional completado com sucesso',
        user: {
          id: newUser.id,
          email: newUser.email,
          userType: newUser.userType
        }
      });

    } catch (error) {
      console.error('❌ Erro ao completar cadastro profissional:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao completar cadastro'
      });
    }
  });

  // Status da autenticação
  app.get('/api/auth/status', (req, res) => {
    res.json({
      supabaseConfigured: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
      localAuthFallback: true
    });
  });
}