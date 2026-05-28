import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { desc, eq } from 'drizzle-orm';
import { MedalIcon, LockKeyIcon } from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { PageHeader } from '@/components/page/PageHeader';
import { EmptyState } from '@/components/ui';
import { BadgeCard } from '@/components/badge/BadgeCard';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Mis insignias' };
export const dynamic = 'force-dynamic';

export default async function MeBadgesPage() {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);

  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  // Todas las insignias del club
  const allBadges = await db
    .select()
    .from(schema.badges)
    .where(eq(schema.badges.clubId, session.primary.clubId))
    .orderBy(schema.badges.name);

  // Las que ha conseguido el alumno
  const awarded = await db
    .select({
      awardId: schema.riderBadges.id,
      badgeId: schema.riderBadges.badgeId,
      awardedAt: schema.riderBadges.awardedAt,
      notes: schema.riderBadges.notes,
    })
    .from(schema.riderBadges)
    .where(eq(schema.riderBadges.riderId, rider!.id))
    .orderBy(desc(schema.riderBadges.awardedAt));

  const awardedMap = new Map(awarded.map((a) => [a.badgeId, a]));

  const unlockedCount = awarded.length;
  const totalCount = allBadges.length;
  const lockedCount = Math.max(0, totalCount - unlockedCount);

  // Ordena: primero las desbloqueadas (más recientes arriba), luego bloqueadas
  const sorted = [...allBadges].sort((a, b) => {
    const aw = awardedMap.has(a.id) ? 1 : 0;
    const bw = awardedMap.has(b.id) ? 1 : 0;
    if (aw !== bw) return bw - aw;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-mesh min-h-full">
      <div className="stagger mx-auto max-w-6xl space-y-6 p-6 md:p-10">
        <PageHeader
          eyebrow="Alumno · Colección"
          title="Tus insignias"
          description="Tu progreso en la hípica. Las que ya tienes lucen a color; las que aún no, en blanco y negro: toca una bloqueada para ver qué hay que hacer."
        />

        <section className="grid grid-cols-3 gap-3">
          <Stat
            label="Conseguidas"
            value={`${unlockedCount}`}
            sublabel="de tu colección"
          />
          <Stat
            label="Por desbloquear"
            value={`${lockedCount}`}
            sublabel="objetivos"
          />
          <Stat
            label="Progreso"
            value={`${totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%`}
            sublabel={`${unlockedCount}/${totalCount}`}
          />
        </section>

        {totalCount === 0 ? (
          <EmptyState
            icon={<MedalIcon size={40} weight="duotone" />}
            title="Tu hípica aún no ha diseñado insignias"
            description="Cuando publiquen alguna, podrás verlas aquí y trabajar para desbloquearlas."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((b) => {
              const got = awardedMap.get(b.id);
              const href = got
                ? `/app/me/badges/${got.awardId}`
                : `/app/me/badges/locked/${b.id}`;
              return (
                <Link
                  key={b.id}
                  href={href as never}
                  className="group block transition hover:-translate-y-1"
                >
                  <BadgeCard
                    clubName={session.primary.clubName}
                    recipientName={got ? rider!.name : null}
                    badge={b}
                    ratio="compact"
                    locked={!got}
                  />
                  <div className="mt-2 rounded-2xl border border-stone-200/70 bg-white p-2 text-center">
                    {got ? (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-700">
                        Conseguida · {formatDate(got.awardedAt)}
                      </p>
                    ) : (
                      <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        <LockKeyIcon size={10} weight="bold" /> Cómo desbloquear
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-4 shadow-card">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50 to-amber-50 opacity-50"
      />
      <div className="relative">
        <div className="label-eyebrow">{label}</div>
        <div className="font-display text-4xl font-normal leading-none tracking-tightest text-stone-900 md:text-5xl">
          {value}
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {sublabel}
        </div>
      </div>
    </div>
  );
}

