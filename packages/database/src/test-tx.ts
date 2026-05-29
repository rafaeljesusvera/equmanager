import 'dotenv/config';
import { db, schema } from '@equmanager/database';
import { sql, eq } from 'drizzle-orm';

async function main() {
  console.log('using DB:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@'));
  const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.clubs);
  console.log('clubs:', c?.n);

  // 5 queries paralelas
  const start = Date.now();
  await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(schema.profiles),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.horses),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.riders),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.notifications),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.directoryClubs),
  ]);
  console.log('parallel queries:', Date.now() - start, 'ms');
  process.exit(0);
}
main().catch((e) => { console.error('FATAL', e.message ?? e); process.exit(1); });
