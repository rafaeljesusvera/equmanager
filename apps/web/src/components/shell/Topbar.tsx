import Link from 'next/link';
import { BellIcon } from '@phosphor-icons/react/dist/ssr';
import { db, schema } from '@equmanager/database';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { AccountSwitcher, type SwitcherAccount } from './AccountSwitcher';
import { MobileTopTitle } from './MobileTopTitle';
import { relationLabelFor } from '@/lib/relation-labels';
import type { NavSection } from '@/lib/nav';
import type { CurrentSession } from '@/lib/db/profile';
import { roleLabel as roleLabelFor } from '@/lib/db/session';

export async function Topbar({
  profileId,
  sections,
  clubName,
  roleLabel,
  email,
  session,
}: {
  profileId: string;
  sections: NavSection[];
  clubName: string;
  roleLabel: string;
  email: string;
  session: CurrentSession;
}) {
  const [unread] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.profileId, profileId),
        isNull(schema.notifications.readAt),
      ),
    );

  const count = unread?.n ?? 0;
  const { accounts, active } = buildSwitcherAccounts(session, {
    fallbackName:
      session.profile?.fullName ?? email.split('@')[0] ?? email,
    fallbackEmail: email,
    fallbackContext: `${clubName} · ${roleLabel}`,
  });

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-stone-200 bg-white/85 px-4 py-3 backdrop-blur md:justify-end md:px-6">
      {/* Móvil: flecha + título de la página actual */}
      <MobileTopTitle />

      <div className="flex shrink-0 items-center gap-2">
        <AccountSwitcher active={active} accounts={accounts} />
        <Link
          href="/app/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:border-brand-300 hover:text-brand-700"
          aria-label="Notificaciones"
        >
          <BellIcon size={18} weight="duotone" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

function buildSwitcherAccounts(
  session: CurrentSession,
  fallback: {
    fallbackName: string;
    fallbackEmail: string;
    fallbackContext: string;
  },
): { accounts: SwitcherAccount[]; active: SwitcherAccount } {
  const self: SwitcherAccount = {
    kind: 'self',
    linkId: null,
    name: fallback.fallbackName,
    email: fallback.fallbackEmail,
    avatarUrl: session.profile?.avatarUrl ?? null,
    contextLine: fallback.fallbackContext,
    relationLabel: relationLabelFor('self'),
  };

  const linked: SwitcherAccount[] = session.linkedAccounts.map((a) => {
    if (a.target.kind === 'profile') {
      const ctx = [
        a.target.clubName,
        a.target.roleLabel ? roleLabelFor(a.target.roleLabel as never) : null,
      ]
        .filter(Boolean)
        .join(' · ');
      return {
        kind: 'linked-profile',
        linkId: a.linkId,
        name: a.target.fullName ?? a.target.email,
        email: a.target.email,
        avatarUrl: a.target.avatarUrl,
        contextLine: ctx || a.target.email,
        relationLabel: relationLabelFor(a.relation),
      };
    }
    return {
      kind: 'linked-rider',
      linkId: a.linkId,
      name: a.target.name,
      photoUrl: a.target.photoUrl,
      contextLine: `${a.target.clubName} · Alumno`,
      relationLabel: relationLabelFor(a.relation),
    };
  });

  const accounts = [self, ...linked];
  const active =
    session.activeAccount.kind === 'linked'
      ? (accounts.find(
          (a) =>
            session.activeAccount.kind === 'linked' &&
            a.linkId === session.activeAccount.link.linkId,
        ) ?? self)
      : self;
  return { accounts, active };
}
