// Script para restaurar admin master no MemStorage
import { storage } from './storage';

export async function restoreAdminMaster() {
  try {
    // Criar usuário admin master no MemStorage
    const adminUser = await storage.createUser({
      username: "admin",
      email: "passosmir4@gmail.com",
      password: "hashed_password_placeholder", // Hash real seria necessário
      emailVerified: true,
      userType: "admin" as any,
      plan: "max",
      tokens: 30000,
      tokensComprados: 15000,
      tokensPlano: 15000,
      adminLevel: 10
    });

    console.log('✅ Admin master restaurado:', adminUser);
    return adminUser;
  } catch (error) {
    console.error('❌ Erro ao restaurar admin:', error);
    throw error;
  }
}