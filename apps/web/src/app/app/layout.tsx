import { ensureSession, roleLabel } from '@/lib/db';
import { Sidebar } from '@/components/shell/Sidebar';
import { Topbar } from '@/components/shell/Topbar';
import { ImpersonationBanner } from '@/components/shell/ImpersonationBanner';
import { buildNav } from '@/lib/nav';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await ensureSession();
  const roles = Array.from(new Set(session.memberships.map((m) => m.role)));
  const sections = buildNav(roles);

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar session={session} />
      <main className="flex-1 overflow-x-hidden">
        <ImpersonationBanner currentEmail={session.user.email} />
        <Topbar
          profileId={session.user.id}
          sections={sections}
          clubName={session.primary.clubName}
          roleLabel={roleLabel(session.primary.role)}
          email={session.user.email}
        />
        {children}
      </main>
    </div>
  );
}
