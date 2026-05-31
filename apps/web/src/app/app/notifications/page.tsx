import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { desc, eq } from 'drizzle-orm';
import {
  BellIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, Button, EmptyState, SubmitButton,
} from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { markAllReadAction, markOneReadAction } from './actions';

export const metadata = { title: 'Notificaciones' };
export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const session = await ensureSession();

  const notifications = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.profileId, session.user.id))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(60);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Tu actividad"
        title="Notificaciones"
        description="Avisos de inscripciones, checklists, IA y pagos."
        action={
          <form action={markAllReadAction}>
            <SubmitButton variant="outline" size="sm">
              <CheckCircleIcon size={12} weight="bold" /> Marcar todas leídas
            </SubmitButton>
          </form>
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellIcon size={40} weight="duotone" />}
          title="Sin notificaciones"
          description="Aparecerán aquí cuando alguien complete un checklist, te asignen feedback o tu pago se confirme."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-3 rounded-3xl border bg-white p-4 shadow-card transition ${
                n.readAt
                  ? 'border-stone-200'
                  : 'border-brand-200 bg-brand-50/30'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {!n.readAt && (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-700" />
                  )}
                  <Badge tone="neutral">{n.kind}</Badge>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
                <div className="mt-1 text-sm font-bold text-stone-900">
                  {n.title}
                </div>
                {n.body && (
                  <p className="text-xs font-medium text-stone-600">{n.body}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {n.link && (
                  <Link
                    href={n.link as `/${string}`}
                    className="rounded-lg p-1.5 text-stone-400 transition hover:bg-brand-50 hover:text-brand-700"
                  >
                    <ArrowRightIcon size={16} weight="bold" />
                  </Link>
                )}
                {!n.readAt && (
                  <form action={markOneReadAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      className="rounded-lg p-1.5 text-stone-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                      title="Marcar como leída"
                    >
                      <CheckCircleIcon size={16} weight="bold" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
