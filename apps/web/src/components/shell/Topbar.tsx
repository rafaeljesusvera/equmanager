import Link from 'next/link';
import { BellIcon } from '@phosphor-icons/react/dist/ssr';
import { db, schema } from '@equmanager/database';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { MobileHeader } from './MobileHeader';
import type { NavSection } from '@/lib/nav';

export async function Topbar({
  profileId,
  sections,
  clubName,
  roleLabel,
  email,
}: {
  profileId: string;
  sections: NavSection[];
  clubName: string;
  roleLabel: string;
  email: string;
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

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-stone-200 bg-white/85 px-4 py-3 backdrop-blur md:justify-end md:px-6">
      <MobileHeader
        sections={sections}
        clubName={clubName}
        roleLabel={roleLabel}
        email={email}
      />

      <div className="flex items-center gap-2">
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
