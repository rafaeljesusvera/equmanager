import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import { Button, Field, Input, Textarea } from '@/components/ui';
import { AutoSaveForm } from '@/components/ui/AutoSaveForm';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDelete';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { formatDate } from '@/lib/format';
import { deleteNewsAction, updateNewsAction } from '../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [n] = await db
    .select({ title: schema.news.title })
    .from(schema.news)
    .where(eq(schema.news.id, id))
    .limit(1);
  return { title: n?.title ?? 'Noticia' };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);
  const { id } = await params;

  const [news] = await db
    .select()
    .from(schema.news)
    .where(
      and(
        eq(schema.news.id, id),
        eq(schema.news.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!news) notFound();

  return (
    <DetailShell
      backHref="/app/news"
      backLabel="Noticias"
      eyebrow={`Publicada ${formatDate(news.publishedAt)}`}
      title={news.title}
      status={
        news.pinned ? { label: 'Fijada', tone: 'brand' } : undefined
      }
    >
      <DetailSection title="Contenido" description="Se guarda al salir de cada campo.">
        <AutoSaveForm
          action={updateNewsAction}
          className="grid grid-cols-1 gap-4 md:grid-cols-6"
        >
          <input type="hidden" name="id" value={news.id} />
          <div className="md:col-span-2 md:row-span-4">
            <PhotoUpload
              folder="news"
              defaultValue={news.photoUrl}
              label="Foto"
              aspect="wide"
            />
          </div>
          <div className="md:col-span-4">
            <Field label="Título">
              <Input required name="title" defaultValue={news.title} />
            </Field>
          </div>
          <div className="md:col-span-4">
            <Field label="Cuerpo">
              <Textarea required name="body" rows={6} defaultValue={news.body} />
            </Field>
          </div>
          <div className="md:col-span-4">
            <label className="flex items-center gap-2 text-xs font-bold text-stone-700">
              <input
                type="checkbox"
                name="pinned"
                defaultChecked={news.pinned}
                className="h-4 w-4 accent-brand-700"
              />
              Fijar en tablón
            </label>
          </div>
        </AutoSaveForm>
      </DetailSection>

      <DetailSection
        title="Zona peligrosa"
        description="Eliminar una noticia es definitivo."
      >
        <ConfirmDeleteButton
          variant="button"
          action={deleteNewsAction}
          hidden={{ id: news.id }}
          triggerLabel="Eliminar noticia"
          title={`Eliminar "${news.title}"`}
          description="Esta acción no se puede deshacer."
        />
      </DetailSection>
    </DetailShell>
  );
}
