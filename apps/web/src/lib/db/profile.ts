import { db, schema } from '@equmanager/database';
import { and, desc, eq } from 'drizzle-orm';

import type { ClubRole } from '@equmanager/domain';
import { getActiveProfile } from '@/lib/active-profile';
import { getLinkedAccounts, type LinkedAccount } from './linked-profiles';

export type CurrentSession = {
  user: { id: string; email: string };
  profile: typeof schema.profiles.$inferSelect | null;
  memberships: Array<{
    id: string;
    clubId: string;
    role: ClubRole;
    joinedAt: Date;
    clubName: string;
    clubSlug: string;
  }>;
  primary: {
    clubId: string;
    role: ClubRole;
    clubName: string;
    clubSlug: string;
  } | null;
  linkedAccounts: LinkedAccount[];
  /**
   * Cuenta actualmente asumida desde el switcher. `self` cuando es el
   * propio usuario logueado. Si es un `LinkedAccount`, las queries deben
   * filtrarse por ese profile o rider.
   */
  activeAccount:
    | { kind: 'self' }
    | { kind: 'linked'; link: LinkedAccount };
};

/**
 * Carga el profile + memberships del usuario actual.
 * Crea el profile si no existe (caso "primer login").
 *
 * Todas las queries independientes se lanzan en paralelo con Promise.all.
 * isSuperadmin se lee en la misma query que el profile base (una sola
 * round-trip) con fallback a false si la columna aún no existe.
 */
export async function loadSession(user: {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown> | null;
}): Promise<CurrentSession> {
  // Una sola query al profile intentando leer isSuperadmin junto al resto.
  // Si la columna no existe (BD pre-0007) cae al catch y reintenta sin ella.
  let profileRow: (typeof schema.profiles.$inferSelect) | null = null;
  try {
    const [row] = await db
      .select({
        id: schema.profiles.id,
        email: schema.profiles.email,
        fullName: schema.profiles.fullName,
        avatarUrl: schema.profiles.avatarUrl,
        isSuperadmin: schema.profiles.isSuperadmin,
        createdAt: schema.profiles.createdAt,
        updatedAt: schema.profiles.updatedAt,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.id, user.id))
      .limit(1);
    profileRow = row ?? null;
  } catch {
    // Columna isSuperadmin ausente (BD pre-0007): releer sin ella
    const [row] = await db
      .select({
        id: schema.profiles.id,
        email: schema.profiles.email,
        fullName: schema.profiles.fullName,
        avatarUrl: schema.profiles.avatarUrl,
        createdAt: schema.profiles.createdAt,
        updatedAt: schema.profiles.updatedAt,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.id, user.id))
      .limit(1);
    profileRow = row ? { ...row, isSuperadmin: false } : null;
  }

  // Primer login: crear profile
  if (!profileRow) {
    const fullName =
      typeof user.user_metadata?.full_name === 'string'
        ? (user.user_metadata.full_name as string)
        : null;
    const [created] = await db
      .insert(schema.profiles)
      .values({ id: user.id, email: user.email, fullName })
      .returning({
        id: schema.profiles.id,
        email: schema.profiles.email,
        fullName: schema.profiles.fullName,
        avatarUrl: schema.profiles.avatarUrl,
        createdAt: schema.profiles.createdAt,
        updatedAt: schema.profiles.updatedAt,
      });
    profileRow = created ? { ...created, isSuperadmin: false } : null;
  }

  // Memberships, linked accounts y cookie de perfil activo en paralelo
  const [memberships, linkedAccounts, activeSelection] = await Promise.all([
    db
      .select({
        id: schema.clubMembers.id,
        clubId: schema.clubMembers.clubId,
        role: schema.clubMembers.role,
        joinedAt: schema.clubMembers.joinedAt,
        clubName: schema.clubs.name,
        clubSlug: schema.clubs.slug,
      })
      .from(schema.clubMembers)
      .innerJoin(schema.clubs, eq(schema.clubs.id, schema.clubMembers.clubId))
      .where(eq(schema.clubMembers.profileId, user.id))
      .orderBy(desc(schema.clubMembers.joinedAt)),
    getLinkedAccounts(user.id),
    getActiveProfile(),
  ]);

  const primary = memberships[0]
    ? {
        clubId: memberships[0].clubId,
        role: memberships[0].role,
        clubName: memberships[0].clubName,
        clubSlug: memberships[0].clubSlug,
      }
    : null;

  const activeAccount = resolveActiveAccount(activeSelection, linkedAccounts);

  return {
    user: { id: user.id, email: user.email },
    profile: profileRow,
    memberships,
    primary,
    linkedAccounts,
    activeAccount,
  };
}

function resolveActiveAccount(
  selection: Awaited<ReturnType<typeof getActiveProfile>>,
  linkedAccounts: LinkedAccount[],
): CurrentSession['activeAccount'] {
  if (selection.kind === 'self') return { kind: 'self' };

  const match = linkedAccounts.find((a) => {
    if (selection.kind === 'profile' && a.target.kind === 'profile') {
      return a.target.profileId === selection.profileId;
    }
    if (selection.kind === 'rider' && a.target.kind === 'rider') {
      return a.target.riderId === selection.riderId;
    }
    return false;
  });

  return match ? { kind: 'linked', link: match } : { kind: 'self' };
}

/**
 * Devuelve el membership de un club para un perfil, o null.
 */
export async function getMembership(profileId: string, clubId: string) {
  const [row] = await db
    .select()
    .from(schema.clubMembers)
    .where(
      and(
        eq(schema.clubMembers.profileId, profileId),
        eq(schema.clubMembers.clubId, clubId),
      ),
    )
    .limit(1);
  return row ?? null;
}
