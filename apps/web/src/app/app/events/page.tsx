import Image from 'next/image';
import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { desc, eq, sql } from 'drizzle-orm';
import {
  TrophyIcon,
  ArrowRightIcon,
  MapPinIcon,
} from '@phosphor-icons/react/dist/ssr';
import { EVENT_KINDS } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
  SubmitButton,
} from '@/components/ui';
import { CreatePanel } from '@/components/ui/CreatePanel';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { formatCents, formatDateTime } from '@/lib/format';
import { createEventAction } from './actions';

export const metadata = { title: 'Eventos' };
export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const events = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      kind: schema.events.kind,
      description: schema.events.description,
      location: schema.events.location,
      startsAt: schema.events.startsAt,
      priceCents: schema.events.priceCents,
      maxAttendees: schema.events.maxAttendees,
      photoUrl: schema.events.photoUrl,
      status: schema.events.status,
      enrollments: sql<number>`(
        SELECT count(*)::int FROM enrollments e
        WHERE e.target_type = 'evento' AND e.target_id = ${schema.events.id}
      )`,
    })
    .from(schema.events)
    .where(eq(schema.events.clubId, session.primary.clubId))
    .orderBy(desc(schema.events.startsAt));

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Eventos"
        description="Competiciones, salidas y clinics. Pulsa un evento para editar sus datos o ver inscritos."
      />

      <CreatePanel label="Nuevo evento" defaultOpen={events.length === 0}>
        <form action={createEventAction} className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-2 md:row-span-4">
            <PhotoUpload folder="events" label="Foto" aspect="wide" />
          </div>
          <div className="md:col-span-2">
            <Field label="Título">
              <Input required name="title" placeholder="Concurso Social Otoño" />
            </Field>
          </div>
          <Field label="Tipo">
            <Select name="kind" defaultValue="competicion">
              {EVENT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha">
            <Input required name="startsAt" type="datetime-local" />
          </Field>
          <Field label="Precio (€)">
            <Input name="price" placeholder="0" />
          </Field>
          <div className="md:col-span-3">
            <Field label="Lugar">
              <Input name="location" placeholder="Pista cubierta" />
            </Field>
          </div>
          <Field label="Cupo">
            <Input name="maxAttendees" type="number" min={1} placeholder="40" />
          </Field>
          <div className="md:col-span-4">
            <Field label="Descripción">
              <Textarea
                name="description"
                rows={2}
                placeholder="Categorías, premios, requisitos..."
              />
            </Field>
          </div>
          <div className="md:col-span-4">
            <SubmitButton>Crear y abrir ficha</SubmitButton>
          </div>
        </form>
      </CreatePanel>

      {events.length === 0 ? (
        <EmptyState
          icon={<TrophyIcon size={40} weight="duotone" />}
          title="Sin eventos"
          description="Crea tu primer evento para que tus alumnos lo vean en su panel."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/app/events/${e.id}` as never}
              className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
            >
              {e.photoUrl && (
                <div className="relative aspect-[16/9] w-full bg-stone-100">
                  <Image
                    src={e.photoUrl}
                    alt={e.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      {e.kind.replace('_', ' ')}
                    </p>
                    <h3 className="mt-0.5 text-base font-bold text-stone-900">
                      {e.title}
                    </h3>
                  </div>
                  <Badge
                    tone={
                      e.status === 'publicado'
                        ? 'success'
                        : e.status === 'cancelado'
                          ? 'danger'
                          : 'neutral'
                    }
                  >
                    {e.status}
                  </Badge>
                </div>
                {e.description && (
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-stone-600">
                    {e.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="brand">{formatDateTime(e.startsAt)}</Badge>
                  {e.location && (
                    <Badge tone="neutral">
                      <MapPinIcon size={10} weight="bold" /> {e.location}
                    </Badge>
                  )}
                  <Badge tone="info">{formatCents(e.priceCents)}</Badge>
                  {e.maxAttendees && (
                    <Badge tone="warn">
                      {e.enrollments}/{e.maxAttendees}
                    </Badge>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-end pt-4 text-stone-300 group-hover:text-brand-600">
                  <ArrowRightIcon size={16} weight="bold" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
