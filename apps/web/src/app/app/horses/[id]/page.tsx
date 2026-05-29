import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, desc, eq } from 'drizzle-orm';
import {
  TrashIcon,
  ClipboardTextIcon,
  CalendarBlankIcon,
  ChatCircleTextIcon,
  CertificateIcon,
  UserPlusIcon,
  XIcon,
} from '@phosphor-icons/react/dist/ssr';
import { HORSE_KINDS, HORSE_STATUSES } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
  Badge,
} from '@/components/ui';
import { AutoSaveForm } from '@/components/ui/AutoSaveForm';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDelete';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { formatDate, formatDateTime } from '@/lib/format';
import {
  addHorseOwnerAction,
  deleteHorseAction,
  removeHorseOwnerAction,
  updateHorseAction,
} from '../actions';

export const dynamic = 'force-dynamic';

type CareItemDone = { key: string; done: boolean };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [h] = await db
    .select({ name: schema.horses.name })
    .from(schema.horses)
    .where(eq(schema.horses.id, id))
    .limit(1);
  return { title: h?.name ?? 'Caballo' };
}

export default async function HorseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);
  const { id } = await params;

  // Columnas explícitas para tolerar que care_template_id no exista aún
  // en la BD (migración 0007 pendiente). El fallback queda en null.
  const horseRows = await db
    .select({
      id: schema.horses.id,
      clubId: schema.horses.clubId,
      name: schema.horses.name,
      kind: schema.horses.kind,
      breed: schema.horses.breed,
      birthYear: schema.horses.birthYear,
      color: schema.horses.color,
      status: schema.horses.status,
      photoUrl: schema.horses.photoUrl,
      notes: schema.horses.notes,
      createdAt: schema.horses.createdAt,
      updatedAt: schema.horses.updatedAt,
    })
    .from(schema.horses)
    .where(
      and(
        eq(schema.horses.id, id),
        eq(schema.horses.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (horseRows.length === 0) notFound();
  const horse = {
    ...horseRows[0]!,
    careTemplateId: null as string | null,
  };
  // Si la migración 0007 está aplicada, recuperamos el valor real.
  try {
    const [withTemplate] = await db
      .select({ careTemplateId: schema.horses.careTemplateId })
      .from(schema.horses)
      .where(eq(schema.horses.id, id))
      .limit(1);
    if (withTemplate?.careTemplateId !== undefined) {
      horse.careTemplateId = withTemplate.careTemplateId ?? null;
    }
  } catch {
    // columna no existe todavía, ok
  }

  const owners = await db
    .select({
      id: schema.horseOwners.id,
      role: schema.horseOwners.role,
      profileId: schema.profiles.id,
      name: schema.profiles.fullName,
      email: schema.profiles.email,
    })
    .from(schema.horseOwners)
    .innerJoin(schema.profiles, eq(schema.profiles.id, schema.horseOwners.profileId))
    .where(eq(schema.horseOwners.horseId, id));

  const lessons = await db
    .select({
      id: schema.lessonAttendees.id,
      date: schema.lessons.date,
      discipline: schema.lessons.discipline,
      status: schema.lessons.status,
      riderName: schema.riders.name,
    })
    .from(schema.lessonAttendees)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonAttendees.lessonId))
    .innerJoin(schema.riders, eq(schema.riders.id, schema.lessonAttendees.riderId))
    .where(eq(schema.lessonAttendees.horseId, id))
    .orderBy(desc(schema.lessons.date))
    .limit(10);

  const careLogs = await db
    .select()
    .from(schema.horseCareLogs)
    .where(eq(schema.horseCareLogs.horseId, id))
    .orderBy(desc(schema.horseCareLogs.forDate))
    .limit(10);

  const careTemplates = await db
    .select({
      id: schema.horseCareTemplates.id,
      name: schema.horseCareTemplates.name,
    })
    .from(schema.horseCareTemplates)
    .where(eq(schema.horseCareTemplates.clubId, session.primary.clubId))
    .orderBy(schema.horseCareTemplates.name);

  const reviews = await db
    .select({
      id: schema.horseReviews.id,
      rating: schema.horseReviews.rating,
      body: schema.horseReviews.body,
      riderName: schema.riders.name,
    })
    .from(schema.horseReviews)
    .innerJoin(schema.riders, eq(schema.riders.id, schema.horseReviews.riderId))
    .where(eq(schema.horseReviews.horseId, id))
    .orderBy(desc(schema.horseReviews.createdAt))
    .limit(10);

  const statusTone =
    horse.status === 'activo'
      ? 'success'
      : horse.status === 'descanso'
        ? 'warn'
        : 'neutral';

  return (
    <DetailShell
      backHref="/app/horses"
      backLabel="Caballos"
      eyebrow={`${horse.kind}${horse.breed ? ` · ${horse.breed}` : ''}`}
      title={horse.name}
      description={horse.notes ?? undefined}
      status={{ label: horse.status, tone: statusTone }}
    >
      <DetailSection
        title="Datos generales"
        description="Se guarda solo al salir de cada campo."
      >
        <AutoSaveForm
          action={updateHorseAction}
          className="grid grid-cols-1 gap-4 md:grid-cols-6"
        >
          <input type="hidden" name="id" value={horse.id} />
          <div className="md:col-span-2 md:row-span-4">
            <PhotoUpload
              folder="horses"
              defaultValue={horse.photoUrl}
              label="Foto"
            />
          </div>
          <div className="md:col-span-2">
            <Field label="Nombre">
              <Input required name="name" defaultValue={horse.name} />
            </Field>
          </div>
          <Field label="Tipo">
            <Select name="kind" defaultValue={horse.kind}>
              {HORSE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={horse.status}>
              {HORSE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Raza">
            <Input name="breed" defaultValue={horse.breed ?? ''} />
          </Field>
          <Field label="Año">
            <Input
              name="birthYear"
              type="number"
              min={1980}
              max={new Date().getFullYear()}
              defaultValue={horse.birthYear ?? ''}
            />
          </Field>
          <Field label="Color">
            <Input name="color" defaultValue={horse.color ?? ''} />
          </Field>
          <div className="md:col-span-2">
            <Field
              label="Plantilla de cuidados"
              hint="La que verá el mozo en su checklist diaria."
            >
              <Select
                name="careTemplateId"
                defaultValue={horse.careTemplateId ?? ''}
              >
                <option value="">Sin plantilla específica</option>
                {careTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="md:col-span-4">
            <Field label="Notas internas">
              <Textarea
                name="notes"
                rows={3}
                defaultValue={horse.notes ?? ''}
                placeholder="Carácter, medicación, manías..."
              />
            </Field>
          </div>
        </AutoSaveForm>
      </DetailSection>

      <DetailSection
        title="Propietarios"
        description="Quienes ven la ficha y reciben las notificaciones de cuidados."
      >
        {owners.length === 0 ? (
          <p className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm font-medium text-stone-500">
            Aún no hay propietario asignado.
          </p>
        ) : (
          <div className="mb-4 space-y-2">
            {owners.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <CertificateIcon size={16} weight="duotone" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-900">
                      {o.name ?? o.email}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500">
                      {o.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={o.role === 'owner' ? 'brand' : 'neutral'}>
                    {o.role}
                  </Badge>
                  <ConfirmDeleteButton
                    action={removeHorseOwnerAction}
                    hidden={{ id: o.id, horseId: horse.id }}
                    title="Quitar propietario"
                    description={`¿Quieres quitar a ${o.name ?? o.email} como propietario de ${horse.name}?`}
                    confirmLabel="Sí, quitar"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <form
          action={addHorseOwnerAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-6"
        >
          <input type="hidden" name="horseId" value={horse.id} />
          <div className="md:col-span-3">
            <Field
              label="Email del propietario"
              hint="Debe tener cuenta en Equmanager."
            >
              <Input
                required
                type="email"
                name="email"
                placeholder="propietario@correo.com"
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Rol">
              <Select name="role" defaultValue="owner">
                <option value="owner">Propietario</option>
                <option value="authorized">Autorizado</option>
              </Select>
            </Field>
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button type="submit" variant="outline" className="w-full">
              <UserPlusIcon size={14} weight="bold" /> Añadir
            </Button>
          </div>
        </form>
      </DetailSection>

      <DetailSection
        title="Últimas clases"
        description="Quién lo ha montado y cuándo."
      >
        {lessons.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Sin asistencias registradas.
          </p>
        ) : (
          <div className="space-y-2">
            {lessons.map((l) => (
              <div
                key={l.id}
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
                      {l.riderName}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500">
                      {l.discipline} · {formatDateTime(l.date)}
                    </div>
                  </div>
                </div>
                <Badge
                  tone={
                    l.status === 'realizada'
                      ? 'success'
                      : l.status === 'cancelada'
                        ? 'danger'
                        : 'brand'
                  }
                >
                  {l.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Cuidados recientes"
        description="Checklists completados por los mozos."
      >
        {careLogs.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Aún no se ha registrado ningún checklist.
          </p>
        ) : (
          <div className="space-y-2">
            {careLogs.map((c) => {
              const items = (c.itemsDone as CareItemDone[]) ?? [];
              const done = items.filter((i) => i.done).length;
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardTextIcon
                      size={18}
                      weight="duotone"
                      className="text-brand-700"
                    />
                    <div>
                      <div className="text-sm font-bold text-stone-900">
                        {formatDate(c.forDate)}
                      </div>
                      {c.notes && (
                        <div className="text-[11px] font-medium text-stone-500">
                          {c.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge tone={done === items.length ? 'success' : 'warn'}>
                    {done}/{items.length}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Opiniones de jinetes"
        description="Comentarios públicos para ayudar a otros alumnos."
      >
        {reviews.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Sin opiniones por ahora.
          </p>
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <ChatCircleTextIcon
                      size={14}
                      weight="duotone"
                      className="text-brand-700"
                    />
                    {r.riderName}
                  </div>
                  <div className="text-xs font-bold text-brand-700">
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                  </div>
                </div>
                {r.body && (
                  <p className="mt-1 text-xs font-medium text-stone-600">
                    {r.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Zona peligrosa"
        description="Estas acciones no se pueden deshacer."
      >
        <ConfirmDeleteButton
          variant="button"
          action={deleteHorseAction}
          hidden={{ id: horse.id }}
          triggerLabel="Eliminar caballo"
          title={`Eliminar a ${horse.name}`}
          description="Se eliminarán también sus cuidados, historial de montura y opiniones."
        />
      </DetailSection>
    </DetailShell>
  );
}
