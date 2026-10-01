// Instância única do store de fatos relacionais.
//
// Mesma lógica do resto do projeto (storage.ts): usa o banco quando há DATABASE_URL,
// cai em memória quando não há. Trocar um pelo outro não toca em nenhuma rota.

import { MemFactStore, FactStore } from './relational-facts';
import { DrizzleFactStore } from './relational-store-db';

export const factStore: FactStore = process.env.DATABASE_URL
  ? new DrizzleFactStore()
  : new MemFactStore();

