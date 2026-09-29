// 🗄️ FactStore sobre Postgres (Supabase) — a persistência real da camada de fatos.
//
// Implementa a MESMA interface FactStore do MemFactStore. Nenhuma regra de negócio
// mora aqui: validade, confiança, decay e §35 continuam no motor (relational-facts.ts).
// Aqui só entra/sai linha do banco, no padrão Drizzle do projeto (db.ts).
//
// Trocar memória por banco é uma linha em relational-store.ts. Nenhuma rota muda.

import { eq } from 'drizzle-orm';
import { db } from './db';
import { relationalFacts, connections } from '@shared/schema';
import type { FactStore } from './relational-facts';
import type { RelationalFact, InsertRelationalFact, Connection } from '@shared/schema';

export class DrizzleFactStore implements FactStore {
  async insertFact(fact: InsertRelationalFact): Promise<RelationalFact> {
    const [row] = await db.insert(relationalFacts).values(fact).returning();
    return row;
  }

  async listFacts(): Promise<RelationalFact[]> {
    return db.select().from(relationalFacts);
  }

  async updateFact(id: number, patch: Partial<RelationalFact>): Promise<void> {
    await db.update(relationalFacts).set(patch).where(eq(relationalFacts.id, id));
  }

  async listConnections(): Promise<Connection[]> {
    return db.select().from(connections);
  }

  async insertConnection(c: Omit<Connection, 'id'>): Promise<Connection> {
    const [row] = await db.insert(connections).values(c as any).returning();
    return row;
  }
}
