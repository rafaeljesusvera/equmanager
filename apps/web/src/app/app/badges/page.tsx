import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { eq, sql } from 'drizzle-orm';
import { MedalIcon } from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Button, EmptyState, SubmitButton,
} from '@/components/ui';
import { CreatePanel } from '@/components/ui/CreatePanel';
import { BadgeCard } from '@/components/badge/BadgeCard';
import { BadgeLiveEditor } from '@/components/badge/BadgeLiveEditor';
import { createBadgeAction } from './actions';

export const metadata = { title: 'Insignias' };
export const dynamic = 'force-dynamic';

export default async function BadgesPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const badges = await db
    .select({
      id: schema.badges.id,
      name: schema.badges.name,
      subtitle: schema.badges.subtitle,
      categoryLabel: schema.badges.categoryLabel,
      description: schema.badges.description,
      iconUrl: schema.badges.iconUrl,
      color: schema.badges.color,
      awarded: sql<number>`(
        SELECT count(*)::int FROM rider_badges rb WHERE rb.badge_id = ${schema.badges.id}
      )`,
    })
    .from(schema.badges)
    .where(eq(schema.badges.clubId, session.primary.clubId))
    .orderBy(schema.badges.name);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Insignias"
        description="Diseña insignias estilo carta y entrégaselas a los alumnos que cumplan hitos."
      />

      <CreatePanel label="Diseñar insignia" defaultOpen={badges.length === 0}>
        <form action={createBadgeAction} className="space-y-4">
          <BadgeLiveEditor clubName={session.primary.clubName} />
          <div className="flex justify-end">
            <SubmitButton>Crear insignia</SubmitButton>
          </div>
        </form>
      </CreatePanel>

      {badges.length === 0 ? (
        <EmptyState
          icon={<MedalIcon size={40} weight="duotone" />}
          title="Aún no hay insignias"
          description="Diseña tu primera carta. Tus alumnos podrán coleccionarlas en su perfil."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {badges.map((b) => (
            <Link
              key={b.id}
              href={`/app/badges/${b.id}` as never}
              className="group block transition hover:-translate-y-1"
            >
              <BadgeCard
                clubName={session.primary.clubName}
                badge={b}
                recipientName={`${b.awarded} entregadas`}
                recipientLabel="Premiados"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
