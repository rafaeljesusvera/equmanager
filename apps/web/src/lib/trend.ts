import { db } from '@equmanager/database';
import { and, eq, gte, sql } from 'drizzle-orm';
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core';

export type TrendPoint = { label: string; value: number };

/**
 * Calcula una serie de los últimos 12 meses para cualquier tabla que tenga
 * clubId y createdAt. Devuelve puntos { label, value } listos para la gráfica
 * junto con el total acumulado actual.
 */
export async function buildTrend(
  table: PgTable & { createdAt: PgColumn; clubId: PgColumn },
  clubId: string,
): Promise<{ series: TrendPoint[]; total: number }> {
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  try {
    const [rows, countRow] = await Promise.all([
      db
        .select({
          month: sql<string>`to_char(${table.createdAt}, 'YYYY-MM')`,
          n: sql<number>`count(*)::int`,
        })
        .from(table)
        .where(and(eq(table.clubId, clubId), gte(table.createdAt, since)))
        .groupBy(sql`to_char(${table.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${table.createdAt}, 'YYYY-MM')`),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(table)
        .where(eq(table.clubId, clubId)),
    ]);

    const map = new Map(rows.map((r) => [r.month, r.n]));
    const now = new Date();
    const series = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      return { label, value: map.get(key) ?? 0 };
    });

    return { series, total: countRow[0]?.n ?? 0 };
  } catch {
    return { series: [], total: 0 };
  }
}
