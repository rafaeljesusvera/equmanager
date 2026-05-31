import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import {
  ClipboardTextIcon,
  TrashIcon,
} from '@phosphor-icons/react/dist/ssr';
import { CARE_ITEM_KINDS } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import {
  Badge,
  Button,
  CreatePanel,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
  SubmitButton,
} from '@/components/ui';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDelete';
import {
  createTemplateAction,
  addTemplateItemAction,
  removeTemplateItemAction,
  deleteTemplateAction,
} from './actions';

export const metadata = { title: 'Plantillas de cuidado' };
export const dynamic = 'force-dynamic';

type CareItem = { key: string; label: string; kind: string };

export default async function CareTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin']);
  const { error, message } = await searchParams;

  const templates = await db
    .select()
    .from(schema.horseCareTemplates)
    .where(eq(schema.horseCareTemplates.clubId, session.primary.clubId))
    .orderBy(schema.horseCareTemplates.name);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Propietario"
        title="Plantillas de cuidado"
        description="Define qué tareas verá tu mozo cada día. Después podrás asignar plantillas distintas a cada caballo (uno necesita medicación, otro no)."
      />

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      )}

      <CreatePanel
        label="Nueva plantilla"
        defaultOpen={templates.length === 0}
      >
        <form
          action={createTemplateAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-6"
        >
          <div className="md:col-span-3">
            <Field label="Nombre">
              <Input
                required
                name="name"
                placeholder="Cuidados diarios"
                minLength={2}
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Descripción (opcional)">
              <Input
                name="description"
                placeholder="Mañana y tarde, caballos en activo"
              />
            </Field>
          </div>
          <div className="md:col-span-6">
            <SubmitButton>Crear plantilla</SubmitButton>
          </div>
        </form>
      </CreatePanel>

      {templates.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon size={40} weight="duotone" />}
          title="Aún no hay plantillas"
          description="Crea la primera. Tendrá ya los cuidados básicos al crear tu hípica."
        />
      ) : (
        <div className="mt-6 space-y-4">
          {templates.map((t) => {
            const items = Array.isArray(t.items)
              ? (t.items as CareItem[])
              : [];
            return (
              <article
                key={t.id}
                className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card"
              >
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 p-5">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-stone-900">
                      {t.name}
                    </h3>
                    {t.description && (
                      <p className="mt-0.5 text-sm font-medium text-stone-600">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <ConfirmDeleteButton
                    variant="button"
                    action={deleteTemplateAction}
                    hidden={{ id: t.id }}
                    triggerLabel="Eliminar plantilla"
                    title={`Eliminar "${t.name}"`}
                    description="Los caballos con esta plantilla quedarán sin plantilla asignada."
                  />
                </header>

                <ul className="divide-y divide-stone-100">
                  {items.length === 0 ? (
                    <li className="p-5 text-sm font-medium text-stone-500">
                      Sin tareas. Añade la primera con el formulario inferior.
                    </li>
                  ) : (
                    items.map((it) => (
                      <li
                        key={it.key}
                        className="flex items-center justify-between gap-3 px-5 py-3"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-stone-900">
                            {it.label}
                          </div>
                          <Badge tone="neutral">
                            {it.kind.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <form action={removeTemplateItemAction}>
                          <input type="hidden" name="templateId" value={t.id} />
                          <input type="hidden" name="itemKey" value={it.key} />
                          <button
                            type="submit"
                            className="rounded-xl border border-stone-200 px-2.5 py-1.5 text-stone-500 transition hover:border-red-300 hover:text-red-700"
                            aria-label={`Quitar ${it.label}`}
                          >
                            <TrashIcon size={14} weight="bold" />
                          </button>
                        </form>
                      </li>
                    ))
                  )}
                </ul>

                <form
                  action={addTemplateItemAction}
                  className="grid grid-cols-1 gap-3 border-t border-stone-100 bg-stone-50/50 p-5 md:grid-cols-6"
                >
                  <input type="hidden" name="templateId" value={t.id} />
                  <div className="md:col-span-3">
                    <Field label="Etiqueta visible para el mozo">
                      <Input
                        required
                        name="label"
                        placeholder="Cepillado intensivo"
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Tipo">
                      <Select name="kind" defaultValue="otros">
                        {CARE_ITEM_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {k.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="flex items-end">
                    <SubmitButton className="w-full">
                      Añadir
                    </SubmitButton>
                  </div>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
