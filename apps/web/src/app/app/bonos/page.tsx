import Image from 'next/image';
import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { desc, eq } from 'drizzle-orm';
import {
  TicketIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Textarea,
  SubmitButton,
} from '@/components/ui';
import { CreatePanel } from '@/components/ui/CreatePanel';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { formatCents } from '@/lib/format';
import { createBonoAction } from './actions';

export const metadata = { title: 'Bonos' };
export const dynamic = 'force-dynamic';

export default async function BonosPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const list = await db
    .select()
    .from(schema.bonos)
    .where(eq(schema.bonos.clubId, session.primary.clubId))
    .orderBy(desc(schema.bonos.active), schema.bonos.priceCents);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Bonos"
        description="Packs de clases prepago. Pulsa un bono para editarlo o ver las compras."
      />

      <CreatePanel label="Nuevo bono" defaultOpen={list.length === 0}>
        <form action={createBonoAction} className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-2 md:row-span-3">
            <PhotoUpload folder="bonos" label="Foto" aspect="wide" />
          </div>
          <div className="md:col-span-2">
            <Field label="Nombre">
              <Input required name="name" placeholder="Bono 10 clases" />
            </Field>
          </div>
          <Field label="Clases">
            <Input
              name="totalClasses"
              type="number"
              defaultValue={10}
              min={1}
              max={200}
            />
          </Field>
          <Field label="Precio (€)">
            <Input name="price" placeholder="250" />
          </Field>
          <Field label="Validez (días)">
            <Input name="validityDays" type="number" defaultValue={180} min={7} />
          </Field>
          <div className="md:col-span-4">
            <Field label="Descripción">
              <Textarea
                name="description"
                rows={2}
                placeholder="Qué incluye: clases en grupo, individuales, etc."
              />
            </Field>
          </div>
          <div className="md:col-span-4">
            <SubmitButton>Crear y abrir ficha</SubmitButton>
          </div>
        </form>
      </CreatePanel>

      {list.length === 0 ? (
        <EmptyState
          icon={<TicketIcon size={40} weight="duotone" />}
          title="Sin bonos"
          description="Define un par de packs (5 clases, 10 clases) para que tus alumnos puedan comprarlos."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((b) => (
            <Link
              key={b.id}
              href={`/app/bonos/${b.id}` as never}
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
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      {b.totalClasses} clases · {b.validityDays} días
                    </p>
                    <h3 className="mt-0.5 text-base font-bold text-stone-900">
                      {b.name}
                    </h3>
                  </div>
                  <Badge tone={b.active ? 'success' : 'neutral'}>
                    {b.active ? 'activo' : 'pausado'}
                  </Badge>
                </div>
                {b.description && (
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-stone-600">
                    {b.description}
                  </p>
                )}
                <div className="mt-3 text-2xl font-bold text-brand-700">
                  {formatCents(b.priceCents)}
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
