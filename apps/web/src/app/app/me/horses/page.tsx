import Image from 'next/image';
import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  HorseIcon,
  ArrowRightIcon,
  CertificateIcon,
} from '@phosphor-icons/react/dist/ssr';
import { HORSE_KINDS } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, Button, CreatePanel, EmptyState, Field, Input, Select, SubmitButton,
} from '@/components/ui';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { registerOwnedHorseAction } from './actions';

export const metadata = { title: 'Mis caballos' };
export const dynamic = 'force-dynamic';

export default async function MeHorsesPage() {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);

  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  const rows = await db
    .select({
      horseId: schema.lessonAttendees.horseId,
      horseName: schema.horses.name,
      kind: schema.horses.kind,
      breed: schema.horses.breed,
      photoUrl: schema.horses.photoUrl,
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
      schema.horses.kind,
      schema.horses.breed,
      schema.horses.photoUrl,
    )
    .orderBy(desc(sql`count(*)`));

  // Caballos en propiedad del usuario en este club
  const ownedHorses = await db
    .select({
      id: schema.horses.id,
      name: schema.horses.name,
      kind: schema.horses.kind,
      breed: schema.horses.breed,
      photoUrl: schema.horses.photoUrl,
      role: schema.horseOwners.role,
    })
    .from(schema.horseOwners)
    .innerJoin(schema.horses, eq(schema.horses.id, schema.horseOwners.horseId))
    .where(
      and(
        eq(schema.horseOwners.profileId, session.user.id),
        eq(schema.horses.clubId, session.primary.clubId),
      ),
    )
    .orderBy(schema.horses.name);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Alumno"
        title="Mis caballos"
        description="Tus caballos en propiedad, y los que has montado en clase ordenados por afinidad."
      />

      {ownedHorses.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
            En propiedad
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ownedHorses.map((h) => (
              <Link
                key={h.id}
                href={`/app/horse-owner/${h.id}` as never}
                className="group flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50/60 p-3 shadow-card transition hover:-translate-y-0.5 hover:border-amber-400"
              >
                {h.photoUrl ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                    <Image src={h.photoUrl} alt={h.name} fill sizes="64px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <CertificateIcon size={24} weight="duotone" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Badge tone="brand">Propietario</Badge>
                  <div className="mt-1 text-base font-bold text-stone-900">{h.name}</div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    {h.kind}{h.breed ? ` · ${h.breed}` : ''}
                  </div>
                </div>
                <ArrowRightIcon size={16} className="shrink-0 text-amber-700/40 group-hover:text-amber-700" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <CreatePanel
        label={ownedHorses.length === 0 ? 'Dar de alta un caballo en propiedad' : 'Añadir otro caballo en propiedad'}
        defaultOpen={false}
      >
        <form action={registerOwnedHorseAction} className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <div className="md:col-span-2 md:row-span-3">
            <PhotoUpload folder="horses" label="Foto" />
          </div>
          <div className="md:col-span-2">
            <Field label="Nombre">
              <Input required name="name" placeholder="Sultán" />
            </Field>
          </div>
          <Field label="Tipo">
            <Select name="kind" defaultValue="caballo">
              {HORSE_KINDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </Select>
          </Field>
          <Field label="Raza (opcional)">
            <Input name="breed" />
          </Field>
          <Field label="Año">
            <Input
              name="birthYear"
              type="number"
              min={1980}
              max={new Date().getFullYear()}
            />
          </Field>
          <Field label="Capa">
            <Input name="color" />
          </Field>
          <div className="md:col-span-4">
            <SubmitButton className="w-full">
              Registrar como propietario
            </SubmitButton>
          </div>
        </form>
        <p className="mt-2 text-[11px] font-medium text-stone-500">
          Lo añadimos a tu club activo. Tendrás el panel de propietario activado
          automáticamente y verás la agenda de cuidados.
        </p>
      </CreatePanel>

      <h2 className="mt-8 mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
        Caballos que has montado
      </h2>

      {rows.length === 0 ? (
        <EmptyState
          icon={<HorseIcon size={40} weight="duotone" />}
          title="Aún no has montado en clase"
          description="Cuando tu instructor te asigne un caballo en una clase realizada, aparecerá aquí."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((r) => {
            const affinity = Math.min(99, r.rides * 12);
            return (
              <Link
                key={r.horseId ?? ''}
                href={`/app/me/horses/${r.horseId}` as never}
                className="group flex items-center gap-3 overflow-hidden rounded-3xl border border-stone-200 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
              >
                {r.photoUrl ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                    <Image
                      src={r.photoUrl}
                      alt={r.horseName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <HorseIcon size={28} weight="duotone" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold text-stone-900">
                    {r.horseName}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    {r.kind}
                    {r.breed ? ` · ${r.breed}` : ''}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge tone="brand">afinidad {affinity}%</Badge>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      {r.rides} montura{r.rides !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <ArrowRightIcon
                  size={16}
                  className="shrink-0 text-stone-300 group-hover:text-brand-600"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
