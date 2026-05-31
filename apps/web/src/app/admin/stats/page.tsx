import { Suspense } from 'react';
import { db, schema } from '@equmanager/database';
import { isNotNull, gte, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import {
  BuildingsIcon,
  HorseIcon,
  GraduationCapIcon,
  UsersIcon,
  SealCheckIcon,
} from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page/PageHeader';
import { AdminGrowthChartWrapper } from '@/components/admin/AdminGrowthChartWrapper';

export const metadata = { title: 'Superadmin · Estadísticas' };
export const dynamic = 'force-dynamic';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function since11Months() {
  const d = new Date();
  d.setMonth(d.getMonth() - 11);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Una función cacheada por métrica ────────────────────────────────────────
// Cada una va en su propio Suspense → aparecen una a una según cargan

const getClubStats = unstable_cache(async () => {
  const since = since11Months();
  const n = sql<number>`count(*)::int`;
  const [total, growth, federated, directory] = await Promise.all([
    db.select({ n }).from(schema.clubs).then((r) => r[0]?.n ?? 0),
    db
      .select({ month: sql<string>`to_char(${schema.clubs.createdAt}, 'YYYY-MM')`, n: sql<number>`count(*)::int` })
      .from(schema.clubs).where(gte(schema.clubs.createdAt, since))
      .groupBy(sql`to_char(${schema.clubs.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.clubs.createdAt}, 'YYYY-MM')`)
      .catch(() => [] as MonthRow[]),
    db.select({ n }).from(schema.clubs).where(isNotNull(schema.clubs.directoryClubId)).then((r) => r[0]?.n ?? 0),
    db.select({ n }).from(schema.directoryClubs).then((r) => r[0]?.n ?? 0),
  ]);
  return { total, series: buildSeries(growth as MonthRow[]), federated, directory };
}, ['admin-stats-clubs'], { revalidate: 300 });

const getHorseStats = unstable_cache(async () => {
  const since = since11Months();
  const n = sql<number>`count(*)::int`;
  const [total, growth] = await Promise.all([
    db.select({ n }).from(schema.horses).then((r) => r[0]?.n ?? 0),
    db
      .select({ month: sql<string>`to_char(${schema.horses.createdAt}, 'YYYY-MM')`, n: sql<number>`count(*)::int` })
      .from(schema.horses).where(gte(schema.horses.createdAt, since))
      .groupBy(sql`to_char(${schema.horses.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.horses.createdAt}, 'YYYY-MM')`)
      .catch(() => [] as MonthRow[]),
  ]);
  return { total, series: buildSeries(growth as MonthRow[]) };
}, ['admin-stats-horses'], { revalidate: 300 });

const getRiderStats = unstable_cache(async () => {
  const since = since11Months();
  const n = sql<number>`count(*)::int`;
  const [total, growth] = await Promise.all([
    db.select({ n }).from(schema.riders).then((r) => r[0]?.n ?? 0),
    db
      .select({ month: sql<string>`to_char(${schema.riders.createdAt}, 'YYYY-MM')`, n: sql<number>`count(*)::int` })
      .from(schema.riders).where(gte(schema.riders.createdAt, since))
      .groupBy(sql`to_char(${schema.riders.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.riders.createdAt}, 'YYYY-MM')`)
      .catch(() => [] as MonthRow[]),
  ]);
  return { total, series: buildSeries(growth as MonthRow[]) };
}, ['admin-stats-riders'], { revalidate: 300 });

const getProfileStats = unstable_cache(async () => {
  const since = since11Months();
  const n = sql<number>`count(*)::int`;
  const [total, growth] = await Promise.all([
    db.select({ n }).from(schema.profiles).then((r) => r[0]?.n ?? 0),
    db
      .select({ month: sql<string>`to_char(${schema.profiles.createdAt}, 'YYYY-MM')`, n: sql<number>`count(*)::int` })
      .from(schema.profiles).where(gte(schema.profiles.createdAt, since))
      .groupBy(sql`to_char(${schema.profiles.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.profiles.createdAt}, 'YYYY-MM')`)
      .catch(() => [] as MonthRow[]),
  ]);
  return { total, series: buildSeries(growth as MonthRow[]) };
}, ['admin-stats-profiles'], { revalidate: 300 });

// ─── Async cards (cada uno en su Suspense) ───────────────────────────────────

async function ClubCard() {
  const { total, series, federated, directory } = await getClubStats();
  return (
    <StatCard
      icon={<BuildingsIcon size={22} weight="duotone" />}
      label="Clubes operativos"
      value={total}
      series={series}
      color="#0891b2"
      extra={
        directory > 0 ? (
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-500">
              <SealCheckIcon size={13} weight="fill" className="text-emerald-600" />
              {federated} de {directory} federados
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${(federated / directory) * 100}%` }}
              />
            </div>
          </div>
        ) : null
      }
    />
  );
}

async function HorseCard() {
  const { total, series } = await getHorseStats();
  return (
    <StatCard
      icon={<HorseIcon size={22} weight="duotone" />}
      label="Caballos"
      value={total}
      series={series}
      color="#b45309"
    />
  );
}

async function RiderCard() {
  const { total, series } = await getRiderStats();
  return (
    <StatCard
      icon={<GraduationCapIcon size={22} weight="duotone" />}
      label="Alumnos"
      value={total}
      series={series}
      color="#16a34a"
    />
  );
}

async function ProfileCard() {
  const { total, series } = await getProfileStats();
  return (
    <StatCard
      icon={<UsersIcon size={22} weight="duotone" />}
      label="Usuarios registrados"
      value={total}
      series={series}
      color="#7c3aed"
    />
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-stone-100" />
        <div className="h-3 w-24 animate-pulse rounded-full bg-stone-100" />
      </div>
      <div className="mt-3 h-9 w-20 animate-pulse rounded-xl bg-stone-100" />
      <div className="mt-3 h-16 w-full animate-pulse rounded-xl bg-stone-100" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStatsPage() {
  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Estadísticas del sistema"
        description="Evolución de los últimos 12 meses. Los datos se cargan de forma progresiva y se cachean 5 minutos."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Suspense fallback={<CardSkeleton />}>
          <ClubCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <ProfileCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <HorseCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <RiderCard />
        </Suspense>
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  series,
  color,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  series: { label: string; value: number }[];
  color: string;
  extra?: React.ReactNode;
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
      {series.length > 0 && (
        <AdminGrowthChartWrapper data={series} color={color} />
      )}
      {extra}
    </div>
  );
}
