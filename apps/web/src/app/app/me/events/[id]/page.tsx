import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq, sql } from 'drizzle-orm';
import {
  CalendarBlankIcon,
  MapPinIcon,
  TicketIcon,
  UsersThreeIcon,
  CheckCircleIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import { Badge, Button, SubmitButton,
} from '@/components/ui';
import { formatCents, formatDateTime } from '@/lib/format';
import { enrollInEventAction } from '../actions';

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

export default async function MeEventDetailPage({
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

  const [enrollment] = await db
    .select()
    .from(schema.enrollments)
    .where(
      and(
        eq(schema.enrollments.targetType, 'evento'),
        eq(schema.enrollments.targetId, id),
        eq(schema.enrollments.profileId, session.user.id),
      ),
    )
    .limit(1);

  const enrolledCountRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.enrollments)
    .where(
      and(
        eq(schema.enrollments.targetType, 'evento'),
        eq(schema.enrollments.targetId, id),
      ),
    );
  const totalEnrolled = enrolledCountRows[0]?.n ?? 0;

  const enrolled = !!enrollment;
  const seatsLeft = event.maxAttendees
    ? Math.max(0, event.maxAttendees - totalEnrolled)
    : null;

  return (
    <DetailShell
      backHref="/app/me/events"
      backLabel="Eventos"
      eyebrow={event.kind.replace('_', ' ')}
      title={event.title}
      status={
        enrolled
          ? { label: 'Apuntado', tone: 'success' }
          : event.status === 'cancelado'
            ? { label: 'Cancelado', tone: 'danger' }
            : seatsLeft === 0
              ? { label: 'Sin plazas', tone: 'warn' }
              : undefined
      }
    >
      {event.photoUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-stone-100">
          <Image
            src={event.photoUrl}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        </div>
      )}

      <DetailSection title="Cuándo y dónde">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoTile
            icon={<CalendarBlankIcon size={20} weight="duotone" />}
            label="Fecha"
            value={formatDateTime(event.startsAt, {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
          {event.location && (
            <InfoTile
              icon={<MapPinIcon size={20} weight="duotone" />}
              label="Lugar"
              value={event.location}
            />
          )}
          <InfoTile
            icon={<TicketIcon size={20} weight="duotone" />}
            label="Precio"
            value={formatCents(event.priceCents)}
          />
          {event.maxAttendees && (
            <InfoTile
              icon={<UsersThreeIcon size={20} weight="duotone" />}
              label="Plazas"
              value={`${totalEnrolled} / ${event.maxAttendees}`}
            />
          )}
        </div>
      </DetailSection>

      {event.description && (
        <DetailSection title="Detalles">
          <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-stone-700">
            {event.description}
          </p>
        </DetailSection>
      )}

      <DetailSection
        title={enrolled ? 'Tu inscripción' : 'Apúntate'}
        description={
          enrolled
            ? `Te apuntaste el ${enrollment ? formatDateTime(enrollment.createdAt) : ''}.`
            : 'Reservaremos tu plaza y simulamos el pago en el momento.'
        }
      >
        {enrolled ? (
          <Badge tone="success">
            <CheckCircleIcon size={11} weight="bold" /> Ya estás apuntado
          </Badge>
        ) : event.status !== 'publicado' || seatsLeft === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            {event.status === 'cancelado'
              ? 'Este evento ha sido cancelado.'
              : 'No quedan plazas disponibles.'}
          </p>
        ) : (
          <form action={enrollInEventAction}>
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="priceCents" value={event.priceCents} />
            <SubmitButton size="lg" className="w-full sm:w-auto">
              {event.priceCents > 0
                ? `Apuntarme · ${formatCents(event.priceCents)}`
                : 'Apuntarme gratis'}
            </SubmitButton>
          </form>
        )}
      </DetailSection>

      <DetailSection
        title="Compañía"
        description={`Ya hay ${totalEnrolled} ${totalEnrolled === 1 ? 'alumno apuntado' : 'alumnos apuntados'}.`}
      >
        <p className="text-sm font-medium text-stone-500">
          La lista completa se confirma con el instructor el día del evento.
          {rider?.name && enrolled ? ` Tú formas parte de ella, ${rider.name}.` : ''}
        </p>
      </DetailSection>
    </DetailShell>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {label}
        </div>
        <div className="truncate text-sm font-bold text-stone-900">{value}</div>
      </div>
    </div>
  );
}
