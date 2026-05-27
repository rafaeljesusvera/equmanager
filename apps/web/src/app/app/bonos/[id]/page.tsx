import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, desc, eq } from 'drizzle-orm';
import {
  TrashIcon,
  GraduationCapIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import { Badge, Button, Field, Input, Textarea } from '@/components/ui';
import { AutoSaveForm } from '@/components/ui/AutoSaveForm';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDelete';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { formatCents, formatDate } from '@/lib/format';
import { deleteBonoAction, updateBonoAction } from '../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [b] = await db
    .select({ name: schema.bonos.name })
    .from(schema.bonos)
    .where(eq(schema.bonos.id, id))
    .limit(1);
  return { title: b?.name ?? 'Bono' };
}

export default async function BonoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);
  const { id } = await params;

  const [bono] = await db
    .select()
    .from(schema.bonos)
    .where(
      and(
        eq(schema.bonos.id, id),
        eq(schema.bonos.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!bono) notFound();

  const purchases = await db
    .select({
      id: schema.bonoPurchases.id,
      classesLeft: schema.bonoPurchases.classesLeft,
      purchasedAt: schema.bonoPurchases.purchasedAt,
      expiresAt: schema.bonoPurchases.expiresAt,
      riderName: schema.riders.name,
      riderEmail: schema.riders.email,
    })
    .from(schema.bonoPurchases)
    .innerJoin(schema.riders, eq(schema.riders.id, schema.bonoPurchases.riderId))
    .where(eq(schema.bonoPurchases.bonoId, id))
    .orderBy(desc(schema.bonoPurchases.purchasedAt));

  return (
    <DetailShell
      backHref="/app/bonos"
      backLabel="Bonos"
      eyebrow={`${bono.totalClasses} clases · ${bono.validityDays} días`}
      title={bono.name}
      description={bono.description ?? undefined}
      status={{
        label: bono.active ? 'activo' : 'pausado',
        tone: bono.active ? 'success' : 'neutral',
      }}
    >
      <DetailSection title="Datos del bono" description="Se guarda automáticamente al salir de cada campo.">
        <AutoSaveForm
          action={updateBonoAction}
          className="grid grid-cols-1 gap-4 md:grid-cols-6"
        >
          <input type="hidden" name="id" value={bono.id} />
          <div className="md:col-span-2 md:row-span-3">
            <PhotoUpload
              folder="bonos"
              defaultValue={bono.photoUrl}
              label="Foto"
              aspect="wide"
            />
          </div>
          <div className="md:col-span-2">
            <Field label="Nombre">
              <Input required name="name" defaultValue={bono.name} />
            </Field>
          </div>
          <Field label="Clases">
            <Input
              name="totalClasses"
              type="number"
              min={1}
              max={200}
              defaultValue={bono.totalClasses}
            />
          </Field>
          <Field label="Precio (€)">
            <Input
              name="price"
              defaultValue={(bono.priceCents / 100).toString()}
            />
          </Field>
          <Field label="Validez (días)">
            <Input
              name="validityDays"
              type="number"
              min={7}
              defaultValue={bono.validityDays}
            />
          </Field>
          <div className="md:col-span-3">
            <label className="flex items-center gap-2 pt-7 text-xs font-bold text-stone-700">
              <input
                type="checkbox"
                name="active"
                defaultChecked={bono.active}
                className="h-4 w-4 accent-brand-700"
              />
              Disponible para comprar
            </label>
          </div>
          <div className="md:col-span-4">
            <Field label="Descripción">
              <Textarea
                name="description"
                rows={3}
                defaultValue={bono.description ?? ''}
              />
            </Field>
          </div>
        </AutoSaveForm>
      </DetailSection>

      <DetailSection
        title="Compras"
        description={`${purchases.length} bono${purchases.length === 1 ? '' : 's'} comprado${purchases.length === 1 ? '' : 's'}. Ingreso total: ${formatCents(bono.priceCents * purchases.length)}.`}
      >
        {purchases.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Aún nadie lo ha comprado. Cuando un alumno lo compre, aparecerá
            aquí con el saldo restante.
          </p>
        ) : (
          <div className="space-y-2">
            {purchases.map((p) => (
              <div
                key={p.id}
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
                      {p.riderName}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500">
                      Comprado {formatDate(p.purchasedAt)}
                      {p.expiresAt ? ` · expira ${formatDate(p.expiresAt)}` : ''}
                    </div>
                  </div>
                </div>
                <Badge tone="brand">
                  {p.classesLeft}/{bono.totalClasses}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Zona peligrosa"
        description="Eliminar un bono no elimina las compras pasadas."
      >
        <ConfirmDeleteButton
          variant="button"
          action={deleteBonoAction}
          hidden={{ id: bono.id }}
          triggerLabel="Eliminar bono"
          title={`Eliminar "${bono.name}"`}
          description="Las compras de los alumnos quedarán en su historial pero ya no se podrá comprar de nuevo."
        />
      </DetailSection>
    </DetailShell>
  );
}
