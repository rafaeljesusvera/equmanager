import { ensureSession, roleLabel } from '@/lib/db';
import { Sidebar } from '@/components/shell/Sidebar';
import { Topbar } from '@/components/shell/Topbar';
import { ImpersonationBanner } from '@/components/shell/ImpersonationBanner';
import { BottomNav } from '@/components/shell/BottomNav';
import { buildNav } from '@/lib/nav';
import { db, schema } from '@equmanager/database';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import type { ClubRole } from '@equmanager/domain';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await ensureSession();
  const roles = Array.from(new Set(session.memberships.map((m) => m.role))) as ClubRole[];
  const sections = buildNav(roles);

  const unreadThreads = await db
    .select({ id: schema.threadParticipants.id })
    .from(schema.threadParticipants)
    .innerJoin(
      schema.messageThreads,
      eq(schema.messageThreads.id, schema.threadParticipants.threadId),
    )
    .where(
      and(
        eq(schema.threadParticipants.profileId, session.user.id),
        or(
          isNull(schema.threadParticipants.lastReadAt),
          gt(schema.messageThreads.lastMessageAt, schema.threadParticipants.lastReadAt),
        ),
      ),
    )
    .limit(1)
    .catch(() => []);

  const hasUnreadMessages = unreadThreads.length > 0;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar session={session} />
      <main className="flex min-h-0 flex-1 flex-col min-w-0">
        <ImpersonationBanner currentEmail={session.user.email} />
        <Topbar
          profileId={session.user.id}
          sections={sections}
          clubName={session.primary.clubName}
          roleLabel={roleLabel(session.primary.role)}
          email={session.user.email}
          session={session}
        />
        {/* Padding inferior para que el contenido no quede bajo el menú móvil */}
        <div className="flex-1 pb-20 md:pb-0">
          {children}
        </div>
      </main>
      <BottomNav
        roles={roles}
        sections={sections}
        clubName={session.primary.clubName}
        roleLabel={roleLabel(session.primary.role)}
        email={session.user.email}
        fullName={session.profile?.fullName}
        avatarUrl={session.profile?.avatarUrl}
        isSuperadmin={session.profile?.isSuperadmin === true}
        hasUnreadMessages={hasUnreadMessages}
      />
    </div>
  );
}
