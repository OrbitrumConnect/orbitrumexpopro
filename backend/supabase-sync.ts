import { getSupabase } from './supabase-auth';
import { storage } from './storage';
import type { User } from '../shared/schema';

class SupabaseSync {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Iniciar sincronização automática
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Sincronizar imediatamente
    this.syncUsers();
    
    // Sincronizar a cada 5 minutos
    this.syncInterval = setInterval(() => {
      this.syncUsers();
    }, 5 * 60 * 1000); // 5 minutos
  }

  // Parar sincronização
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
  }

  // Sincronizar usuários do Supabase
  async syncUsers(): Promise<{ success: boolean; synced: number; total: number }> {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        return { success: false, synced: 0, total: 0 };
      }

      // Buscar usuários do Supabase
      const { data: supabaseUsers, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('❌ Erro ao buscar usuários do Supabase:', error.message);
        // Método alternativo: buscar via RPC ou public query
        try {
          const { data: altUsers, error: altError } = await supabase
            .from('auth.users')
            .select('*');
          
          if (!altError && altUsers?.length) {
            // Converter formato alternativo para formato esperado
            const convertedUsers = altUsers.map(u => ({
              id: u.id,
              email: u.email,
              email_confirmed_at: u.email_confirmed_at,
              user_metadata: u.raw_user_meta_data || {}
            }));
            
            const supabaseUsers = { users: convertedUsers };
          }
        } catch (altError) {
          console.error('❌ Método alternativo também falhou:', altError);
        }
        
        return { success: false, synced: 0, total: 0 };
      }

      if (!supabaseUsers?.users?.length) {
        return { success: true, synced: 0, total: 0 };
      }

      let syncedCount = 0;
      
      for (const supaUser of supabaseUsers.users) {
        try {
          // Verificar se já existe no MemStorage
          const existingUser = await storage.getUserByEmail(supaUser.email!);
          
          if (!existingUser) {
            // Determinar tipo de usuário baseado no email
            let userType: 'client' | 'professional' | 'admin' = 'client';
            let adminLevel = 0;
            
            if (supaUser.email === 'passosmir4@gmail.com') {
              userType = 'admin';
              adminLevel = 10;
            }
            
            const userData = {
              username: supaUser.user_metadata?.username || 
                       supaUser.user_metadata?.name || 
                       supaUser.email?.split('@')[0] || 
                       'user',
              email: supaUser.email!,
              passwordHash: 'supabase_auth',
              plan: 'free',
              dataInicioPlano: new Date(),
              tokens: 0,
              tokensPlano: 0,
              tokensGanhos: 0,
              tokensComprados: 0,
              tokensUsados: 0,
              creditosAcumulados: 0,
              creditosSacados: 0,
              canMakePurchases: false,
              userType,
              adminLevel,
              isActive: true,
              emailVerified: supaUser.email_confirmed_at ? true : false,
              supabaseId: supaUser.id,
              createdAt: new Date(supaUser.created_at),
              adminPermissions: userType === 'admin' ? ['all'] : []
            };

            await storage.createUser(userData);
            syncedCount++;
          } else {
            // Atualizar dados se necessário
            const needsUpdate = this.checkIfUserNeedsUpdate(existingUser, supaUser);
            if (needsUpdate) {
              await storage.updateUser(existingUser.id, {
                emailVerified: supaUser.email_confirmed_at ? true : false,
                isActive: true
              });
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao sincronizar ${supaUser.email}:`, error);
        }
      }

      return { success: true, synced: syncedCount, total: supabaseUsers.users.length };
    } catch (error) {
      console.error('❌ Erro na sincronização automática:', error);
      return { success: false, synced: 0, total: 0 };
    }
  }

  // Verificar se usuário precisa de atualização
  private checkIfUserNeedsUpdate(memUser: User, supaUser: any): boolean {
    const supaEmailVerified = supaUser.email_confirmed_at ? true : false;
    
    return (
      memUser.emailVerified !== supaEmailVerified ||
      !memUser.isActive
    );
  }

  // Sincronização manual (para API)
  async manualSync(): Promise<{ success: boolean; message: string; synced: number; total: number }> {
    try {
      const result = await this.syncUsers();
      
      if (!result.success) {
        return {
          success: false,
          message: 'Erro ao conectar com Supabase',
          synced: 0,
          total: 0
        };
      }

      return {
        success: true,
        message: `Sincronização concluída: ${result.synced} usuários adicionados de ${result.total} no Supabase`,
        synced: result.synced,
        total: result.total
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro interno na sincronização',
        synced: 0,
        total: 0
      };
    }
  }
}

// Instância única do sincronizador
export const supabaseSync = new SupabaseSync();