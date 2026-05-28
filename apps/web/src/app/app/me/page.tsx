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
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { Avatar, AvatarStack, Badge, EmptyState } from '@/components/ui';
import { BadgeCard } from '@/components/badge/BadgeCard';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Mi panel' };
export const dynamic = 'force-dynamic';

export default async function MePage() {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);

  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  const now = new Date();

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
    .limit(4);

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
    .limit(2);

  const recentBadges = await db
    .select({
      id: schema.riderBadges.id,
      awardedAt: schema.riderBadges.awardedAt,
      name: schema.badges.name,
      subtitle: schema.badges.subtitle,
      categoryLabel: schema.badges.categoryLabel,
      color: schema.badges.color,
      iconUrl: schema.badges.iconUrl,
    })
    .from(schema.riderBadges)
    .innerJoin(schema.badges, eq(schema.badges.id, schema.riderBadges.badgeId))
    .where(eq(schema.riderBadges.riderId, rider!.id))
    .orderBy(desc(schema.riderBadges.awardedAt))
    .limit(3);

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

  const [badgeCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.riderBadges)
    .where(eq(schema.riderBadges.riderId, rider!.id));

  const [horseCount] = await db
    .select({
      n: sql<number>`count(DISTINCT ${schema.lessonAttendees.horseId})::int`,
    })
    .from(schema.lessonAttendees)
    .where(
      and(
        eq(schema.lessonAttendees.riderId, rider!.id),
        eq(schema.lessonAttendees.attended, true),
      ),
    );

  return (
    <div className="bg-mesh min-h-full">
      <div className="stagger mx-auto max-w-6xl space-y-6 p-6 md:p-10">
        {/* Hero del alumno */}
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
                {session.primary.clubName}
              </p>
            </div>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniKpi
            icon={<CalendarBlankIcon size={20} weight="duotone" />}
            label="Próximas"
            value={upcoming.length}
            href="/app/me/lessons"
            accent="from-sky-50 to-sky-100"
          />
          <MiniKpi
            icon={<HorseIcon size={20} weight="duotone" />}
            label="Caballos"
            value={horseCount?.n ?? 0}
            href="/app/me/horses"
            accent="from-brand-50 to-brand-100"
          />
          <MiniKpi
            icon={<MedalIcon size={20} weight="duotone" />}
            label="Insignias"
            value={badgeCount?.n ?? 0}
            href="/app/me/badges"
            accent="from-amber-50 to-amber-100"
          />
          <MiniKpi
            icon={<TrophyIcon size={20} weight="duotone" />}
            label="Eventos"
            value={0}
            href="/app/me/events"
            accent="from-rose-50 to-rose-100"
          />
        </section>

        {/* Bento principal */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Próximas clases */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-card lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-normal tracking-tightest text-stone-900">
                Tus próximas clases
              </h2>
              <Link
                href="/app/me/lessons"
                className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700 hover:text-brand-900"
              >
                Ver todas →
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState
                title="Sin clases todavía"
                description="Pide a tu instructor que te incluya en una clase. Aparecerá aquí al instante."
              />
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

          {/* Insignias */}
          <div className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-br from-amber-50 to-rose-50 p-6 shadow-card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-normal tracking-tightest text-stone-900">
                Insignias
              </h2>
              <Link
                href="/app/me/badges"
                className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700 hover:text-brand-900"
              >
                Ver todas →
              </Link>
            </div>
            {recentBadges.length === 0 ? (
              <p className="text-sm font-medium text-stone-500">
                Aún sin insignias. Tu instructor las otorga al cumplir hitos.
              </p>
            ) : (
              <div className="space-y-3">
                {recentBadges.slice(0, 1).map((b) => (
                  <BadgeCard
                    key={b.id}
                    clubName={session.primary.clubName}
                    recipientName={rider!.name}
                    badge={b}
                    ratio="compact"
                  />
                ))}
                {recentBadges.length > 1 && (
                  <div className="flex items-center gap-2">
                    <AvatarStack
                      people={recentBadges.slice(1).map((b) => ({
                        name: b.name,
                        src: b.iconUrl,
                      }))}
                      size="md"
                    />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-stone-600">
                      +{recentBadges.length - 1} más
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Caballos favoritos */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-normal tracking-tightest text-stone-900">
              Tus caballos favoritos
            </h2>
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
                    {h.photoUrl && (
                      <div className="relative aspect-[4/3] w-full bg-stone-100">
                        <Avatar
                          name={h.horseName}
                          src={h.photoUrl}
                          size="2xl"
                          square
                          className="!h-full !w-full !rounded-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent" />
                        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-900 shadow">
                          {ranking}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                          <div>
                            <div className="font-display text-2xl font-normal leading-tight">
                              {h.horseName}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                              {h.kind} · {h.rides} montura
                              {h.rides !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <Badge tone="brand">{affinity}%</Badge>
                        </div>
                      </div>
                    )}
                    {!h.photoUrl && (
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

        {/* Feedback reciente */}
        {lastFeedback.length > 0 && (
          <section className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-normal tracking-tightest text-stone-900">
                Comentarios del instructor
              </h2>
              <ChatCircleTextIcon
                size={20}
                weight="duotone"
                className="text-brand-700"
              />
            </div>
            <div className="space-y-3">
              {lastFeedback.map((f) => (
                <div
                  key={f.id}
                  className="rounded-2xl border border-stone-200/70 bg-stone-50/60 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Clase del {formatDateTime(f.lessonDate)}
                    </div>
                    {f.source === 'ia' && <Badge tone="info">IA</Badge>}
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-stone-800">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MiniKpi({
  icon,
  label,
  value,
  href,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-50`}
      />
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-card">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            {label}
          </div>
          <div className="font-display text-3xl font-normal leading-none tracking-tightest text-stone-900">
            {value}
          </div>
        </div>
        <ArrowRightIcon
          size={14}
          className="self-end text-stone-300 group-hover:text-brand-700"
        />
      </div>
    </Link>
  );
}
