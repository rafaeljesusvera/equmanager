import Image from 'next/image';
import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import {
  CalendarBlankIcon,
  HorseIcon,
  MedalIcon,
  ChatCircleTextIcon,
  TrophyIcon,
  ArrowRightIcon,
  TicketIcon,
  LockKeyIcon,
  SparkleIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Avatar, Badge, EmptyState } from '@/components/ui';
import { BadgeCard } from '@/components/badge/BadgeCard';
import { formatCents, formatDate, formatDateTime } from '@/lib/format';
import type { CurrentSession } from '@/lib/db/profile';
import { ensureRiderForProfile } from '@/lib/db/rider';

/**
 * Home visual para alumnos: hero + insignias destacadas + próximas clases,
 * caballos favoritos, bonos activos, eventos abiertos y notificaciones.
 */
export async function RiderHome({ session }: { session: CurrentSession & { primary: NonNullable<CurrentSession['primary']> } }) {
  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );
  const clubId = session.primary.clubId;
  const now = new Date();

  // --- Datos ----------------------------------------------------------
  const upcoming = await db
    .select({
      attendeeId: schema.lessonAttendees.id,
      lessonId: schema.lessons.id,
      date: schema.lessons.date,
      discipline: schema.lessons.discipline,
      horseName: schema.horses.name,
      horsePhoto: schema.horses.photoUrl,
    })
    .from(schema.lessonAttendees)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonAttendees.lessonId))
    .leftJoin(schema.horses, eq(schema.horses.id, schema.lessonAttendees.horseId))
    .where(
      and(
        eq(schema.lessonAttendees.riderId, rider!.id),
        gte(schema.lessons.date, now),
      ),
    )
    .orderBy(schema.lessons.date)
    .limit(3);

  const allBadges = await db
    .select()
    .from(schema.badges)
    .where(eq(schema.badges.clubId, clubId))
    .orderBy(schema.badges.name);

  const awarded = await db
    .select({
      awardId: schema.riderBadges.id,
      badgeId: schema.riderBadges.badgeId,
      awardedAt: schema.riderBadges.awardedAt,
    })
    .from(schema.riderBadges)
    .where(eq(schema.riderBadges.riderId, rider!.id))
    .orderBy(desc(schema.riderBadges.awardedAt));

  const awardedMap = new Map(awarded.map((a) => [a.badgeId, a]));
  const unlocked = allBadges.filter((b) => awardedMap.has(b.id));
  const locked = allBadges.filter((b) => !awardedMap.has(b.id));
  const featured =
    unlocked[0]
      ? { badge: unlocked[0], info: awardedMap.get(unlocked[0].id)! }
      : locked[0]
        ? { badge: locked[0], info: null }
        : null;

  const topHorses = await db
    .select({
      horseId: schema.lessonAttendees.horseId,
      horseName: schema.horses.name,
      photoUrl: schema.horses.photoUrl,
      kind: schema.horses.kind,
      rides: sql<number>`count(*)::int`,
    })
    .from(schema.lessonAttendees)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonAttendees.lessonId))
    .innerJoin(schema.horses, eq(schema.horses.id, schema.lessonAttendees.horseId))
    .where(
      and(
        eq(schema.lessonAttendees.riderId, rider!.id),
        eq(schema.lessonAttendees.attended, true),
      ),
    )
    .groupBy(
      schema.lessonAttendees.horseId,
      schema.horses.name,
      schema.horses.photoUrl,
      schema.horses.kind,
    )
    .orderBy(desc(sql`count(*)`))
    .limit(3);

  const myBonos = await db
    .select({
      id: schema.bonoPurchases.id,
      classesLeft: schema.bonoPurchases.classesLeft,
      purchasedAt: schema.bonoPurchases.purchasedAt,
      expiresAt: schema.bonoPurchases.expiresAt,
      name: schema.bonos.name,
      totalClasses: schema.bonos.totalClasses,
      photoUrl: schema.bonos.photoUrl,
      priceCents: schema.bonos.priceCents,
    })
    .from(schema.bonoPurchases)
    .innerJoin(schema.bonos, eq(schema.bonos.id, schema.bonoPurchases.bonoId))
    .where(eq(schema.bonoPurchases.riderId, rider!.id))
    .orderBy(desc(schema.bonoPurchases.purchasedAt))
    .limit(2);

  const upcomingEvents = await db
    .select()
    .from(schema.events)
    .where(
      and(
        eq(schema.events.clubId, clubId),
        eq(schema.events.status, 'publicado'),
        gte(schema.events.startsAt, now),
      ),
    )
    .orderBy(schema.events.startsAt)
    .limit(2);

  const lastFeedback = await db
    .select({
      id: schema.lessonFeedback.id,
      body: schema.lessonFeedback.body,
      source: schema.lessonFeedback.source,
      createdAt: schema.lessonFeedback.createdAt,
      lessonDate: schema.lessons.date,
    })
    .from(schema.lessonFeedback)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonFeedback.lessonId))
    .where(eq(schema.lessonFeedback.riderId, rider!.id))
    .orderBy(desc(schema.lessonFeedback.createdAt))
    .limit(1);

  return (
    <div className="bg-mesh min-h-full">
      <div className="stagger mx-auto max-w-6xl space-y-6 p-6 md:p-10">
        {/* Hero */}
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <Avatar
              name={rider!.name}
              src={rider!.photoUrl}
              size="2xl"
              square
              className="shadow-lift"
            />
            <div className="min-w-0">
              <p className="label-eyebrow">
                Alumno · {rider!.category.replace('_', ' ')} · {rider!.tier}
              </p>
              <h1 className="mt-1 font-display text-4xl font-normal leading-[0.95] tracking-tightest text-stone-900 md:text-6xl">
                Hola,{' '}
                <span className="italic text-brand-700">
                  {rider!.name.split(' ')[0]}
                </span>
                .
              </h1>
              <p className="mt-2 text-sm font-medium text-stone-500 md:text-base">
                Lo que pasa hoy en{' '}
                <span className="font-bold text-stone-700">
                  {session.primary.clubName}
                </span>
                .
              </p>
            </div>
          </div>
        </header>

        {/* ░░░░ INSIGNIAS DESTACADAS ░░░░ */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-rose-50 to-brand-50 p-6 shadow-lift md:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-brand-300/25 blur-3xl"
          />

          <div className="relative">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-800">
                  <SparkleIcon size={11} weight="fill" /> Tu colección
                </p>
                <h2 className="mt-2 font-display text-3xl font-normal leading-[1] tracking-tightest text-stone-900 md:text-5xl">
                  Insignias{' '}
                  <span className="italic text-brand-700">por conquistar</span>
                </h2>
                <p className="mt-2 text-sm font-medium text-stone-600">
                  Llevas{' '}
                  <span className="font-bold text-stone-900">
                    {unlocked.length}
                  </span>{' '}
                  de{' '}
                  <span className="font-bold text-stone-900">
                    {allBadges.length}
                  </span>
                  . ¡A por ellas!
                </p>
              </div>
              <Link
                href="/app/me/badges"
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-lift transition hover:bg-brand-800"
              >
                Ver colección
                <ArrowRightIcon size={12} weight="bold" />
              </Link>
            </div>

            {/* Barra de progreso */}
            {allBadges.length > 0 && (
              <div className="mb-6">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/70">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 via-brand-600 to-amber-500 transition-all"
                    style={{
                      width: `${(unlocked.length / allBadges.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-600">
                  <span>{unlocked.length} desbloqueadas</span>
                  <span>{locked.length} bloqueadas</span>
                </div>
              </div>
            )}

            {/* Carta destacada + grid */}
            {featured ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[260px_1fr] md:items-center">
                <div className="mx-auto w-full max-w-[260px]">
                  <Link
                    href={
                      (featured.info
                        ? `/app/me/badges/${featured.info.awardId}`
                        : `/app/me/badges/locked/${featured.badge.id}`) as never
                    }
                    className="group block transition hover:-translate-y-1"
                  >
                    <BadgeCard
                      clubName={session.primary.clubName}
                      recipientName={featured.info ? rider!.name : null}
                      badge={featured.badge}
                      ratio="tall"
                      locked={!featured.info}
                    />
                  </Link>
                  <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-widest text-stone-600">
                    {featured.info
                      ? `Tu más reciente · ${formatDate(featured.info.awardedAt)}`
                      : 'Tu próximo reto'}
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-600">
                    El resto de la colección
                  </p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {allBadges
                      .filter((b) => b.id !== featured.badge.id)
                      .slice(0, 8)
                      .map((b) => {
                        const got = awardedMap.get(b.id);
                        const href = got
                          ? `/app/me/badges/${got.awardId}`
                          : `/app/me/badges/locked/${b.id}`;
                        return (
                          <Link
                            key={b.id}
                            href={href as never}
                            className="group block transition hover:-translate-y-1"
                            title={b.name}
                          >
                            <BadgeCard
                              clubName={session.primary.clubName}
                              badge={b}
                              ratio="compact"
                              locked={!got}
                            />
                          </Link>
                        );
                      })}
                  </div>
                  {allBadges.length > 9 && (
                    <Link
                      href="/app/me/badges"
                      className="mt-3 block text-center text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700 hover:text-brand-900"
                    >
                      + {allBadges.length - 9} más en tu colección →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<MedalIcon size={40} weight="duotone" />}
                title="Tu hípica aún no ha diseñado insignias"
                description="Cuando publiquen alguna, podrás verlas aquí y trabajar para desbloquearlas."
              />
            )}
          </div>
        </section>

        {/* Bento: próximas + caballos */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Próximas clases */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-card lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-normal tracking-tightest text-stone-900">
                  Tus próximas clases
                </h2>
                <p className="mt-0.5 text-[11px] font-medium text-stone-500">
                  {upcoming.length === 0
                    ? 'Sin clases programadas'
                    : `Las siguientes ${upcoming.length}`}
                </p>
              </div>
              <Link
                href="/app/me/lessons"
                className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700 hover:text-brand-900"
              >
                Ver todas →
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="rounded-2xl border border-stone-200/70 bg-stone-50/70 p-4 text-sm font-medium text-stone-500">
                Aún sin clases. Pídele a tu instructor que te incluya.
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((u) => (
                  <Link
                    key={u.attendeeId}
                    href={`/app/me/lessons/${u.lessonId}` as never}
                    className="group flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-stone-50/60 p-3 transition hover:border-brand-300 hover:bg-white"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-100 text-brand-800">
                      <div className="text-[10px] font-bold uppercase tracking-widest">
                        {new Date(u.date).toLocaleDateString('es-ES', {
                          month: 'short',
                        })}
                      </div>
                      <div className="text-lg font-bold leading-none">
                        {new Date(u.date).getDate()}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold capitalize text-stone-900">
                        Clase de {u.discipline.replace('_', ' ')}
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                        {formatDateTime(u.date, {
                          weekday: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {u.horseName ? ` · ${u.horseName}` : ''}
                      </div>
                    </div>
                    {u.horseName && (
                      <Avatar
                        name={u.horseName}
                        src={u.horsePhoto}
                        size="md"
                        square
                      />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Feedback reciente */}
          <div className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-br from-brand-50 to-emerald-50 p-6 shadow-card lg:col-span-2">
            <div className="mb-3 flex items-center gap-2 text-brand-700">
              <ChatCircleTextIcon size={18} weight="duotone" />
              <p className="label-eyebrow">Última nota del instructor</p>
            </div>
            {lastFeedback.length === 0 ? (
              <p className="text-sm font-medium text-stone-600">
                Cuando tu instructor publique feedback, aparecerá aquí. Si usa
                IA, será inmediato.
              </p>
            ) : (
              <div>
                <p className="font-display text-xl font-normal italic leading-snug text-stone-800 md:text-2xl">
                  «{lastFeedback[0]!.body}»
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  <span>Clase del {formatDateTime(lastFeedback[0]!.lessonDate)}</span>
                  {lastFeedback[0]!.source === 'ia' && (
                    <Badge tone="info">
                      <SparkleIcon size={9} weight="bold" /> IA
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Caballos favoritos */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-3xl font-normal tracking-tightest text-stone-900 md:text-4xl">
                Tus caballos
              </h2>
              <p className="mt-0.5 text-[11px] font-medium text-stone-500">
                Ordenados por afinidad
              </p>
            </div>
            <Link
              href="/app/me/horses"
              className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700 hover:text-brand-900"
            >
              Ver todos →
            </Link>
          </div>
          {topHorses.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white/60 p-8 text-center">
              <HorseIcon
                size={32}
                weight="duotone"
                className="mx-auto text-brand-700"
              />
              <p className="mt-2 text-sm font-medium text-stone-500">
                Cuando montes en una clase realizada, tus caballos aparecerán
                aquí ordenados por afinidad.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {topHorses.map((h, i) => {
                const affinity = Math.min(99, h.rides * 12);
                const ranking = ['Tu favorito', 'Segundo', 'Tercero'][i];
                return (
                  <Link
                    key={h.horseId ?? ''}
                    href={`/app/me/horses/${h.horseId}` as never}
                    className="group relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift"
                  >
                    {h.photoUrl ? (
                      <div className="relative aspect-[4/3] w-full bg-stone-100">
                        <Image
                          src={h.photoUrl}
                          alt={h.horseName}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/10 to-transparent" />
                        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-900 shadow">
                          {ranking}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                          <div className="min-w-0">
                            <div className="truncate font-display text-2xl font-normal leading-tight">
                              {h.horseName}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-90">
                              {h.kind} · {h.rides} montura
                              {h.rides !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <Badge tone="brand">{affinity}%</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                            <HorseIcon size={22} weight="duotone" />
                          </div>
                          <div>
                            <div className="text-base font-bold text-stone-900">
                              {h.horseName}
                            </div>
                            <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                              {h.kind} · {h.rides} montura
                              {h.rides !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <Badge tone="brand" className="mt-3">
                          afinidad {affinity}%
                        </Badge>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Bonos + Eventos */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Bonos */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-normal tracking-tightest text-stone-900">
                Tus bonos
              </h2>
              <Link
                href="/app/me/bonos"
                className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700 hover:text-brand-900"
              >
                Ver todos →
              </Link>
            </div>
            {myBonos.length === 0 ? (
              <Link
                href="/app/me/bonos"
                className="block rounded-3xl border-2 border-dashed border-stone-300 bg-white/60 p-6 text-center transition hover:border-brand-400"
              >
                <TicketIcon
                  size={32}
                  weight="duotone"
                  className="mx-auto text-brand-700"
                />
                <p className="mt-2 text-sm font-medium text-stone-600">
                  Aún no tienes bonos.{' '}
                  <span className="font-bold text-brand-700">
                    Ver los disponibles →
                  </span>
                </p>
              </Link>
            ) : (
              <div className="space-y-3">
                {myBonos.map((b) => {
                  const pctLeft = (b.classesLeft / b.totalClasses) * 100;
                  return (
                    <Link
                      key={b.id}
                      href={`/app/me/bonos/${b.id}` as never}
                      className="group block overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
                    >
                      <div className="flex items-stretch">
                        {b.photoUrl ? (
                          <div className="relative aspect-square h-auto w-24 shrink-0 bg-stone-100">
                            <Image
                              src={b.photoUrl}
                              alt={b.name}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex w-24 shrink-0 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700">
                            <TicketIcon size={32} weight="duotone" />
                          </div>
                        )}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-stone-900">
                                {b.name}
                              </div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                                {formatCents(b.priceCents)} · caduca{' '}
                                {formatDate(b.expiresAt)}
                              </div>
                            </div>
                            <span className="shrink-0 font-display text-2xl font-normal tracking-tightest text-brand-700">
                              {b.classesLeft}
                              <span className="text-sm text-brand-400">
                                /{b.totalClasses}
                              </span>
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                            <div
                              className="h-full bg-brand-600 transition-all"
                              style={{ width: `${pctLeft}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Eventos */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-normal tracking-tightest text-stone-900">
                Eventos abiertos
              </h2>
              <Link
                href="/app/me/events"
                className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700 hover:text-brand-900"
              >
                Ver todos →
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white/60 p-6 text-center">
                <TrophyIcon
                  size={28}
                  weight="duotone"
                  className="mx-auto text-rose-700"
                />
                <p className="mt-2 text-sm font-medium text-stone-500">
                  Sin eventos publicados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((e) => (
                  <Link
                    key={e.id}
                    href={`/app/me/events/${e.id}` as never}
                    className="group block overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <div className="flex items-stretch">
                      {e.photoUrl ? (
                        <div className="relative aspect-square h-auto w-24 shrink-0 bg-stone-100">
                          <Image
                            src={e.photoUrl}
                            alt={e.title}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex w-24 shrink-0 items-center justify-center bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700">
                          <TrophyIcon size={28} weight="duotone" />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                          {e.kind.replace('_', ' ')}
                        </div>
                        <div className="mt-0.5 text-sm font-bold text-stone-900">
                          {e.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge tone="brand">
                            {formatDateTime(e.startsAt, {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </Badge>
                          <Badge tone="info">{formatCents(e.priceCents)}</Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer subtle */}
        <section className="rounded-2xl border border-stone-200/70 bg-white/60 p-4 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500 backdrop-blur">
          <span className="inline-flex items-center gap-1.5">
            <LockKeyIcon size={11} weight="bold" /> Sigue montando para
            desbloquear más
          </span>
        </section>
      </div>
    </div>
  );
}
