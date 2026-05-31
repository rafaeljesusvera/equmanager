import { db, schema } from '@equmanager/database';
import { eq, desc } from 'drizzle-orm';
import {
  CalendarBlankIcon,
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
} from '@phosphor-icons/react/dist/ssr';
import { DISCIPLINES, LESSON_STATUSES } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Button, EmptyState, Field, Input, Select, SubmitButton,
} from '@/components/ui';
import { AutoSubmitSelect } from '@/components/ui/AutoSubmitSelect';
import { formatDateTime } from '@/lib/format';
import {
  addAttendeeAction,
  createLessonAction,
  deleteLessonAction,
  removeAttendeeAction,
  updateLessonStatusAction,
} from './actions';

export const metadata = { title: 'Clases' };
export const dynamic = 'force-dynamic';

export default async function LessonsPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const [lessons, riders, horses] = await Promise.all([
    db
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.clubId, session.primary.clubId))
      .orderBy(desc(schema.lessons.date))
      .limit(40),
    db
      .select({
        id: schema.riders.id,
        name: schema.riders.name,
      })
      .from(schema.riders)
      .where(eq(schema.riders.clubId, session.primary.clubId))
      .orderBy(schema.riders.name),
    db
      .select({
        id: schema.horses.id,
        name: schema.horses.name,
      })
      .from(schema.horses)
      .where(eq(schema.horses.clubId, session.primary.clubId))
      .orderBy(schema.horses.name),
  ]);

  const lessonIds = lessons.map((l) => l.id);
  const attendees = lessonIds.length
    ? await db
        .select({
          id: schema.lessonAttendees.id,
          lessonId: schema.lessonAttendees.lessonId,
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
    : [];

  const attendeesByLesson = new Map<string, typeof attendees>();
  attendees.forEach((a) => {
    const list = attendeesByLesson.get(a.lessonId) ?? [];
    list.push(a);
    attendeesByLesson.set(a.lessonId, list);
  });

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Clases"
        description="Tu calendario de clases. Añade jinetes y caballos a cada sesión y deja que la IA genere el feedback."
      />

      <section className="mb-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-bold text-stone-900">Nueva clase</h2>
        <form
          action={createLessonAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-5"
        >
          <Field label="Fecha y hora">
            <Input required name="date" type="datetime-local" />
          </Field>
          <Field label="Disciplina">
            <Select name="discipline" defaultValue="iniciacion">
              {DISCIPLINES.map((d) => (
                <option key={d} value={d}>
                  {d.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duración (min)">
            <Input name="duration" type="number" defaultValue={60} min={15} max={240} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Notas">
              <Input name="notes" placeholder="Objetivos de la sesión" />
            </Field>
          </div>
          <div className="md:col-span-5">
            <SubmitButton>
              <PlusIcon size={14} weight="bold" /> Programar clase
            </SubmitButton>
          </div>
        </form>
      </section>

      {lessons.length === 0 ? (
        <EmptyState
          icon={<CalendarBlankIcon size={40} weight="duotone" />}
          title="Sin clases programadas"
          description="Empieza a montar tu calendario. Cada clase puede tener varios alumnos con su caballo asignado."
        />
      ) : (
        <div className="space-y-3">
          {lessons.map((l) => {
            const list = attendeesByLesson.get(l.id) ?? [];
            return (
              <article
                key={l.id}
                className="rounded-3xl border border-stone-200 bg-white p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      {l.discipline} · {l.durationMinutes} min
                    </p>
                    <h3 className="mt-0.5 text-base font-bold text-stone-900">
                      {formatDateTime(l.date, {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </h3>
                    {l.notes && (
                      <p className="mt-1 max-w-xl text-sm font-medium text-stone-600">
                        {l.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={updateLessonStatusAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <AutoSubmitSelect name="status" defaultValue={l.status}>
                        {LESSON_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </AutoSubmitSelect>
                    </form>
                    <form action={deleteLessonAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <button
                        type="submit"
                        className="rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon size={16} weight="bold" />
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                    Asistentes ({list.length})
                  </p>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {list.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 py-0.5 pl-2.5 pr-1 text-xs font-bold text-stone-800"
                      >
                        {a.riderName}
                        {a.horseName && (
                          <span className="text-[10px] font-medium uppercase tracking-widest text-stone-500">
                            · {a.horseName}
                          </span>
                        )}
                        <form action={removeAttendeeAction} className="inline">
                          <input type="hidden" name="id" value={a.id} />
                          <button
                            type="submit"
                            className="rounded-full p-0.5 text-stone-400 hover:bg-stone-200 hover:text-red-600"
                          >
                            ×
                          </button>
                        </form>
                      </span>
                    ))}
                  </div>

                  {riders.length > 0 && (
                    <form
                      action={addAttendeeAction}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <input type="hidden" name="lessonId" value={l.id} />
                      <div className="min-w-[160px] flex-1">
                        <Select name="riderId" required defaultValue="">
                          <option value="" disabled>
                            Añadir alumno…
                          </option>
                          {riders.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="min-w-[140px] flex-1">
                        <Select name="horseId" defaultValue="">
                          <option value="">Sin caballo</option>
                          {horses.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <SubmitButton variant="outline">
                        <UserPlusIcon size={14} weight="bold" /> Añadir
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
