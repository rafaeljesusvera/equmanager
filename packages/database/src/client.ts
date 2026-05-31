/**
 * Cliente Drizzle único.
 *
 * Importante:
 *  - En servidor (Next.js route handlers, server components) usa este cliente
 *    con la service role key cuando necesites bypass de RLS para tareas admin,
 *    o con la anon key + auth.uid() para respetar las policies.
 *  - En el cliente NUNCA importes esto. Usa el SDK de supabase-js, que pasa
 *    por PostgREST y respeta RLS.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let cached: DrizzleClient | null = null;

function getClient(): DrizzleClient {
  if (cached) return cached;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      '[@equmanager/database] DATABASE_URL no está definida. Revisa .env.',
    );
  }

  // Pooler de Supabase. En serverless cada lambda mantiene su propio cliente
  // mientras está caliente. max=5 permite Promise.all sin colas largas.
  // El transaction-pooler (puerto 6543) admite cientos de conexiones
  // simultáneas en el pool global de Supabase.
  const queryClient = postgres(connectionString, {
    max: 20,
    idle_timeout: 20,
    max_lifetime: 1800, // recicla conexiones cada 30 min (bueno para serverless)
    connect_timeout: 10,
    prepare: false, // Transaction Pooler (PgBouncer) no soporta prepared statements
  });

  cached = drizzle(queryClient, { schema, logger: false });
  return cached;
}

// Proxy que difiere la creación del cliente real hasta el primer uso.
// Así el módulo se puede importar durante el build de Next.js (collect page
// data) sin necesidad de DATABASE_URL: solo falla cuando se hace una query.
export const db = new Proxy({} as DrizzleClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export type Database = DrizzleClient;
