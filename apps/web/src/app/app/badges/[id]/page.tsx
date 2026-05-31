import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, desc, eq } from 'drizzle-orm';
import {
  TrashIcon,
  MedalIcon,
  XIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import { Button, Field, Select, SubmitButton,
} from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { AutoSaveForm } from '@/components/ui/AutoSaveForm';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDelete';
import { BadgeCard } from '@/components/badge/BadgeCard';
import { BadgeLiveEditor } from '@/components/badge/BadgeLiveEditor';
import { formatDate } from '@/lib/format';
import {
  awardBadgeAction,
  deleteBadgeAction,
  revokeBadgeAction,
  updateBadgeAction,
} from '../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [b] = await db
    .select({ name: schema.badges.name })
    .from(schema.badges)
    .where(eq(schema.badges.id, id))
    .limit(1);
  return { title: b?.name ?? 'Insignia' };
}

export default async function BadgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);
  const { id } = await params;

  const [badge] = await db
    .select()
    .from(schema.badges)
    .where(
      and(
        eq(schema.badges.id, id),
        eq(schema.badges.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!badge) notFound();

  const awarded = await db
    .select({
      id: schema.riderBadges.id,
      awardedAt: schema.riderBadges.awardedAt,
      notes: schema.riderBadges.notes,
      riderName: schema.riders.name,
      riderId: schema.riders.id,
      riderPhoto: schema.riders.photoUrl,
    })
    .from(schema.riderBadges)
    .innerJoin(schema.riders, eq(schema.riders.id, schema.riderBadges.riderId))
    .where(eq(schema.riderBadges.badgeId, id))
    .orderBy(desc(schema.riderBadges.awardedAt));

  const awardedRiderIds = new Set(awarded.map((a) => a.riderId));

  const riders = await db
    .select({ id: schema.riders.id, name: schema.riders.name })
    .from(schema.riders)
    .where(eq(schema.riders.clubId, session.primary.clubId))
    .orderBy(schema.riders.name);

  const candidateRiders = riders.filter((r) => !awardedRiderIds.has(r.id));

  return (
    <DetailShell
      backHref="/app/badges"
      backLabel="Insignias"
      eyebrow="Insignia"
      title={badge.name}
      description={badge.description ?? undefined}
      status={{ label: `${awarded.length} entregadas`, tone: 'brand' }}
    >
      <DetailSection
        title="Diseño"
        description="Se guarda solo al salir de cada campo. Los alumnos verán los cambios al instante."
      >
        <AutoSaveForm action={updateBadgeAction} className="space-y-4">
          <input type="hidden" name="id" value={badge.id} />
          <BadgeLiveEditor
            clubName={session.primary.clubName}
            defaultValues={{
              name: badge.name,
              subtitle: badge.subtitle,
              categoryLabel: badge.categoryLabel,
              description: badge.description,
              color: badge.color,
              iconUrl: badge.iconUrl,
            }}
          />
        </AutoSaveForm>
      </DetailSection>

      <DetailSection
        title="Entregar a un alumno"
        description="Aparecerá en su panel y recibe una notificación."
      >
        {candidateRiders.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Todos los alumnos del club ya tienen esta insignia.
          </p>
        ) : (
          <form
            action={awardBadgeAction}
            className="grid grid-cols-1 gap-3 md:grid-cols-6"
          >
            <input type="hidden" name="badgeId" value={badge.id} />
            <div className="md:col-span-2">
              <Field label="Alumno">
                <Select name="riderId" required defaultValue="">
                  <option value="" disabled>
                    Selecciona…
                  </option>
                  {candidateRiders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Nota (opcional)">
                <Input
                  name="notes"
                  placeholder="Por su actitud en la última clase…"
                />
              </Field>
            </div>
            <div className="md:col-span-1 flex items-end">
              <SubmitButton variant="outline" className="w-full">
                <MedalIcon size={14} weight="bold" /> Entregar
              </SubmitButton>
            </div>
          </form>
        )}
      </DetailSection>

      <DetailSection
        title="Alumnos premiados"
        description={`${awarded.length} alumno${awarded.length === 1 ? '' : 's'} ha${awarded.length === 1 ? '' : 'n'} recibido esta insignia.`}
      >
        {awarded.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Aún no la has entregado a nadie.
          </p>
        ) : (
          <div className="space-y-2">
            {awarded.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                <div className="flex items-center gap-3">
                  {a.riderPhoto ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-stone-200">
                      <Image
                        src={a.riderPhoto}
                        alt={a.riderName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <MedalIcon size={18} weight="duotone" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-stone-900">
                      {a.riderName}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500">
                      Entregada {formatDate(a.awardedAt)}
                      {a.notes ? ` · ${a.notes}` : ''}
                    </div>
                  </div>
                </div>
                <ConfirmDeleteButton
                  action={revokeBadgeAction}
                  hidden={{ id: a.id, badgeId: badge.id }}
                  title="Retirar insignia"
                  description={`¿Quieres retirar la insignia "${badge.name}" a ${a.riderName}?`}
                  confirmLabel="Sí, retirar"
                />
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Cómo se ve para los alumnos"
        description="Misma carta con el nombre real del jinete cuando la reciben."
      >
        <div className="max-w-xs">
          <BadgeCard
            clubName={session.primary.clubName}
            recipientName={awarded[0]?.riderName ?? 'Alumno demo'}
            badge={{
              name: badge.name,
              subtitle: badge.subtitle,
              categoryLabel: badge.categoryLabel,
              color: badge.color,
              iconUrl: badge.iconUrl,
            }}
          />
        </div>
      </DetailSection>

      <DetailSection
        title="Zona peligrosa"
        description="Eliminar la insignia retira automáticamente todas las entregas."
      >
        <ConfirmDeleteButton
          variant="button"
          action={deleteBadgeAction}
          hidden={{ id: badge.id }}
          triggerLabel="Eliminar insignia"
          title={`Eliminar "${badge.name}"`}
          description={`Se retirará a ${awarded.length} alumno${awarded.length === 1 ? '' : 's'} y no se puede deshacer.`}
        />
      </DetailSection>
    </DetailShell>
  );
}
