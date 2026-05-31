import { unstable_cache } from 'next/cache';
import { db, schema } from '@equmanager/database';
import { and, isNotNull, gte, sql } from 'drizzle-orm';
import {
  BuildingsIcon,
  HorseIcon,
  GraduationCapIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  SealCheckIcon,
} from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page/PageHeader';
import { AdminGrowthChartWrapper } from '@/components/admin/AdminGrowthChartWrapper';

export const metadata = { title: 'Superadmin · Resumen' };
export const dynamic = 'force-dynamic';

type MonthRow = { month: string; n: number };

function buildSeries(rows: MonthRow[]): { label: string; value: number }[] {
  const map = new Map(rows.map((r) => [r.month, r.n]));
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    return { label, value: map.get(key) ?? 0 };
  });
}

// Todas las queries pesadas cacheadas 5 minutos. La ruta sigue siendo
// dinámica (auth en el layout) pero los datos no se recalculan en cada visita.
const getAdminStats = unstable_cache(
  async () => {
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const n = sql<number>`count(*)::int`;

    async function safe<T,>(p: Promise<T>, fallback: T): Promise<T> {
      try { return await p; } catch { return fallback; }
    }

    const [
      clubs, horses, riders, profiles, directory, federated,
      clubsGrowth, horsesGrowth, ridersGrowth, profilesGrowth,
    ] = await Promise.all([
      safe(db.select({ n }).from(schema.clubs).then(r => r[0]?.n ?? 0), 0),
      safe(db.select({ n }).from(schema.horses).then(r => r[0]?.n ?? 0), 0),
      safe(db.select({ n }).from(schema.riders).then(r => r[0]?.n ?? 0), 0),
      safe(db.select({ n }).from(schema.profiles).then(r => r[0]?.n ?? 0), 0),
      safe(db.select({ n }).from(schema.directoryClubs).then(r => r[0]?.n ?? 0), 0),
      safe(
        db.select({ n }).from(schema.clubs)
          .where(isNotNull(schema.clubs.directoryClubId))
          .then(r => r[0]?.n ?? 0),
        0,
      ),
      safe(
        db.select({
          month: sql<string>`to_char(${schema.clubs.createdAt}, 'YYYY-MM')`,
          n: sql<number>`count(*)::int`,
        })
        .from(schema.clubs)
        .where(gte(schema.clubs.createdAt, since))
        .groupBy(sql`to_char(${schema.clubs.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${schema.clubs.createdAt}, 'YYYY-MM')`) as Promise<MonthRow[]>,
        [] as MonthRow[],
      ),
      safe(
        db.select({
          month: sql<string>`to_char(${schema.horses.createdAt}, 'YYYY-MM')`,
          n: sql<number>`count(*)::int`,
        })
        .from(schema.horses)
        .where(gte(schema.horses.createdAt, since))
        .groupBy(sql`to_char(${schema.horses.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${schema.horses.createdAt}, 'YYYY-MM')`) as Promise<MonthRow[]>,
        [] as MonthRow[],
      ),
      safe(
        db.select({
          month: sql<string>`to_char(${schema.riders.createdAt}, 'YYYY-MM')`,
          n: sql<number>`count(*)::int`,
        })
        .from(schema.riders)
        .where(gte(schema.riders.createdAt, since))
        .groupBy(sql`to_char(${schema.riders.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${schema.riders.createdAt}, 'YYYY-MM')`) as Promise<MonthRow[]>,
        [] as MonthRow[],
      ),
      safe(
        db.select({
          month: sql<string>`to_char(${schema.profiles.createdAt}, 'YYYY-MM')`,
          n: sql<number>`count(*)::int`,
        })
        .from(schema.profiles)
        .where(gte(schema.profiles.createdAt, since))
        .groupBy(sql`to_char(${schema.profiles.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${schema.profiles.createdAt}, 'YYYY-MM')`) as Promise<MonthRow[]>,
        [] as MonthRow[],
      ),
    ]);

    return { clubs, horses, riders, profiles, directory, federated,
             clubsGrowth, horsesGrowth, ridersGrowth, profilesGrowth };
  },
  ['admin-stats'],
  { revalidate: 300 }, // 5 minutos
);

export default async function AdminHome() {
  const {
    clubs, horses, riders, profiles, directory, federated,
    clubsGrowth, horsesGrowth, ridersGrowth, profilesGrowth,
  } = await getAdminStats();

  const series = {
    clubs: buildSeries(clubsGrowth),
    horses: buildSeries(horsesGrowth),
    riders: buildSeries(ridersGrowth),
    profiles: buildSeries(profilesGrowth),
  };

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Resumen del sistema"
        description="Estado actual de Equmanager en todos los clubes."
      />

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Kpi
          icon={<BuildingsIcon size={22} weight="duotone" />}
          label="Clubes operativos"
          value={clubs}
          series={series.clubs}
          color="#0891b2"
        />
        <Kpi
          icon={<UsersIcon size={22} weight="duotone" />}
          label="Usuarios"
          value={profiles}
          series={series.profiles}
          color="#7c3aed"
        />
        <Kpi
          icon={<HorseIcon size={22} weight="duotone" />}
          label="Caballos"
          value={horses}
          series={series.horses}
          color="#b45309"
        />
        <Kpi
          icon={<GraduationCapIcon size={22} weight="duotone" />}
          label="Alumnos"
          value={riders}
          series={series.riders}
          color="#16a34a"
        />
        <Kpi
          icon={<MagnifyingGlassIcon size={22} weight="duotone" />}
          label="Directorio"
          value={directory}
        />
      </div>

      <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5">
        <div className="flex items-center gap-3">
          <SealCheckIcon size={28} weight="fill" className="text-emerald-700" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
              Clubes federados activos
            </div>
            <div className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              {federated}
              <span className="ml-2 text-lg font-bold text-emerald-700">
                / {directory}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-stone-600">
              Hípicas operativas que han reclamado su entrada del padrón
              oficial (RFHE o autonómicas).
            </p>
          </div>
        </div>
        {directory > 0 && (
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-all"
              style={{ width: `${(federated / directory) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  series,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  series?: { label: string; value: number }[];
  color?: string;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          {icon}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {label}
        </div>
      </div>
      <div className="mt-3 text-4xl font-bold tracking-tight text-stone-900">
        {value.toLocaleString('es-ES')}
      </div>
      {series && color && <AdminGrowthChartWrapper data={series} color={color} />}
    </div>
  );
}
