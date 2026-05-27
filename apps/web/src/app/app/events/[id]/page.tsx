import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import {
  TrashIcon,
  GraduationCapIcon,
} from '@phosphor-icons/react/dist/ssr';
import { EVENT_KINDS, EVENT_STATUSES } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { AutoSaveForm } from '@/components/ui/AutoSaveForm';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDelete';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { formatDateTime, toDatetimeLocal } from '@/lib/format';
import { deleteEventAction, updateEventAction } from '../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [e] = await db
    .select({ title: schema.events.title })
    .from(schema.events)
    .where(eq(schema.events.id, id))
    .limit(1);
  return { title: e?.title ?? 'Evento' };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);
  const { id } = await params;

  const [event] = await db
    .select()
    .from(schema.events)
    .where(
      and(
        eq(schema.events.id, id),
        eq(schema.events.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!event) notFound();

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
        eq(schema.enrollments.targetType, 'evento'),
        eq(schema.enrollments.targetId, id),
      ),
    );

  return (
    <DetailShell
      backHref="/app/events"
      backLabel="Eventos"
      eyebrow={event.kind.replace('_', ' ')}
      title={event.title}
      description={event.description ?? undefined}
      status={{
        label: event.status,
        tone:
          event.status === 'publicado'
            ? 'success'
            : event.status === 'cancelado'
              ? 'danger'
              : 'neutral',
      }}
    >
      <DetailSection title="Datos del evento" description="Se guarda automáticamente al salir de cada campo.">
        <AutoSaveForm
          action={updateEventAction}
          className="grid grid-cols-1 gap-4 md:grid-cols-6"
        >
          <input type="hidden" name="id" value={event.id} />
          <div className="md:col-span-2 md:row-span-4">
            <PhotoUpload
              folder="events"
              defaultValue={event.photoUrl}
              label="Foto"
              aspect="wide"
            />
          </div>
          <div className="md:col-span-2">
            <Field label="Título">
              <Input required name="title" defaultValue={event.title} />
            </Field>
          </div>
          <Field label="Tipo">
            <Select name="kind" defaultValue={event.kind}>
              {EVENT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={event.status}>
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha">
            <Input
              required
              name="startsAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(event.startsAt)}
            />
          </Field>
          <Field label="Precio (€)">
            <Input
              name="price"
              defaultValue={(event.priceCents / 100).toString()}
            />
          </Field>
          <Field label="Cupo">
            <Input
              name="maxAttendees"
              type="number"
              min={1}
              defaultValue={event.maxAttendees ?? ''}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Lugar">
              <Input name="location" defaultValue={event.location ?? ''} />
            </Field>
          </div>
          <div className="md:col-span-4">
            <Field label="Descripción">
              <Textarea
                name="description"
                rows={3}
                defaultValue={event.description ?? ''}
              />
            </Field>
          </div>
        </AutoSaveForm>
      </DetailSection>

      <DetailSection
        title="Inscripciones"
        description={`${enrollments.length} apuntado${enrollments.length === 1 ? '' : 's'}.`}
      >
        {enrollments.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Aún no hay inscripciones.
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
                        ? ` · ${formatDateTime(e.confirmedAt)}`
                        : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Zona peligrosa"
        description="Elimina el evento si ya no aplica."
      >
        <ConfirmDeleteButton
          variant="button"
          action={deleteEventAction}
          hidden={{ id: event.id }}
          triggerLabel="Eliminar evento"
          title={`Eliminar "${event.title}"`}
          description="Las inscripciones de los alumnos quedarán huérfanas."
        />
      </DetailSection>
    </DetailShell>
  );
}
