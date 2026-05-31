'use client';

import { useEffect, useState } from 'react';
import {
  BuildingsIcon,
  HorseIcon,
  GraduationCapIcon,
  UsersIcon,
  SealCheckIcon,
  ArrowClockwiseIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react/dist/ssr';
import { AdminGrowthChartWrapper } from '@/components/admin/AdminGrowthChartWrapper';

type Point = { label: string; value: number };

type Stats = {
  clubs: number;
  horses: number;
  riders: number;
  profiles: number;
  directory: number;
  federated: number;
  series: {
    clubs: Point[];
    horses: Point[];
    riders: Point[];
    profiles: Point[];
  };
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  function load(signal: AbortSignal) {
    setStatus('loading');
    setStats(null);
    fetch('/api/admin/stats', { signal })
      .then((r) => {
        if (!r.ok) throw new Error('error');
        return r.json() as Promise<Stats>;
      })
      .then((data) => {
        setStats(data);
        setStatus('ok');
      })
      .catch((e) => {
        if (e.name === 'AbortError') return; // navegación → no hacer nada
        setStatus('error');
      });
  }

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort(); // cancela si el usuario navega
  }, []);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
            Superadmin
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-stone-900">
            Estadísticas del sistema
          </h1>
          <p className="mt-1 text-sm font-medium text-stone-500">
            Evolución de los últimos 12 meses.
          </p>
        </div>
        {status === 'error' && (
          <button
            onClick={() => {
              const c = new AbortController();
              load(c.signal);
            }}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold text-stone-600 transition hover:bg-stone-100"
          >
            <ArrowClockwiseIcon size={14} weight="bold" />
            Reintentar
          </button>
        )}
      </div>

      {status === 'error' ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-red-100 bg-red-50 px-6 py-12 text-center">
          <WarningCircleIcon size={36} weight="duotone" className="text-red-400" />
          <p className="text-sm font-bold text-red-700">
            No se pudieron cargar las estadísticas
          </p>
          <p className="text-xs font-medium text-red-600">
            La base de datos tardó demasiado. Puedes volver a intentarlo o continuar usando el resto de la app.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard
            icon={<BuildingsIcon size={22} weight="duotone" />}
            label="Clubes operativos"
            value={stats?.clubs}
            series={stats?.series.clubs}
            color="#0891b2"
            loading={status === 'loading'}
            extra={
              stats && stats.directory > 0 ? (
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-500">
                    <SealCheckIcon size={13} weight="fill" className="text-emerald-600" />
                    {stats.federated} de {stats.directory} federados
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${(stats.federated / stats.directory) * 100}%` }}
                    />
                  </div>
                </div>
              ) : null
            }
          />
          <StatCard
            icon={<UsersIcon size={22} weight="duotone" />}
            label="Usuarios registrados"
            value={stats?.profiles}
            series={stats?.series.profiles}
            color="#7c3aed"
            loading={status === 'loading'}
          />
          <StatCard
            icon={<HorseIcon size={22} weight="duotone" />}
            label="Caballos"
            value={stats?.horses}
            series={stats?.series.horses}
            color="#b45309"
            loading={status === 'loading'}
          />
          <StatCard
            icon={<GraduationCapIcon size={22} weight="duotone" />}
            label="Alumnos"
            value={stats?.riders}
            series={stats?.series.riders}
            color="#16a34a"
            loading={status === 'loading'}
          />
        </div>
      )}
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
  loading,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  series: Point[] | undefined;
  color: string;
  loading: boolean;
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

      {loading ? (
        <>
          <div className="mt-3 h-9 w-20 animate-pulse rounded-xl bg-stone-100" />
          <div className="mt-3 h-16 w-full animate-pulse rounded-xl bg-stone-100" />
        </>
      ) : (
        <>
          <div className="mt-3 text-4xl font-bold tracking-tight text-stone-900">
            {value?.toLocaleString('es-ES') ?? '—'}
          </div>
          {series && series.length > 0 && (
            <AdminGrowthChartWrapper data={series} color={color} />
          )}
          {extra}
        </>
      )}
    </div>
  );
}
