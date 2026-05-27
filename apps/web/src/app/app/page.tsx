import { db, schema } from '@equmanager/database';
import { getCurrentUser } from '@equmanager/auth';
import { eq, sql } from 'drizzle-orm';
import type { Route } from 'next';
import Link from 'next/link';

export const metadata = { title: 'Inicio' };
export const dynamic = 'force-dynamic';

async function getStats(userId: string) {
  // Clubes a los que pertenece el usuario
  const memberships = await db
    .select({
      clubId: schema.clubMembers.clubId,
      role: schema.clubMembers.role,
      clubName: schema.clubs.name,
      clubSlug: schema.clubs.slug,
    })
    .from(schema.clubMembers)
    .innerJoin(schema.clubs, eq(schema.clubs.id, schema.clubMembers.clubId))
    .where(eq(schema.clubMembers.profileId, userId));

  if (memberships.length === 0) {
    return { memberships: [], counts: null };
  }

  const primary = memberships[0];
  if (!primary) return { memberships, counts: null };

  const [horseCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.horses)
    .where(eq(schema.horses.clubId, primary.clubId));

  const [riderCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.riders)
    .where(eq(schema.riders.clubId, primary.clubId));

  const [lessonCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.lessons)
    .where(eq(schema.lessons.clubId, primary.clubId));

  return {
    memberships,
    counts: {
      horses: horseCount?.n ?? 0,
      riders: riderCount?.n ?? 0,
      lessons: lessonCount?.n ?? 0,
    },
    primary,
  };
}

export default async function AppHome() {
  const user = await getCurrentUser();
  const stats = await getStats(user!.id);

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
          Panel
        </p>
        <h1 className="text-3xl font-black text-stone-900">
          Hola, {user!.email}
        </h1>
      </header>

      {stats.memberships.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Kpi label="Caballos" value={stats.counts!.horses} href="/app/horses" />
            <Kpi label="Jinetes" value={stats.counts!.riders} href="/app/riders" />
          </section>

          <section>
            <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-stone-500">
              Tus clubes
            </h2>
            <div className="space-y-2">
              {stats.memberships.map((m) => (
                <div
                  key={m.clubId}
                  className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4"
                >
                  <div>
                    <div className="font-black text-stone-900">{m.clubName}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      {m.clubSlug} · {m.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: Route;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-brand-400"
    >
      <div className="text-[10px] font-black uppercase tracking-widest text-stone-500">
        {label}
      </div>
      <div className="mt-1 text-4xl font-black text-stone-900">{value}</div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white p-10 text-center">
      <div className="mb-3 text-5xl">🏇</div>
      <h2 className="text-xl font-black text-stone-900">
        Aún no perteneces a ningún club
      </h2>
      <p className="mt-2 text-sm font-bold text-stone-500">
        Crea uno nuevo o pide a un administrador que te invite.
      </p>
    </div>
  );
}
