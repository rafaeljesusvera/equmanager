import Image from 'next/image';
import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, desc, eq } from 'drizzle-orm';
import {
  TicketIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, Button, EmptyState, SubmitButton,
} from '@/components/ui';
import { formatCents, formatDate } from '@/lib/format';
import { buyBonoAction } from './actions';

export const metadata = { title: 'Bonos' };
export const dynamic = 'force-dynamic';

export default async function MeBonosPage() {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);

  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  const [available, mine] = await Promise.all([
    db
      .select()
      .from(schema.bonos)
      .where(
        and(
          eq(schema.bonos.clubId, session.primary.clubId),
          eq(schema.bonos.active, true),
        ),
      )
      .orderBy(schema.bonos.priceCents),
    db
      .select({
        id: schema.bonoPurchases.id,
        classesLeft: schema.bonoPurchases.classesLeft,
        purchasedAt: schema.bonoPurchases.purchasedAt,
        expiresAt: schema.bonoPurchases.expiresAt,
        name: schema.bonos.name,
        totalClasses: schema.bonos.totalClasses,
        photoUrl: schema.bonos.photoUrl,
      })
      .from(schema.bonoPurchases)
      .innerJoin(schema.bonos, eq(schema.bonos.id, schema.bonoPurchases.bonoId))
      .where(eq(schema.bonoPurchases.riderId, rider!.id))
      .orderBy(desc(schema.bonoPurchases.purchasedAt)),
  ]);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Alumno"
        title="Bonos"
        description="Compra packs y consulta los que ya tienes activos."
      />

      <section className="mb-8">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          Mis bonos
        </h2>
        {mine.length === 0 ? (
          <EmptyState
            icon={<TicketIcon size={36} weight="duotone" />}
            title="Aún no tienes bonos"
            description="Compra uno de los packs disponibles abajo para empezar a reservar clases."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mine.map((b) => (
              <Link
                key={b.id}
                href={`/app/me/bonos/${b.id}` as never}
                className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
              >
                {b.photoUrl && (
                  <div className="relative aspect-[16/9] w-full bg-stone-100">
                    <Image
                      src={b.photoUrl}
                      alt={b.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-stone-900">
                      {b.name}
                    </h3>
                    <ArrowRightIcon
                      size={16}
                      className="shrink-0 text-stone-300 group-hover:text-brand-600"
                    />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    Comprado el {formatDate(b.purchasedAt)}
                  </p>
                  <div className="mt-3 text-2xl font-bold text-brand-700">
                    {b.classesLeft} / {b.totalClasses}
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-stone-500">
                    Caduca el {formatDate(b.expiresAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          Disponibles
        </h2>
        {available.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Tu hípica aún no ofrece bonos.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {available.map((b) => (
              <article
                key={b.id}
                className="flex flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-bold text-stone-900">{b.name}</h3>
                  <Badge tone="brand">{formatCents(b.priceCents)}</Badge>
                </div>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  {b.totalClasses} clases · válido {b.validityDays} días
                </p>
                {b.description && (
                  <p className="mt-2 text-sm font-medium text-stone-600">
                    {b.description}
                  </p>
                )}
                <form action={buyBonoAction} className="mt-auto pt-4">
                  <input type="hidden" name="bonoId" value={b.id} />
                  <SubmitButton className="w-full">
                    Comprar (pago simulado)
                  </SubmitButton>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
