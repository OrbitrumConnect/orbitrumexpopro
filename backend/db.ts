import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL nao configurada - usando sistema local");
}

// Configuração para Supabase - desabilitar prefetch para modo Transaction pool
const client = postgres(process.env.DATABASE_URL, { prepare: false });
export const db = drizzle(client, { schema });
