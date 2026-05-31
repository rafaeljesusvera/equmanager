import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  TrashIcon,
  MedalIcon,
  SparkleIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, Button, Textarea, SubmitButton,
} from '@/components/ui';
import {
  confirmVoiceNoteAction,
  discardVoiceNoteAction,
} from '../actions';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Item = {
  riderId: string | null;
  riderName: string;
  horseId: string | null;
  horseName: string | null;
  feedback: string;
  suggestedBadge?: string | null;
  confidence?: number;
};

export default async function AiReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);
  const { id } = await params;

  const [note] = await db
    .select()
    .from(schema.aiVoiceNotes)
    .where(
      and(
        eq(schema.aiVoiceNotes.id, id),
        eq(schema.aiVoiceNotes.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!note) notFound();

  const structured = (note.structuredOutput ?? {}) as {
    summary?: string;
    items?: Item[];
    unmatched?: string[];
    source?: string;
  };

  const items = structured.items ?? [];
  const unmatched = structured.unmatched ?? [];

  return (
    <div className="p-6 md:p-10">
      <Link
        href="/app/ai"
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
      >
        <ArrowLeftIcon size={12} weight="bold" /> Volver
      </Link>
      <PageHeader
        eyebrow={`IA · ${structured.source ?? 'fallback'}`}
        title={note.summary ?? 'Revisar nota'}
        description={`Procesada el ${formatDateTime(note.createdAt)}. Marca qué comentarios mandar y ajústalos antes de confirmar.`}
        action={
          <Badge
            tone={
              note.status === 'confirmada'
                ? 'success'
                : note.status === 'error'
                  ? 'danger'
                  : 'warn'
            }
          >
            {note.status.replace('_', ' ')}
          </Badge>
        }
      />

      <section className="mb-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          Transcripción original
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-relaxed text-stone-700">
          {note.transcript}
        </p>
      </section>

      {note.status === 'error' && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          La IA no consiguió procesar la nota: {note.errorMessage}
        </p>
      )}

      {items.length > 0 && note.status !== 'confirmada' && (
        <form action={confirmVoiceNoteAction}>
          <input type="hidden" name="noteId" value={note.id} />
          <div className="space-y-3">
            {items.map((it, idx) => (
              <article
                key={idx}
                className="rounded-3xl border border-stone-200 bg-white p-5 shadow-card"
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={`include-${idx}`}
                    defaultChecked={Boolean(it.riderId)}
                    className="h-4 w-4 accent-brand-700"
                  />
                  <span className="text-sm font-bold text-stone-900">
                    {it.riderName}
                  </span>
                  {it.horseName && (
                    <Badge tone="neutral">{it.horseName}</Badge>
                  )}
                  {!it.riderId && <Badge tone="warn">sin match seguro</Badge>}
                  {it.confidence !== undefined && (
                    <Badge tone="info">
                      <SparkleIcon size={10} weight="bold" />{' '}
                      {Math.round(it.confidence * 100)}%
                    </Badge>
                  )}
                </label>
                <div className="mt-3">
                  <Textarea
                    name={`feedback-${idx}`}
                    defaultValue={it.feedback}
                    rows={2}
                  />
                </div>
                {it.suggestedBadge && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent-700">
                    <MedalIcon size={10} weight="fill" /> Insignia sugerida:{' '}
                    {it.suggestedBadge}
                  </div>
                )}
              </article>
            ))}
          </div>

          {unmatched.length > 0 && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
              <strong>Fragmentos sin asignar:</strong>
              <ul className="mt-1 list-disc pl-5">
                {unmatched.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <SubmitButton size="lg">
              <CheckCircleIcon size={16} weight="bold" /> Confirmar y enviar
            </SubmitButton>
          </div>
        </form>
      )}

      {items.length === 0 && note.status !== 'error' && (
        <p className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs font-medium text-stone-600">
          La IA no detectó ningún match con tus alumnos. Revisa la
          transcripción y prueba de nuevo nombrándolos.
        </p>
      )}

      {note.status === 'confirmada' && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          Esta nota ya fue confirmada y enviada a los alumnos.
        </p>
      )}

      <form action={discardVoiceNoteAction} className="mt-6 inline-block">
        <input type="hidden" name="noteId" value={note.id} />
        <SubmitButton variant="ghost" size="sm">
          <TrashIcon size={14} weight="bold" /> Descartar nota
        </SubmitButton>
      </form>
    </div>
  );
}
