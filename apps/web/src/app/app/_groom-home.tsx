import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, eq, gte, sql } from 'drizzle-orm';
import {
  HorseIcon,
  CheckCircleIcon,
  CircleIcon,
  TrophyIcon,
  CalendarBlankIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import type { CurrentSession } from '@/lib/db/profile';

export async function GroomHome({
  session,
}: {
  session: CurrentSession & {
    primary: NonNullable<CurrentSession['primary']>;
  };
}) {
  const { primary, user, profile } = session;
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  const [horses, upcomingEvents] = await Promise.all([
    db
      .select({
        id: schema.horses.id,
        name: schema.horses.name,
        kind: schema.horses.kind,
        logCount: sql<number>`(
          SELECT count(*)::int FROM horse_care_logs hcl
          WHERE hcl.horse_id = ${schema.horses.id} AND hcl.for_date = ${today}
        )`,
      })
      .from(schema.horses)
      .where(
        and(
          eq(schema.horses.clubId, primary.clubId),
          eq(schema.horses.status, 'activo'),
        ),
      )
      .orderBy(schema.horses.name),

    db
      .select({
        id: schema.events.id,
        title: schema.events.title,
        startsAt: schema.events.startsAt,
        kind: schema.events.kind,
      })
      .from(schema.events)
      .where(
        and(
          eq(schema.events.clubId, primary.clubId),
          gte(schema.events.startsAt, now),
        ),
      )
      .orderBy(schema.events.startsAt)
      .limit(3),
  ]);

  const done = horses.filter((h) => h.logCount > 0);
  const pending = horses.filter((h) => h.logCount === 0);
  const firstName = (profile?.fullName ?? user.email).split(' ')[0];
  const allDone = pending.length === 0 && horses.length > 0;

  return (
    <div className="bg-mesh min-h-full">
      <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
        {/* Hero */}
        <header>
          <p className="label-eyebrow">Mozo · {primary.clubName}</p>
          <h1 className="mt-2 text-5xl font-bold tracking-tight text-stone-900 md:text-7xl">
            Hola, <span className="text-brand-700">{firstName}</span>.
          </h1>
          <p className="mt-3 text-sm font-medium text-stone-500">
            {allDone
              ? '¡Todo el checklist de hoy completado!'
              : `${pending.length} caballo${pending.length !== 1 ? 's' : ''} pendiente${pending.length !== 1 ? 's' : ''} hoy.`}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Checklist principal */}
          <section className="lg:col-span-2">
            <div className="surface-glass overflow-hidden p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-stone-900">
                  Checklist de hoy
                </h2>
                <span className="label-eyebrow">
                  {done.length}/{horses.length}
                </span>
              </div>

              {horses.length === 0 ? (
                <p className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-500">
                  No hay caballos activos en la cuadra.
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Pendientes primero */}
                  {pending.map((h) => (
                    <Link
                      key={h.id}
                      href={`/app/groom/${h.id}`}
                      className="group flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 transition hover:border-brand-300 hover:bg-white"
                    >
                      <CircleIcon
                        size={22}
                        weight="regular"
                        className="shrink-0 text-amber-400"
                      />
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                          <HorseIcon size={18} weight="duotone" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-stone-900">
                            {h.name}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                            {h.kind}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                        Pendiente
                      </span>
                      <ArrowRightIcon
                        size={14}
                        className="shrink-0 text-stone-300 transition group-hover:text-brand-600"
                      />
                    </Link>
                  ))}

                  {/* Hechos al final */}
                  {done.map((h) => (
                    <Link
                      key={h.id}
                      href={`/app/groom/${h.id}`}
                      className="group flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 transition hover:border-emerald-300 hover:bg-white"
                    >
                      <CheckCircleIcon
                        size={22}
                        weight="fill"
                        className="shrink-0 text-emerald-600"
                      />
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                          <HorseIcon size={18} weight="duotone" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-stone-500 line-through decoration-emerald-400">
                            {h.name}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                            {h.kind}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                        Hecho
                      </span>
                      <ArrowRightIcon
                        size={14}
                        className="shrink-0 text-stone-300 transition group-hover:text-emerald-600"
                      />
                    </Link>
                  ))}
                </div>
              )}

              {/* Barra de progreso */}
              {horses.length > 0 && (
                <div className="mt-5">
                  <div className="mb-1.5 flex justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                    <span>Progreso</span>
                    <span>
                      {Math.round((done.length / horses.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                      style={{
                        width: `${(done.length / horses.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Próximos eventos */}
          <section className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">
                Próximamente
              </h2>
              <p className="label-eyebrow">Club</p>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm font-medium text-stone-500">
                Sin eventos próximos.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-stone-50/70 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                      {e.kind === 'concurso_social' ? (
                        <TrophyIcon size={16} weight="duotone" />
                      ) : (
                        <CalendarBlankIcon size={16} weight="duotone" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-stone-900">
                        {e.title}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        {new Date(e.startsAt).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
