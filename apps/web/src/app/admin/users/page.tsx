import { db, schema } from '@equmanager/database';
import { eq, inArray, sql } from 'drizzle-orm';
import { getCurrentUser } from '@equmanager/auth';
import { PageHeader } from '@/components/page/PageHeader';
import { UsersExplorer, type UserRow } from './UsersExplorer';
import { Paginator } from '@/components/admin/Paginator';

export const metadata = { title: 'Superadmin · Usuarios' };
export const dynamic = 'force-dynamic';

const PER_ALLOWED = [20, 50, 100] as const;
type Per = (typeof PER_ALLOWED)[number];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const per: Per = (PER_ALLOWED.includes(Number(sp.per) as Per) ? Number(sp.per) : 20) as Per;
  const offset = (page - 1) * per;

  const [me, total, profiles, allClubNames] = await Promise.all([
    getCurrentUser(),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.profiles)
      .then((r) => r[0]?.n ?? 0),
    db
      .select({
        id: schema.profiles.id,
        email: schema.profiles.email,
        fullName: schema.profiles.fullName,
        avatarUrl: schema.profiles.avatarUrl,
        createdAt: schema.profiles.createdAt,
        isSuperadmin: schema.profiles.isSuperadmin,
      })
      .from(schema.profiles)
      .orderBy(schema.profiles.email)
      .limit(per)
      .offset(offset)
      .catch(() =>
        db
          .select({
            id: schema.profiles.id,
            email: schema.profiles.email,
            fullName: schema.profiles.fullName,
            avatarUrl: schema.profiles.avatarUrl,
            createdAt: schema.profiles.createdAt,
          })
          .from(schema.profiles)
          .orderBy(schema.profiles.email)
          .limit(per)
          .offset(offset)
          .then((rows) => rows.map((r) => ({ ...r, isSuperadmin: null }))),
      ),
    db
      .selectDistinct({ name: schema.clubs.name })
      .from(schema.clubs)
      .orderBy(schema.clubs.name)
      .then((r) => r.map((c) => c.name)),
  ]);

  const profileIds = profiles.map((p) => p.id);
  const memberships = profileIds.length
    ? await db
        .select({
          profileId: schema.clubMembers.profileId,
          role: schema.clubMembers.role,
          clubName: schema.clubs.name,
        })
        .from(schema.clubMembers)
        .innerJoin(schema.clubs, eq(schema.clubs.id, schema.clubMembers.clubId))
        .where(inArray(schema.clubMembers.profileId, profileIds))
    : [];

  const byProfile = new Map<string, UserRow['memberships']>();
  for (const m of memberships) {
    if (!byProfile.has(m.profileId)) byProfile.set(m.profileId, []);
    byProfile.get(m.profileId)!.push({ role: m.role, clubName: m.clubName });
  }

  const rows: UserRow[] = profiles.map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.fullName,
    avatarUrl: p.avatarUrl,
    createdAt: p.createdAt.toISOString(),
    isSuperadmin: p.isSuperadmin ?? false,
    memberships: byProfile.get(p.id) ?? [],
  }));

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Usuarios del sistema"
        description="Cada persona registrada y sus perfiles activos en cada club. Un mismo usuario puede ser propietario en un club y alumno en otro."
      />

      <UsersExplorer
        users={rows}
        clubs={allClubNames}
        currentUserId={me?.id ?? ''}
      />

      <div className="mt-4 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
        <Paginator total={total} page={page} per={per} basePath="/admin/users" />
      </div>
    </div>
  );
}
