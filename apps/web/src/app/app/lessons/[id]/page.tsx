import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import {
  ArrowLeftIcon,
  UserPlusIcon,
  TrashIcon,
  GraduationCapIcon,
  HorseIcon,
  ClockIcon,
  CalendarBlankIcon,
} from '@phosphor-icons/react/dist/ssr';
import { LESSON_STATUSES, DISCIPLINES } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { formatDateTime } from '@/lib/format';
import { AutoSubmitSelect } from '@/components/ui/AutoSubmitSelect';
import { Field, Select, SubmitButton } from '@/components/ui';
import {
  updateLessonStatusAction,
  addAttendeeAction,
  removeAttendeeAction,
} from '../actions';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, string> = {
  programada: 'bg-sky-100 text-sky-800',
  realizada: 'bg-emerald-100 text-emerald-800',
  cancelada: 'bg-red-100 text-red-700',
};

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const [lesson] = await db
    .select()
    .from(schema.lessons)
    .where(
      and(
        eq(schema.lessons.id, id),
        eq(schema.lessons.clubId, session.primary.clubId),
      ),
    )
    .limit(1);

  if (!lesson) notFound();

  const [attendees, riders, horses] = await Promise.all([
    db
      .select({
        id: schema.lessonAttendees.id,
        riderId: schema.lessonAttendees.riderId,
        horseId: schema.lessonAttendees.horseId,
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
      .where(eq(schema.lessonAttendees.lessonId, id)),
    db
      .select({ id: schema.riders.id, name: schema.riders.name })
      .from(schema.riders)
      .where(eq(schema.riders.clubId, session.primary.clubId))
      .orderBy(schema.riders.name),
    db
      .select({ id: schema.horses.id, name: schema.horses.name })
      .from(schema.horses)
      .where(eq(schema.horses.clubId, session.primary.clubId))
      .orderBy(schema.horses.name),
  ]);

  // Enlace de vuelta al día de la clase en la agenda
  const lessonDay = lesson.date.toISOString().slice(0, 10);
  const todayDay = new Date().toISOString().slice(0, 10);
  const backHref = lessonDay === todayDay ? '/app' : `/app?day=${lessonDay}`;

  const attendeeRiderIds = new Set(attendees.map((a) => a.riderId));
  const availableRiders = riders.filter((r) => !attendeeRiderIds.has(r.id));

  return (
    <div className="min-h-full bg-stone-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Back */}
        <Link
          href={backHref}
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-stone-500 transition hover:text-brand-700"
        >
          <ArrowLeftIcon size={12} weight="bold" />
          Agenda
        </Link>

        {/* Header */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                {lesson.discipline.replace('_', ' ')}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
                {formatDateTime(lesson.date, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-stone-500">
                <span className="flex items-center gap-1">
                  <ClockIcon size={14} weight="duotone" />
                  {formatDateTime(lesson.date, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' · '}
                  {lesson.durationMinutes} min
                </span>
              </div>
              {lesson.notes && (
                <p className="mt-3 text-sm font-medium text-stone-600">
                  {lesson.notes}
                </p>
              )}
            </div>

            {/* Status selector */}
            <form action={updateLessonStatusAction} className="shrink-0">
              <input type="hidden" name="id" value={lesson.id} />
              <AutoSubmitSelect
                name="status"
                defaultValue={lesson.status}
                className={STATUS_STYLE[lesson.status] ?? ''}
              >
                {LESSON_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </AutoSubmitSelect>
            </form>
          </div>
        </div>

        {/* Attendees */}
        <div className="mt-4 rounded-3xl border border-stone-200 bg-white shadow-card">
          <div className="border-b border-stone-100 px-6 py-4">
            <h2 className="text-sm font-bold text-stone-900">
              Asistentes ({attendees.length})
            </h2>
          </div>

          {attendees.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <GraduationCapIcon
                size={32}
                weight="duotone"
                className="mx-auto text-stone-300"
              />
              <p className="mt-2 text-sm font-medium text-stone-500">
                Sin asistentes aún
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {attendees.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-6 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <GraduationCapIcon size={16} weight="duotone" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-stone-900">
                      {a.riderName}
                    </div>
                    {a.horseName && (
                      <div className="flex items-center gap-1 text-xs font-medium text-stone-500">
                        <HorseIcon size={11} weight="duotone" />
                        {a.horseName}
                      </div>
                    )}
                  </div>
                  <form action={removeAttendeeAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Quitar asistente"
                    >
                      <TrashIcon size={14} weight="bold" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {/* Add attendee */}
          {availableRiders.length > 0 && (
            <div className="border-t border-stone-100 px-6 py-4">
              <form
                action={addAttendeeAction}
                className="flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="lessonId" value={lesson.id} />
                <div className="min-w-[160px] flex-1">
                  <Field label="Alumno">
                    <Select name="riderId" required defaultValue="">
                      <option value="" disabled>
                        Selecciona…
                      </option>
                      {availableRiders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="min-w-[140px] flex-1">
                  <Field label="Caballo">
                    <Select name="horseId" defaultValue="">
                      <option value="">Sin caballo</option>
                      {horses.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <SubmitButton variant="outline">
                  <UserPlusIcon size={13} weight="bold" />
                  Añadir
                </SubmitButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
