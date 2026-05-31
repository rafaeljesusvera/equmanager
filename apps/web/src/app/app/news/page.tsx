import Image from 'next/image';
import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { desc, eq } from 'drizzle-orm';
import {
  NewspaperIcon,
  ArrowRightIcon,
  PushPinIcon,
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
import { formatDate } from '@/lib/format';
import { createNewsAction } from './actions';

export const metadata = { title: 'Noticias' };
export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const list = await db
    .select()
    .from(schema.news)
    .where(eq(schema.news.clubId, session.primary.clubId))
    .orderBy(desc(schema.news.pinned), desc(schema.news.publishedAt));

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Noticias"
        description="Tablón de comunicación. Pulsa una noticia para editarla o despublicarla."
      />

      <CreatePanel label="Publicar noticia" defaultOpen={list.length === 0}>
        <form action={createNewsAction} className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-2 md:row-span-4">
            <PhotoUpload folder="news" label="Foto" aspect="wide" />
          </div>
          <div className="md:col-span-4">
            <Field label="Título">
              <Input
                required
                name="title"
                placeholder="Cambio de horario por puente"
              />
            </Field>
          </div>
          <div className="md:col-span-4">
            <Field label="Cuerpo">
              <Textarea
                required
                name="body"
                rows={4}
                placeholder="Detalles que tus alumnos deben saber..."
              />
            </Field>
          </div>
          <div className="md:col-span-4">
            <label className="flex items-center gap-2 text-xs font-bold text-stone-700">
              <input type="checkbox" name="pinned" className="h-4 w-4 accent-brand-700" />
              Fijar en tablón
            </label>
          </div>
          <div className="md:col-span-4">
            <SubmitButton>Publicar</SubmitButton>
          </div>
        </form>
      </CreatePanel>

      {list.length === 0 ? (
        <EmptyState
          icon={<NewspaperIcon size={40} weight="duotone" />}
          title="Tablón vacío"
          description="Cuando publiques una noticia, todos los miembros la verán en su panel."
        />
      ) : (
        <div className="space-y-3">
          {list.map((n) => (
            <Link
              key={n.id}
              href={`/app/news/${n.id}` as never}
              className="group flex gap-4 overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
            >
              {n.photoUrl && (
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                  <Image
                    src={n.photoUrl}
                    alt={n.title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-brand-700">
                    {n.title}
                  </h3>
                  {n.pinned && (
                    <Badge tone="brand">
                      <PushPinIcon size={10} weight="bold" /> Fijada
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                  {formatDate(n.publishedAt)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-medium leading-relaxed text-stone-600">
                  {n.body}
                </p>
              </div>
              <div className="self-center text-stone-300 group-hover:text-brand-600">
                <ArrowRightIcon size={16} weight="bold" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
