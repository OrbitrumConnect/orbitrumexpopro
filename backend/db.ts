import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "./shared/schema";

const DATABASE_URL = process.env.DATABASE_URL;

let db: any;

if (DATABASE_URL) {
  const client = postgres(DATABASE_URL, { prepare: false });
  db = drizzle(client, { schema });
} else {
  console.error('[db] DATABASE_URL não definida — rodando sem banco (MemStorage fallback)');
  db = null;
}

export { db };
