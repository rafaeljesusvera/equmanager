import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  HorseIcon,
  StarIcon,
  CalendarBlankIcon,
  ChatCircleTextIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import { Badge, Button, Field, Input, Select, SubmitButton,
} from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { postReviewAction } from '../actions';

export const dynamic = 'force-dynamic';

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

export default async function MeHorseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);
  const { id } = await params;

  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  const [horse] = await db
    .select()
    .from(schema.horses)
    .where(
      and(
        eq(schema.horses.id, id),
        eq(schema.horses.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!horse) notFound();

  const myRides = await db
    .select({
      id: schema.lessonAttendees.id,
      date: schema.lessons.date,
      discipline: schema.lessons.discipline,
      status: schema.lessons.status,
    })
    .from(schema.lessonAttendees)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonAttendees.lessonId))
    .where(
      and(
        eq(schema.lessonAttendees.riderId, rider!.id),
        eq(schema.lessonAttendees.horseId, id),
      ),
    )
    .orderBy(desc(schema.lessons.date));

  const totalRidesRows = await db
    .select({
      totalRides: sql<number>`count(*)::int`,
    })
    .from(schema.lessonAttendees)
    .where(
      and(
        eq(schema.lessonAttendees.horseId, id),
        eq(schema.lessonAttendees.attended, true),
      ),
    );
  const totalRides = totalRidesRows[0]?.totalRides ?? 0;

  const myAttendedRides = myRides.filter((r) => r.status === 'realizada').length;

  const [myReview] = await db
    .select()
    .from(schema.horseReviews)
    .where(
      and(
        eq(schema.horseReviews.horseId, id),
        eq(schema.horseReviews.riderId, rider!.id),
      ),
    )
    .limit(1);

  const otherReviews = await db
    .select({
      id: schema.horseReviews.id,
      rating: schema.horseReviews.rating,
      title: schema.horseReviews.title,
      body: schema.horseReviews.body,
      createdAt: schema.horseReviews.createdAt,
      riderName: schema.riders.name,
    })
    .from(schema.horseReviews)
    .innerJoin(schema.riders, eq(schema.riders.id, schema.horseReviews.riderId))
    .where(eq(schema.horseReviews.horseId, id))
    .orderBy(desc(schema.horseReviews.createdAt))
    .limit(20);

  const affinity = Math.min(99, myAttendedRides * 12);

  return (
    <DetailShell
      backHref="/app/me/horses"
      backLabel="Mis caballos"
      eyebrow={`${horse.kind}${horse.breed ? ` · ${horse.breed}` : ''}`}
      title={horse.name}
      description={horse.notes ?? undefined}
      status={{
        label: `Afinidad ${affinity}%`,
        tone: affinity > 60 ? 'brand' : 'neutral',
      }}
    >
      {horse.photoUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-stone-100">
          <Image
            src={horse.photoUrl}
            alt={horse.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        </div>
      )}

      <DetailSection title="Tu relación con este caballo">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Monturas tuyas" value={`${myAttendedRides}`} />
          <Stat label="Total clases" value={`${totalRides}`} />
          <Stat
            label="Última montura"
            value={
              myRides.find((r) => r.status === 'realizada')
                ? formatDateTime(
                    myRides.find((r) => r.status === 'realizada')!.date,
                    { day: '2-digit', month: 'short' },
                  )
                : '—'
            }
          />
        </div>
      </DetailSection>

      <DetailSection
        title="Tu opinión"
        description="Visible para el resto de jinetes del club."
      >
        <form
          action={postReviewAction}
          className="grid grid-cols-1 gap-3 sm:grid-cols-6"
        >
          <input type="hidden" name="horseId" value={horse.id} />
          <div className="sm:col-span-1">
            <Field label="★">
              <Select name="rating" defaultValue={String(myReview?.rating ?? 5)}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="sm:col-span-5">
            <Field label="Comentario">
              <Input
                name="body"
                defaultValue={myReview?.body ?? ''}
                placeholder="Cómo te llevaste, cosas a tener en cuenta..."
                maxLength={240}
              />
            </Field>
          </div>
          <div className="sm:col-span-6">
            <SubmitButton variant="secondary">
              <StarIcon size={12} weight="fill" /> Guardar opinión
            </SubmitButton>
          </div>
        </form>
      </DetailSection>

      <DetailSection
        title="Lo que dicen otros jinetes"
        description={`${otherReviews.filter((r) => r.id !== myReview?.id).length} opinión${otherReviews.filter((r) => r.id !== myReview?.id).length === 1 ? '' : 'es'} además de la tuya.`}
      >
        {otherReviews.filter((r) => r.id !== myReview?.id).length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Nadie más ha opinado aún. Sé el primero en compartir.
          </p>
        ) : (
          <div className="space-y-2">
            {otherReviews
              .filter((r) => r.id !== myReview?.id)
              .map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-3"
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
                  {r.title && (
                    <div className="mt-1 text-xs font-bold text-stone-900">
                      {r.title}
                    </div>
                  )}
                  {r.body && (
                    <p className="mt-1 text-xs font-medium text-stone-700">
                      {r.body}
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Tu historial con este caballo"
        description={`${myRides.length} ${myRides.length === 1 ? 'clase' : 'clases'} en total.`}
      >
        {myRides.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            Aún no te han asignado este caballo.
          </p>
        ) : (
          <div className="space-y-2">
            {myRides.slice(0, 10).map((r) => (
              <div
                key={r.id}
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
                      {formatDateTime(r.date)}
                    </div>
                    <div className="text-[11px] font-medium text-stone-500">
                      {r.discipline.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <Badge
                  tone={
                    r.status === 'realizada'
                      ? 'success'
                      : r.status === 'cancelada'
                        ? 'danger'
                        : 'brand'
                  }
                >
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </DetailSection>
    </DetailShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-center">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-stone-900">{value}</div>
    </div>
  );
}
