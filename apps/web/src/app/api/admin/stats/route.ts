import { NextResponse } from 'next/server';
import { getCurrentUser } from '@equmanager/auth';
import { db, schema } from '@equmanager/database';
import { eq, gte, isNotNull, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type MonthRow = { month: string; n: number };

function buildSeries(rows: MonthRow[]) {
  const map = new Map(rows.map((r) => [r.month, r.n]));
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return {
      label: d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
      value: map.get(key) ?? 0,
    };
  });
}

export async function GET() {
  // Auth
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [profile] = await db
    .select({ isSuperadmin: schema.profiles.isSuperadmin })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, user.id))
    .limit(1)
    .catch(() => [{ isSuperadmin: false }]);

  if (!profile?.isSuperadmin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const n = sql<number>`count(*)::int`;

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 7000),
  );

  const queries = Promise.all([
    db.select({ n }).from(schema.clubs).then((r) => r[0]?.n ?? 0),
    db.select({ n }).from(schema.horses).then((r) => r[0]?.n ?? 0),
    db.select({ n }).from(schema.riders).then((r) => r[0]?.n ?? 0),
    db.select({ n }).from(schema.profiles).then((r) => r[0]?.n ?? 0),
    db.select({ n }).from(schema.directoryClubs).then((r) => r[0]?.n ?? 0),
    db.select({ n }).from(schema.clubs).where(isNotNull(schema.clubs.directoryClubId)).then((r) => r[0]?.n ?? 0),
    db
      .select({ month: sql<string>`to_char(${schema.clubs.createdAt}, 'YYYY-MM')`, n })
      .from(schema.clubs).where(gte(schema.clubs.createdAt, since))
      .groupBy(sql`to_char(${schema.clubs.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.clubs.createdAt}, 'YYYY-MM')`)
      .catch(() => [] as MonthRow[]),
    db
      .select({ month: sql<string>`to_char(${schema.horses.createdAt}, 'YYYY-MM')`, n })
      .from(schema.horses).where(gte(schema.horses.createdAt, since))
      .groupBy(sql`to_char(${schema.horses.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.horses.createdAt}, 'YYYY-MM')`)
      .catch(() => [] as MonthRow[]),
    db
      .select({ month: sql<string>`to_char(${schema.riders.createdAt}, 'YYYY-MM')`, n })
      .from(schema.riders).where(gte(schema.riders.createdAt, since))
      .groupBy(sql`to_char(${schema.riders.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.riders.createdAt}, 'YYYY-MM')`)
      .catch(() => [] as MonthRow[]),
    db
      .select({ month: sql<string>`to_char(${schema.profiles.createdAt}, 'YYYY-MM')`, n })
      .from(schema.profiles).where(gte(schema.profiles.createdAt, since))
      .groupBy(sql`to_char(${schema.profiles.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.profiles.createdAt}, 'YYYY-MM')`)
      .catch(() => [] as MonthRow[]),
  ]);

  try {
    const [clubs, horses, riders, profiles, directory, federated,
           clubsGrowth, horsesGrowth, ridersGrowth, profilesGrowth] =
      await Promise.race([queries, timeout]);

    return NextResponse.json({
      clubs,
      horses,
      riders,
      profiles,
      directory,
      federated,
      series: {
        clubs: buildSeries(clubsGrowth as MonthRow[]),
        horses: buildSeries(horsesGrowth as MonthRow[]),
        riders: buildSeries(ridersGrowth as MonthRow[]),
        profiles: buildSeries(profilesGrowth as MonthRow[]),
      },
    });
  } catch {
    return NextResponse.json({ error: 'timeout' }, { status: 504 });
  }
}
