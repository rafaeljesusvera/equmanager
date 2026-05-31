import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import {
  MicrophoneStageIcon,
  SparkleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Select,
  Textarea,
  SubmitButton,
} from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { createVoiceNoteAction } from './actions';

export const metadata = { title: 'Bandeja IA' };
export const dynamic = 'force-dynamic';

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const { ok, error } = await searchParams;

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  const end = new Date(now);
  end.setDate(end.getDate() + 1);

  const [notes, recentLessons] = await Promise.all([
    db
      .select()
      .from(schema.aiVoiceNotes)
      .where(eq(schema.aiVoiceNotes.clubId, session.primary.clubId))
      .orderBy(desc(schema.aiVoiceNotes.createdAt))
      .limit(15),
    db
      .select({
        id: schema.lessons.id,
        date: schema.lessons.date,
        discipline: schema.lessons.discipline,
      })
      .from(schema.lessons)
      .where(
        and(
          eq(schema.lessons.clubId, session.primary.clubId),
          gte(schema.lessons.date, start),
          lte(schema.lessons.date, end),
        ),
      )
      .orderBy(desc(schema.lessons.date))
      .limit(20),
  ]);

  const aiOn = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Inteligencia"
        title="Bandeja IA"
        description="Sube o pega lo que recuerdes de la clase y deja que la IA reparta el feedback a cada alumno."
        action={
          <Badge tone={aiOn ? 'success' : 'warn'}>
            <SparkleIcon size={11} weight="bold" />
            {aiOn ? 'Claude conectado' : 'Modo heurístico'}
          </Badge>
        }
      />

      {ok && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          <CheckCircleIcon size={16} weight="fill" /> Feedback enviado a los
          alumnos. Listos para revisar en su panel.
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="mb-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="mb-1 text-base font-bold text-stone-900">Nueva nota</h2>
        <p className="mb-5 text-xs font-medium text-stone-500">
          Habla con tu móvil, transcribe (Apple Voice, Google) y pega aquí. La
          IA cruza con tus alumnos del club y prepara los comentarios.
        </p>
        <form action={createVoiceNoteAction} className="space-y-3">
          <Field label="Clase asociada (opcional)">
            <Select name="lessonId" defaultValue="">
              <option value="">Sin clase concreta</option>
              {recentLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {formatDateTime(l.date)} · {l.discipline}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Transcripción">
            <Textarea
              required
              name="transcript"
              rows={6}
              placeholder={`Ej.: "Hoy en la de las 11, Lucía con Sultán muy buen ritmo en el galope, dadle insignia de progreso. Marcos con Trueno cuidar la mano izquierda. Inés excelente posición de pierna, lista para subir nivel."`}
            />
          </Field>
          <SubmitButton size="lg">
            <MicrophoneStageIcon size={16} weight="bold" /> Analizar con IA
          </SubmitButton>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          Tus notas recientes
        </h2>
        {notes.length === 0 ? (
          <EmptyState
            icon={<MicrophoneStageIcon size={40} weight="duotone" />}
            title="Aún no has procesado ninguna nota"
            description="Empieza con cualquier transcripción libre. Después de revisar, tus alumnos verán el feedback al instante."
          />
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <Link
                key={n.id}
                href={`/app/ai/${n.id}`}
                className="group flex items-center justify-between rounded-3xl border border-stone-200 bg-white p-5 shadow-card transition hover:border-brand-300"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        n.status === 'confirmada'
                          ? 'success'
                          : n.status === 'error'
                            ? 'danger'
                            : n.status === 'lista_para_revision'
                              ? 'warn'
                              : 'neutral'
                      }
                    >
                      {n.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm font-medium text-stone-700">
                    {n.summary ?? n.transcript?.slice(0, 140)}
                  </p>
                </div>
                <ArrowRightIcon
                  size={16}
                  className="text-stone-300 group-hover:text-brand-600"
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
