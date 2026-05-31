import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, asc, eq } from 'drizzle-orm';
import {
  TrashIcon,
  PlusIcon,
  CalendarBlankIcon,
  GraduationCapIcon,
} from '@phosphor-icons/react/dist/ssr';
import { COURSE_STATUSES, DISCIPLINES } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import { Button, Field, Input, Select, Textarea, SubmitButton,
} from '@/components/ui';
import { AutoSaveForm } from '@/components/ui/AutoSaveForm';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDelete';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { SessionGenerator } from '@/components/course/SessionGenerator';
import { formatCents, formatDateTime, toDatetimeLocal } from '@/lib/format';
import {
  addCourseSessionAction,
  deleteCourseAction,
  deleteCourseSessionAction,
  updateCourseAction,
} from '../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [c] = await db
    .select({ title: schema.courses.title })
    .from(schema.courses)
    .where(eq(schema.courses.id, id))
    .limit(1);
  return { title: c?.title ?? 'Curso' };
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ generated?: string; error?: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);
  const { id } = await params;
  const { generated, error: errMsg } = await searchParams;

  const [course] = await db
    .select()
    .from(schema.courses)
    .where(
      and(
        eq(schema.courses.id, id),
        eq(schema.courses.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!course) notFound();

  const sessions = await db
    .select()
    .from(schema.courseSessions)
    .where(eq(schema.courseSessions.courseId, id))
    .orderBy(asc(schema.courseSessions.date));

  const enrollments = await db
    .select({
      id: schema.enrollments.id,
      status: schema.enrollments.status,
      confirmedAt: schema.enrollments.confirmedAt,
      profileName: schema.profiles.fullName,
      profileEmail: schema.profiles.email,
      riderName: schema.riders.name,
    })
    .from(schema.enrollments)
    .leftJoin(schema.profiles, eq(schema.profiles.id, schema.enrollments.profileId))
    .leftJoin(schema.riders, eq(schema.riders.id, schema.enrollments.riderId))
    .where(
      and(
        eq(schema.enrollments.targetType, 'curso'),
        eq(schema.enrollments.targetId, id),
      ),
    );

  return (
    <DetailShell
      backHref="/app/courses"
      backLabel="Cursos"
      eyebrow={course.discipline}
      title={course.title}
      description={course.description ?? undefined}
      status={{
        label: course.status,
        tone:
          course.status === 'publicado'
            ? 'success'
            : course.status === 'cerrado'
              ? 'warn'
              : 'neutral',
      }}
    >
      <DetailSection title="Datos del curso" description="Se guarda automáticamente al salir de cada campo.">
        <AutoSaveForm
          action={updateCourseAction}
          className="grid grid-cols-1 gap-4 md:grid-cols-6"
        >
          <input type="hidden" name="id" value={course.id} />
          <div className="md:col-span-2 md:row-span-4">
            <PhotoUpload
              folder="courses"
              defaultValue={course.photoUrl}
              label="Foto"
              aspect="wide"
            />
          </div>
          <div className="md:col-span-2">
            <Field label="Título">
              <Input required name="title" defaultValue={course.title} />
            </Field>
          </div>
          <Field label="Disciplina">
            <Select name="discipline" defaultValue={course.discipline}>
              {DISCIPLINES.map((d) => (
                <option key={d} value={d}>
                  {d.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={course.status}>
              {COURSE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Precio (€)">
            <Input
              name="price"
              defaultValue={(course.priceCents / 100).toString()}
            />
          </Field>
          <Field label="Cupo">
            <Input
              name="maxStudents"
              type="number"
              min={1}
              defaultValue={course.maxStudents ?? ''}
            />
          </Field>
          <Field label="Inicio">
            <Input
              name="startDate"
              type="date"
              defaultValue={
                course.startDate
                  ? new Date(course.startDate).toISOString().slice(0, 10)
                  : ''
              }
            />
          </Field>
          <Field label="Fin">
            <Input
              name="endDate"
              type="date"
              defaultValue={
                course.endDate
                  ? new Date(course.endDate).toISOString().slice(0, 10)
                  : ''
              }
            />
          </Field>
          <div className="md:col-span-4">
            <Field label="Descripción">
              <Textarea
                name="description"
                rows={3}
                defaultValue={course.description ?? ''}
              />
            </Field>
          </div>
        </AutoSaveForm>
      </DetailSection>

      {generated && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          ✓ {generated} sesion{Number(generated) === 1 ? '' : 'es'} generada
          {Number(generated) === 1 ? '' : 's'} automáticamente.
        </div>
      )}
      {errMsg && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
          {errMsg}
        </div>
      )}

      <DetailSection
        title="Sesiones"
        description={`${sessions.length} programada${sessions.length === 1 ? '' : 's'}. Genera por días de la semana o añade una a una.`}
      >
        <div className="mb-5">
          <SessionGenerator
            courseId={course.id}
            defaultStart={
              course.startDate
                ? new Date(course.startDate).toISOString().slice(0, 10)
                : undefined
            }
            defaultEnd={
              course.endDate
                ? new Date(course.endDate).toISOString().slice(0, 10)
                : undefined
            }
            hasExistingSessions={sessions.length > 0}
          />
        </div>

        {sessions.length > 0 && (
          <div className="mb-4 space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <CalendarBlankIcon
                    size={18}
                    weight="duotone"
                    className="text-brand-700"
                  />
                  <div>
                    <div className="text-sm font-bold text-stone-900">
                      {formatDateTime(s.date)}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500">
                      {s.durationMinutes} min{s.notes ? ` · ${s.notes}` : ''}
                    </div>
                  </div>
                </div>
                <ConfirmDeleteButton
                  action={deleteCourseSessionAction}
                  hidden={{ id: s.id, courseId: course.id }}
                  title="Eliminar sesión"
                  description={`¿Quieres eliminar la sesión del ${formatDateTime(s.date)}? No se puede deshacer.`}
                />
              </div>
            ))}
          </div>
        )}
        <form
          action={addCourseSessionAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-6"
        >
          <input type="hidden" name="courseId" value={course.id} />
          <div className="md:col-span-2">
            <Field label="Fecha y hora">
              <Input
                required
                name="date"
                type="datetime-local"
                defaultValue={toDatetimeLocal(new Date())}
              />
            </Field>
          </div>
          <Field label="Duración (min)">
            <Input name="duration" type="number" min={15} max={300} defaultValue={60} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Notas">
              <Input name="notes" placeholder="Objetivos de la sesión" />
            </Field>
          </div>
          <div className="md:col-span-1 flex items-end">
            <SubmitButton variant="outline" className="w-full">
              <PlusIcon size={14} weight="bold" /> Añadir
            </SubmitButton>
          </div>
        </form>
      </DetailSection>

      <DetailSection
        title="Inscripciones"
        description={`${enrollments.length} alumno${enrollments.length === 1 ? '' : 's'} apuntado${enrollments.length === 1 ? '' : 's'}.`}
      >
        {enrollments.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Aún no hay inscripciones. Cuando alguien se apunte desde su panel
            aparecerá aquí.
          </p>
        ) : (
          <div className="space-y-2">
            {enrollments.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <GraduationCapIcon
                    size={18}
                    weight="duotone"
                    className="text-brand-700"
                  />
                  <div>
                    <div className="text-sm font-bold text-stone-900">
                      {e.riderName ?? e.profileName ?? e.profileEmail}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500">
                      {e.status}
                      {e.confirmedAt
                        ? ` · confirmada ${formatDateTime(e.confirmedAt)}`
                        : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] font-medium text-stone-500">
          Total: {formatCents(course.priceCents * enrollments.length)}
        </p>
      </DetailSection>

      <DetailSection
        title="Zona peligrosa"
        description="Eliminar un curso elimina también sus sesiones."
      >
        <ConfirmDeleteButton
          variant="button"
          action={deleteCourseAction}
          hidden={{ id: course.id }}
          triggerLabel="Eliminar curso"
          title={`Eliminar "${course.title}"`}
          description="Se eliminarán todas las sesiones programadas y los datos del curso. Las inscripciones quedarán huérfanas."
        />
      </DetailSection>
    </DetailShell>
  );
}
