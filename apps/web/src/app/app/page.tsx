import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import {
  HorseIcon,
  GraduationCapIcon,
  CalendarBlankIcon,
  TrophyIcon,
  TicketIcon,
  NewspaperIcon,
  ClipboardTextIcon,
  CertificateIcon,
  MicrophoneStageIcon,
  BookOpenTextIcon,
  ArrowRightIcon,
  MedalIcon,
  BellIcon,
  ClockIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, roleLabel } from '@/lib/db';
import { DayPicker } from '@/components/agenda/DayPicker';
import { RiderHome } from './_rider-home';
import { GroomHome } from './_groom-home';

export const metadata = { title: 'Inicio' };
export const dynamic = 'force-dynamic';

export default async function AppHome({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const sp = await searchParams;
  const session = await ensureSession();
  const { primary, user, memberships } = session;
  const roles = Array.from(new Set(memberships.map((m) => m.role)));

  const isStaffEarly = roles.some((r) =>
    ['owner', 'admin', 'instructor'].includes(r),
  );

  // Día seleccionado para la agenda (default: hoy en UTC)
  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(sp.day ?? '')
    ? sp.day!
    : todayStr;

  // Si el usuario NO es staff y SÍ es rider, le damos la home visual
  // específica del alumno: bento de insignias destacadas, caballos
  // favoritos, bonos y eventos sin tener que cambiar de pantalla.
  if (!isStaffEarly && roles.includes('rider')) {
    return <RiderHome session={session} />;
  }

  // Mozo puro: checklist directo sin pantallas intermedias.
  if (!isStaffEarly && roles.length === 1 && roles[0] === 'groom') {
    return <GroomHome session={session} />;
  }

  // Día seleccionado → start / end en UTC
  const dayParts = selectedDay.split('-').map(Number) as [number, number, number];
  const [sy, sm, sd] = dayParts;
  const dayStart = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(sy, sm - 1, sd + 1, 0, 0, 0));

  const [horseCount, riderCount, dayLessons] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.horses)
      .where(eq(schema.horses.clubId, primary.clubId))
      .then((r) => r[0]),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.riders)
      .where(eq(schema.riders.clubId, primary.clubId))
      .then((r) => r[0]),
    db
      .select({
        id: schema.lessons.id,
        date: schema.lessons.date,
        discipline: schema.lessons.discipline,
        durationMinutes: schema.lessons.durationMinutes,
        status: schema.lessons.status,
        notes: schema.lessons.notes,
      })
      .from(schema.lessons)
      .where(
        and(
          eq(schema.lessons.clubId, primary.clubId),
          gte(schema.lessons.date, dayStart),
          lt(schema.lessons.date, dayEnd),
        ),
      )
      .orderBy(schema.lessons.date),
  ]);

  // Asistentes de las clases del día (solo los IDs presentes)
  const dayAttendees = dayLessons.length
    ? await db
        .select({
          lessonId: schema.lessonAttendees.lessonId,
          riderName: schema.riders.name,
          horseName: schema.horses.name,
        })
        .from(schema.lessonAttendees)
        .innerJoin(
          schema.riders,
          eq(schema.riders.id, schema.lessonAttendees.riderId),
        )
        .leftJoin(
          schema.horses,
          eq(schema.horses.id, schema.lessonAttendees.horseId),
        )
        .where(
          inArray(
            schema.lessonAttendees.lessonId,
            dayLessons.map((l) => l.id),
          ),
        )
    : [];

  const attendeesByLesson = new Map<string, typeof dayAttendees>();
  for (const a of dayAttendees) {
    if (!attendeesByLesson.has(a.lessonId)) attendeesByLesson.set(a.lessonId, []);
    attendeesByLesson.get(a.lessonId)!.push(a);
  }

  const now = new Date();

  const upcomingEvents = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      startsAt: schema.events.startsAt,
      kind: schema.events.kind,
      photoUrl: schema.events.photoUrl,
    })
    .from(schema.events)
    .where(
      and(
        eq(schema.events.clubId, primary.clubId),
        gte(schema.events.startsAt, now),
      ),
    )
    .orderBy(schema.events.startsAt)
    .limit(2);

  const recentNotifications = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.profileId, user.id))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(4);

  const isStaff = roles.some((r) =>
    ['owner', 'admin', 'instructor'].includes(r),
  );
  const isHorseOwner = roles.includes('horse_owner');
  const isRider = roles.includes('rider');
  const isGroom = roles.includes('groom');

  const firstName = (session.profile?.fullName ?? user.email).split(' ')[0];

  return (
    <div className="bg-mesh min-h-full">
      <div className="stagger mx-auto max-w-6xl space-y-6 p-6 md:p-10">
        {/* Hero greeting */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="label-eyebrow">
              {roleLabel(primary.role)} · {primary.clubName}
            </p>
            <h1 className="mt-2 text-5xl font-bold tracking-tight text-stone-900 md:text-7xl">
              Hola,{' '}
              <span className="text-brand-700">{firstName}</span>.
            </h1>
            <p className="mt-3 text-sm font-medium text-stone-500 md:text-base">
              Lo que pasa hoy en{' '}
              <span className="font-bold text-stone-700">
                {primary.clubName}
              </span>
              .
            </p>
          </div>
        </header>

        {/* ── AGENDA DEL DÍA ─────────────────────────────────── */}
        {isStaff && (
          <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
            <div className="border-b border-stone-100">
              <div className="flex items-center justify-between px-5 pt-4 pb-1">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                  Agenda
                </h2>
                <Link
                  href="/app/lessons"
                  className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700 hover:text-brand-900"
                >
                  Todas las clases →
                </Link>
              </div>
              <DayPicker selectedDay={selectedDay} />
            </div>

            {dayLessons.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                <CalendarBlankIcon size={32} weight="duotone" className="text-stone-300" />
                <p className="text-sm font-medium text-stone-500">
                  Sin clases programadas para este día.
                </p>
                <Link
                  href="/app/lessons"
                  className="mt-1 text-xs font-bold text-brand-700 hover:text-brand-900"
                >
                  Programar una clase →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {dayLessons.map((l) => {
                  const list = attendeesByLesson.get(l.id) ?? [];
                  const shown = list.slice(0, 3);
                  const extra = list.length - shown.length;
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/app/lessons/${l.id}`}
                        className="group flex items-center gap-4 px-5 py-4 transition hover:bg-brand-50/40"
                      >
                        {/* Hora */}
                        <div className="flex w-12 shrink-0 flex-col items-center">
                          <span className="text-base font-bold tabular-nums text-stone-900">
                            {new Date(l.date).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'UTC',
                            })}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                            {l.durationMinutes} min
                          </span>
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold capitalize text-stone-900">
                              {l.discipline.replace('_', ' ')}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                                l.status === 'realizada'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : l.status === 'cancelada'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-sky-100 text-sky-700'
                              }`}
                            >
                              {l.status}
                            </span>
                          </div>
                          {list.length > 0 ? (
                            <p className="mt-0.5 truncate text-xs font-medium text-stone-500">
                              {shown.map((a) => a.riderName).join(', ')}
                              {extra > 0 && ` +${extra} más`}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs font-medium text-stone-400">
                              Sin asistentes
                            </p>
                          )}
                        </div>

                        <ArrowRightIcon
                          size={14}
                          weight="bold"
                          className="shrink-0 text-stone-300 transition group-hover:text-brand-600"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* Bento grid principal */}
        {isStaff && (
          <section className="grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-4">
            <BigKpi
              className="col-span-2 md:col-span-3"
              icon={<HorseIcon size={26} weight="duotone" />}
              label="Caballos"
              value={horseCount?.n ?? 0}
              href="/app/horses"
              accent="from-brand-50 to-brand-100"
            />
            <BigKpi
              className="col-span-2 md:col-span-3"
              icon={<GraduationCapIcon size={26} weight="duotone" />}
              label="Alumnos"
              value={riderCount?.n ?? 0}
              href="/app/riders"
              accent="from-amber-50 to-amber-100"
            />
            <BigKpi
              className="col-span-2 md:col-span-2"
              icon={<CalendarBlankIcon size={22} weight="duotone" />}
              label="Clases hoy"
              value={dayLessons.length}
              href="/app/lessons"
              accent="from-sky-50 to-sky-100"
              compact
            />
            <BigKpi
              className="col-span-1 md:col-span-2"
              icon={<TrophyIcon size={22} weight="duotone" />}
              label="Eventos"
              value={upcomingEvents.length}
              href="/app/events"
              accent="from-rose-50 to-rose-100"
              compact
            />
            <BigKpi
              className="col-span-1 md:col-span-2"
              icon={<BellIcon size={22} weight="duotone" />}
              label="Alertas"
              value={recentNotifications.filter((n) => !n.readAt).length}
              href="/app/notifications"
              accent="from-violet-50 to-violet-100"
              compact
            />
          </section>
        )}

        {/* Atajos + Próximamente bento */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {isStaff && (
            <div className="surface-glass relative overflow-hidden p-6 lg:col-span-3">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-300/30 blur-3xl"
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                    Atajos rápidos
                  </h2>
                  <p className="label-eyebrow">Hípica</p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3">
                  <Shortcut
                    href="/app/courses"
                    icon={<BookOpenTextIcon size={20} weight="duotone" />}
                    label="Nuevo curso"
                  />
                  <Shortcut
                    href="/app/lessons"
                    icon={<CalendarBlankIcon size={20} weight="duotone" />}
                    label="Nueva clase"
                  />
                  <Shortcut
                    href="/app/events"
                    icon={<TrophyIcon size={20} weight="duotone" />}
                    label="Nuevo evento"
                  />
                  <Shortcut
                    href="/app/news"
                    icon={<NewspaperIcon size={20} weight="duotone" />}
                    label="Publicar noticia"
                  />
                  <Shortcut
                    href="/app/bonos"
                    icon={<TicketIcon size={20} weight="duotone" />}
                    label="Crear bono"
                  />
                  <Shortcut
                    href="/app/badges"
                    icon={<MedalIcon size={20} weight="duotone" />}
                    label="Diseñar insignia"
                  />
                </div>

                <Link
                  href="/app/ai"
                  className="group mt-4 flex items-center justify-between gap-3 rounded-2xl bg-stone-900 px-4 py-3.5 text-white transition hover:bg-brand-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-brand-200">
                      <MicrophoneStageIcon size={20} weight="duotone" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Bandeja IA</div>
                      <div className="text-[11px] font-medium text-white/70">
                        Procesa una nota de voz y reparte feedback
                      </div>
                    </div>
                  </div>
                  <ArrowRightIcon
                    size={16}
                    weight="bold"
                    className="text-white/80 transition group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>
          )}

          {isRider && (
            <RolePanel
              title="Mi panel"
              tag="Alumno"
              shortcuts={[
                {
                  href: '/app/me/lessons',
                  icon: <CalendarBlankIcon size={20} weight="duotone" />,
                  label: 'Mis clases',
                },
                {
                  href: '/app/me/horses',
                  icon: <HorseIcon size={20} weight="duotone" />,
                  label: 'Mis caballos',
                },
                {
                  href: '/app/me/events',
                  icon: <TrophyIcon size={20} weight="duotone" />,
                  label: 'Eventos',
                },
                {
                  href: '/app/me/bonos',
                  icon: <TicketIcon size={20} weight="duotone" />,
                  label: 'Bonos',
                },
              ]}
            />
          )}

          {isHorseOwner && (
            <RolePanel
              title="Mis caballos"
              tag="Propietario"
              shortcuts={[
                {
                  href: '/app/horse-owner',
                  icon: <CertificateIcon size={20} weight="duotone" />,
                  label: 'Agenda y cuidados',
                },
              ]}
            />
          )}

          {isGroom && (
            <RolePanel
              title="Cuadra"
              tag="Mozo"
              shortcuts={[
                {
                  href: '/app/groom',
                  icon: <ClipboardTextIcon size={20} weight="duotone" />,
                  label: 'Checklist del día',
                },
              ]}
            />
          )}

          {/* Próximos eventos */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-card lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">
                Próximos eventos
              </h2>
              <p className="label-eyebrow">Calendario</p>
            </div>
            <div className="mt-4 space-y-2">
              {upcomingEvents.length === 0 && (
                <p className="text-sm font-medium text-stone-500">
                  Sin eventos próximos.
                </p>
              )}
              {upcomingEvents.map((e) => (
                <Link
                  key={e.id}
                  href={
                    (isStaff
                      ? `/app/events/${e.id}`
                      : `/app/me/events/${e.id}`) as never
                  }
                  className="group flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-stone-50/70 p-3 transition hover:border-brand-300 hover:bg-white"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                    <TrophyIcon size={18} weight="duotone" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-stone-900">
                      {e.title}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      {new Date(e.startsAt).toLocaleString('es-ES', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                      })}
                    </div>
                  </div>
                  <ArrowRightIcon
                    size={14}
                    className="text-stone-300 group-hover:text-brand-600"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Notificaciones */}
        <section className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">
              Últimas notificaciones
            </h2>
            <Link
              href="/app/notifications"
              className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700 hover:text-brand-900"
            >
              Ver todas →
            </Link>
          </div>
          {recentNotifications.length === 0 ? (
            <p className="text-sm font-medium text-stone-500">
              Sin novedades. Cuando alguien complete un checklist o la IA prepare
              feedback, aparecerá aquí.
            </p>
          ) : (
            <div className="space-y-2">
              {recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start justify-between gap-4 rounded-2xl border p-3 transition ${
                    n.readAt
                      ? 'border-stone-200/70 bg-stone-50/70'
                      : 'border-brand-200 bg-brand-50/40'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.readAt && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-700" />
                      )}
                      <div className="truncate text-sm font-bold text-stone-900">
                        {n.title}
                      </div>
                    </div>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-1 text-xs font-medium text-stone-600">
                        {n.body}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    {new Date(n.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function BigKpi({
  label,
  value,
  href,
  icon,
  accent,
  className = '',
  compact = false,
}: {
  label: string;
  value: number;
  href: string;
  icon: React.ReactNode;
  accent: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift ${className}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-50`}
      />
      <div
        className={`relative flex ${compact ? 'flex-row items-center gap-3 p-4' : 'flex-col gap-3 p-5'}`}
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-card ${
            compact ? 'h-10 w-10' : 'h-12 w-12'
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="label-eyebrow">{label}</div>
          <div
            className={`mt-0.5 font-bold tracking-tight font-normal leading-none tracking-tight text-stone-900 ${
              compact ? 'text-3xl' : 'text-5xl md:text-6xl'
            }`}
          >
            {value}
          </div>
        </div>
        <ArrowRightIcon
          size={16}
          className="self-end text-stone-400 transition group-hover:text-brand-700"
        />
      </div>
    </Link>
  );
}

function RolePanel({
  title,
  tag,
  shortcuts,
}: {
  title: string;
  tag: string;
  shortcuts: Array<{ href: string; icon: React.ReactNode; label: string }>;
}) {
  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-card lg:col-span-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          {title}
        </h2>
        <p className="label-eyebrow">{tag}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-2">
        {shortcuts.map((s) => (
          <Shortcut key={s.href} {...s} />
        ))}
      </div>
    </div>
  );
}

function Shortcut({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-2xl border border-stone-200/70 bg-white px-3 py-3 text-sm font-bold text-stone-800 transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-card"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
        {icon}
      </span>
      {label}
    </Link>
  );
}
