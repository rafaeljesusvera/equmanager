import Link from 'next/link';
import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import { db, schema } from '@equmanager/database';
import { isNotNull, sql } from 'drizzle-orm';
import {
  BuildingsIcon,
  HorseIcon,
  GraduationCapIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  SealCheckIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page/PageHeader';

export const metadata = { title: 'Superadmin · Resumen' };
export const dynamic = 'force-dynamic';

// ─── Queries (cacheadas 5 min, solo se ejecutan si la cache está fría) ────────

const getCounts = unstable_cache(
  async () => {
    const n = sql<number>`count(*)::int`;
    const [clubs, horses, riders, profiles, directory, federated] =
      await Promise.all([
        db.select({ n }).from(schema.clubs).then((r) => r[0]?.n ?? 0),
        db.select({ n }).from(schema.horses).then((r) => r[0]?.n ?? 0),
        db.select({ n }).from(schema.riders).then((r) => r[0]?.n ?? 0),
        db.select({ n }).from(schema.profiles).then((r) => r[0]?.n ?? 0),
        db.select({ n }).from(schema.directoryClubs).then((r) => r[0]?.n ?? 0),
        db
          .select({ n })
          .from(schema.clubs)
          .where(isNotNull(schema.clubs.directoryClubId))
          .then((r) => r[0]?.n ?? 0),
      ]);
    return { clubs, horses, riders, profiles, directory, federated };
  },
  ['admin-counts'],
  { revalidate: 300 },
);

// ─── Componente diferido (se carga tras el shell) ─────────────────────────────

async function KpiCards() {
  const { clubs, horses, riders, profiles, directory, federated } =
    await getCounts();
  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Kpi href="/admin/clubs" icon={<BuildingsIcon size={22} weight="duotone" />} label="Clubes" value={clubs} color="bg-cyan-100 text-cyan-700" />
        <Kpi href="/admin/users" icon={<UsersIcon size={22} weight="duotone" />} label="Usuarios" value={profiles} color="bg-violet-100 text-violet-700" />
        <Kpi href="/admin/horses" icon={<HorseIcon size={22} weight="duotone" />} label="Caballos" value={horses} color="bg-amber-100 text-amber-700" />
        <Kpi href="/admin/clubs" icon={<GraduationCapIcon size={22} weight="duotone" />} label="Alumnos" value={riders} color="bg-emerald-100 text-emerald-700" />
        <Kpi href="/admin/directory" icon={<MagnifyingGlassIcon size={22} weight="duotone" />} label="Directorio" value={directory} color="bg-stone-100 text-stone-600" />
      </div>

      {directory > 0 && (
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
                Hípicas operativas que han reclamado su entrada del padrón oficial.
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-all"
              style={{ width: `${(federated / directory) * 100}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function KpiSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-3xl bg-stone-100" />
      ))}
    </div>
  );
}

// ─── Secciones de navegación rápida ──────────────────────────────────────────

const SECTIONS = [
  { href: '/admin/clubs', icon: <BuildingsIcon size={20} weight="duotone" />, label: 'Clubes', desc: 'Operativos y planes' },
  { href: '/admin/users', icon: <UsersIcon size={20} weight="duotone" />, label: 'Usuarios', desc: 'Perfiles y roles' },
  { href: '/admin/horses', icon: <HorseIcon size={20} weight="duotone" />, label: 'Caballos', desc: 'Todos los clubes' },
  { href: '/admin/directory', icon: <MagnifyingGlassIcon size={20} weight="duotone" />, label: 'Directorio', desc: 'Padrón oficial RFHE' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminHome() {
  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Resumen del sistema"
        description="Estado actual de Equmanager en todos los clubes."
      />

      {/* Acceso rápido — siempre instantáneo, sin queries */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-card transition hover:border-brand-200 hover:bg-brand-50/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 transition group-hover:bg-brand-100 group-hover:text-brand-700">
              {s.icon}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-stone-900">{s.label}</div>
              <div className="truncate text-[11px] font-medium text-stone-500">{s.desc}</div>
            </div>
            <ArrowRightIcon size={14} weight="bold" className="ml-auto shrink-0 text-stone-300 transition group-hover:text-brand-500" />
          </Link>
        ))}
      </div>

      {/* KPIs — se cargan en diferido, la página no espera */}
      <Suspense fallback={<KpiSkeleton />}>
        <KpiCards />
      </Suspense>
    </div>
  );
}

function Kpi({
  href,
  icon,
  label,
  value,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Link href={href} className="group rounded-3xl border border-stone-200 bg-white p-5 shadow-card transition hover:border-brand-200">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${color}`}>
          {icon}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {label}
        </div>
      </div>
      <div className="mt-3 text-4xl font-bold tracking-tight text-stone-900">
        {value.toLocaleString('es-ES')}
      </div>
    </Link>
  );
}
