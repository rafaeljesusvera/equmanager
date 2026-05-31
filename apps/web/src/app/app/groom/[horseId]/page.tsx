import { db, schema } from '@equmanager/database';
import { and, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CheckCircleIcon,
  ArrowLeftIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Button, Textarea, SubmitButton,
} from '@/components/ui';
import { formatDate } from '@/lib/format';
import { submitCareLogAction } from '../actions';

export const dynamic = 'force-dynamic';

type CareItem = { key: string; label: string; kind?: string };
type CareItemDone = { key: string; done: boolean; notes?: string };

export default async function GroomChecklistPage({
  params,
}: {
  params: Promise<{ horseId: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['groom', 'owner', 'admin']);
  const { horseId } = await params;

  const [horseBase] = await db
    .select({
      id: schema.horses.id,
      clubId: schema.horses.clubId,
      name: schema.horses.name,
      kind: schema.horses.kind,
      status: schema.horses.status,
    })
    .from(schema.horses)
    .where(
      and(
        eq(schema.horses.id, horseId),
        eq(schema.horses.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!horseBase) notFound();
  // Si la migración 0007 está aplicada, leemos la plantilla específica.
  let horseCareTemplateId: string | null = null;
  try {
    const [t] = await db
      .select({ careTemplateId: schema.horses.careTemplateId })
      .from(schema.horses)
      .where(eq(schema.horses.id, horseId))
      .limit(1);
    horseCareTemplateId = t?.careTemplateId ?? null;
  } catch {
    // columna care_template_id no existe todavía, ok
  }
  const horse = { ...horseBase, careTemplateId: horseCareTemplateId };

  // Usa la plantilla asignada al caballo si existe; si no, la primera del club.
  let template: typeof schema.horseCareTemplates.$inferSelect | undefined;
  if (horse.careTemplateId) {
    [template] = await db
      .select()
      .from(schema.horseCareTemplates)
      .where(
        and(
          eq(schema.horseCareTemplates.id, horse.careTemplateId),
          eq(schema.horseCareTemplates.clubId, session.primary.clubId),
        ),
      )
      .limit(1);
  }
  if (!template) {
    [template] = await db
      .select()
      .from(schema.horseCareTemplates)
      .where(eq(schema.horseCareTemplates.clubId, session.primary.clubId))
      .orderBy(schema.horseCareTemplates.createdAt)
      .limit(1);
  }

  const items: CareItem[] = Array.isArray(template?.items)
    ? (template!.items as CareItem[])
    : [];

  const history = await db
    .select()
    .from(schema.horseCareLogs)
    .where(eq(schema.horseCareLogs.horseId, horseId))
    .orderBy(desc(schema.horseCareLogs.forDate))
    .limit(5);

  return (
    <div className="p-6 md:p-10">
      <Link
        href="/app/groom"
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
      >
        <ArrowLeftIcon size={12} weight="bold" /> Volver
      </Link>
      <PageHeader
        eyebrow="Checklist diario"
        title={horse.name}
        description="Marca cada tarea cuando la hayas hecho. Las notas se mandan al propietario y al instructor."
      />

      {items.length === 0 ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          La hípica aún no ha definido una plantilla de cuidados. Pídeselo al
          propietario.
        </p>
      ) : (
        <form
          action={submitCareLogAction}
          className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card"
        >
          <input type="hidden" name="horseId" value={horse.id} />
          <input type="hidden" name="templateId" value={template!.id} />

          <div className="space-y-3">
            {items.map((it) => (
              <div
                key={it.key}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-3"
              >
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name={`item-${it.key}`}
                    className="mt-1 h-5 w-5 accent-brand-700"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-stone-900">
                      {it.label}
                    </div>
                    <input
                      name={`note-${it.key}`}
                      placeholder="Nota (opcional)"
                      className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-700 outline-none focus:border-brand-500"
                    />
                  </div>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Textarea
              name="notes"
              rows={3}
              placeholder="Observación general del día (opcional)"
            />
          </div>

          <SubmitButton size="lg" className="mt-4 w-full">
            <CheckCircleIcon size={16} weight="bold" /> Guardar checklist
          </SubmitButton>
        </form>
      )}

      {history.length > 0 && (
        <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 text-base font-bold text-stone-900">Historial</h2>
          <div className="space-y-2">
            {history.map((h) => {
              const items = (h.itemsDone as CareItemDone[]) ?? [];
              const done = items.filter((i) => i.done).length;
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3"
                >
                  <div>
                    <div className="text-sm font-bold text-stone-900">
                      {formatDate(h.forDate)}
                    </div>
                    {h.notes && (
                      <div className="text-xs font-medium text-stone-600">
                        {h.notes}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    {done}/{items.length} hechos
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
