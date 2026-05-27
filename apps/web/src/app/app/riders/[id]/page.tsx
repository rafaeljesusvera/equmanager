import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, desc, eq } from 'drizzle-orm';
import {
  TrashIcon,
  CalendarBlankIcon,
  MedalIcon,
  TicketIcon,
  EyeIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react/dist/ssr';
import { RIDER_CATEGORIES, RIDER_TIERS } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import { Badge, Button, Field, Input, Select, Textarea } from '@/components/ui';
import { AutoSaveForm } from '@/components/ui/AutoSaveForm';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDelete';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { formatDate, formatDateTime } from '@/lib/format';
import {
  deleteRiderAction,
  impersonateRiderAction,
  updateRiderAction,
} from '../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [r] = await db
    .select({ name: schema.riders.name })
    .from(schema.riders)
    .where(eq(schema.riders.id, id))
    .limit(1);
  return { title: r?.name ?? 'Alumno' };
}

export default async function RiderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);
  const { id } = await params;
  const { error: errorMsg } = await searchParams;

  const [rider] = await db
    .select()
    .from(schema.riders)
    .where(
      and(
        eq(schema.riders.id, id),
        eq(schema.riders.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!rider) notFound();

  const lessons = await db
    .select({
      id: schema.lessonAttendees.id,
      date: schema.lessons.date,
      discipline: schema.lessons.discipline,
      status: schema.lessons.status,
      horseName: schema.horses.name,
    })
    .from(schema.lessonAttendees)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonAttendees.lessonId))
    .leftJoin(schema.horses, eq(schema.horses.id, schema.lessonAttendees.horseId))
    .where(eq(schema.lessonAttendees.riderId, id))
    .orderBy(desc(schema.lessons.date))
    .limit(12);

  const badges = await db
    .select({
      id: schema.riderBadges.id,
      awardedAt: schema.riderBadges.awardedAt,
      name: schema.badges.name,
      color: schema.badges.color,
    })
    .from(schema.riderBadges)
    .innerJoin(schema.badges, eq(schema.badges.id, schema.riderBadges.badgeId))
    .where(eq(schema.riderBadges.riderId, id))
    .orderBy(desc(schema.riderBadges.awardedAt))
    .limit(10);

  const bonos = await db
    .select({
      id: schema.bonoPurchases.id,
      classesLeft: schema.bonoPurchases.classesLeft,
      purchasedAt: schema.bonoPurchases.purchasedAt,
      expiresAt: schema.bonoPurchases.expiresAt,
      name: schema.bonos.name,
      total: schema.bonos.totalClasses,
    })
    .from(schema.bonoPurchases)
    .innerJoin(schema.bonos, eq(schema.bonos.id, schema.bonoPurchases.bonoId))
    .where(eq(schema.bonoPurchases.riderId, id))
    .orderBy(desc(schema.bonoPurchases.purchasedAt))
    .limit(10);

  return (
    <DetailShell
      backHref="/app/riders"
      backLabel="Alumnos"
      eyebrow={`${rider.category.replace('_', ' ')} · ${rider.tier}`}
      title={rider.name}
      description={rider.notes ?? undefined}
      status={{
        label: rider.status,
        tone: rider.status === 'activo' ? 'success' : 'neutral',
      }}
    >
      {errorMsg && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
          <WarningCircleIcon size={16} weight="fill" />
          {errorMsg}
        </div>
      )}

      <DetailSection
        title="Acciones rápidas"
        description="Para ver Equmanager exactamente como lo ve este alumno sin compartir contraseñas."
      >
        {rider.profileId ? (
          <form action={impersonateRiderAction}>
            <input type="hidden" name="id" value={rider.id} />
            <Button type="submit" variant="outline">
              <EyeIcon size={14} weight="bold" /> Ver Equmanager como {rider.name}
            </Button>
          </form>
        ) : (
          <p className="text-sm font-medium text-stone-500">
            Este alumno aún no se ha registrado con su email en Equmanager. En
            cuanto lo haga, podrás verlo como él para asistirle.
          </p>
        )}
      </DetailSection>
      <DetailSection
        title="Datos generales"
        description="Se guarda solo al salir de cada campo."
      >
        <AutoSaveForm
          action={updateRiderAction}
          className="grid grid-cols-1 gap-4 md:grid-cols-6"
        >
          <input type="hidden" name="id" value={rider.id} />
          <div className="md:col-span-2 md:row-span-4">
            <PhotoUpload
              folder="riders"
              defaultValue={rider.photoUrl}
              label="Foto"
            />
          </div>
          <div className="md:col-span-2">
            <Field label="Nombre">
              <Input required name="name" defaultValue={rider.name} />
            </Field>
          </div>
          <Field label="Estado">
            <Select name="status" defaultValue={rider.status}>
              <option value="activo">activo</option>
              <option value="baja">baja</option>
            </Select>
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={rider.email ?? ''} />
          </Field>
          <Field label="Teléfono">
            <Input name="phone" defaultValue={rider.phone ?? ''} />
          </Field>
          <Field label="Categoría">
            <Select name="category" defaultValue={rider.category}>
              {RIDER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nivel">
            <Select name="tier" defaultValue={rider.tier}>
              {RIDER_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-4">
            <Field label="Notas internas">
              <Textarea
                name="notes"
                rows={3}
                defaultValue={rider.notes ?? ''}
                placeholder="Lesiones, miedos, preferencias..."
              />
            </Field>
          </div>
        </AutoSaveForm>
      </DetailSection>

      <DetailSection
        title="Historial de clases"
        description="Las últimas asistencias programadas y realizadas."
      >
        {lessons.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Aún no participa en ninguna clase.
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
                      {formatDateTime(l.date)}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500">
                      {l.discipline}
                      {l.horseName ? ` · ${l.horseName}` : ''}
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

      <DetailSection title="Insignias" description="Reconocimientos otorgados.">
        {badges.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Aún no tiene insignias.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5"
                style={{ borderColor: `${b.color}40` }}
              >
                <MedalIcon size={14} weight="fill" style={{ color: b.color }} />
                <span className="text-xs font-bold text-stone-900">{b.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  {formatDate(b.awardedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Bonos comprados"
        description="Packs activos y consumidos."
      >
        {bonos.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            No ha comprado bonos aún.
          </p>
        ) : (
          <div className="space-y-2">
            {bonos.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <TicketIcon
                    size={18}
                    weight="duotone"
                    className="text-brand-700"
                  />
                  <div>
                    <div className="text-sm font-bold text-stone-900">{b.name}</div>
                    <div className="text-[11px] font-medium text-stone-500">
                      Comprado {formatDate(b.purchasedAt)}
                      {b.expiresAt ? ` · expira ${formatDate(b.expiresAt)}` : ''}
                    </div>
                  </div>
                </div>
                <Badge tone="brand">
                  {b.classesLeft}/{b.total}
                </Badge>
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
          action={deleteRiderAction}
          hidden={{ id: rider.id }}
          triggerLabel="Eliminar alumno"
          title={`Eliminar a ${rider.name}`}
          description="Se eliminarán sus inscripciones, asistencias e insignias. No se puede deshacer."
        />
      </DetailSection>
    </DetailShell>
  );
}
