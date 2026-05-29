/**
 * Carga las cuentas vinculadas del usuario actual y resuelve cuál está
 * "activa" según la cookie del switcher.
 */
import { db, schema } from '@equmanager/database';
import { and, eq, inArray } from 'drizzle-orm';

import type { ProfileLinkRelation } from '@equmanager/domain';

export type LinkedAccount = {
  linkId: string;
  relation: ProfileLinkRelation;
  label: string | null;
  /**
   * Si el vínculo apunta a un profile real (mayor con cuenta).
   */
  target:
    | {
        kind: 'profile';
        profileId: string;
        email: string;
        fullName: string | null;
        avatarUrl: string | null;
        clubId: string | null;
        clubName: string | null;
        roleLabel: string | null;
      }
    | {
        kind: 'rider';
        riderId: string;
        name: string;
        photoUrl: string | null;
        clubId: string;
        clubName: string;
      };
};

/**
 * Devuelve los perfiles vinculados al usuario (incluyendo el "self" como
 * primera entrada implícita gestionada por el caller).
 */
export async function getLinkedAccounts(
  ownerProfileId: string,
): Promise<LinkedAccount[]> {
  // Defensivo: si la migración 0004 todavía no se ha aplicado en producción,
  // la tabla profile_links no existe y la sesión entera reventaría.
  // Devolvemos array vacío en lugar de propagar el error.
  let links: Array<typeof schema.profileLinks.$inferSelect>;
  try {
    links = await db
      .select()
      .from(schema.profileLinks)
      .where(
        and(
          eq(schema.profileLinks.ownerProfileId, ownerProfileId),
          eq(schema.profileLinks.status, 'activa'),
        ),
      );
  } catch (err) {
    if (
      err instanceof Error &&
      /relation "profile_links"|profile_links/.test(err.message)
    ) {
      return [];
    }
    throw err;
  }

  if (links.length === 0) return [];

  const targetProfileIds = links
    .map((l) => l.targetProfileId)
    .filter((id): id is string => !!id);
  const riderIds = links
    .map((l) => l.riderId)
    .filter((id): id is string => !!id);

  const targetProfiles =
    targetProfileIds.length === 0
      ? []
      : await db
          .select({
            id: schema.profiles.id,
            email: schema.profiles.email,
            fullName: schema.profiles.fullName,
            avatarUrl: schema.profiles.avatarUrl,
          })
          .from(schema.profiles)
          .where(inArray(schema.profiles.id, targetProfileIds));

  const linkedRiders =
    riderIds.length === 0
      ? []
      : await db
          .select({
            id: schema.riders.id,
            name: schema.riders.name,
            photoUrl: schema.riders.photoUrl,
            clubId: schema.riders.clubId,
            clubName: schema.clubs.name,
          })
          .from(schema.riders)
          .innerJoin(schema.clubs, eq(schema.clubs.id, schema.riders.clubId))
          .where(inArray(schema.riders.id, riderIds));

  // Para los profile-target, traemos su primer membership para mostrar club + rol.
  const targetMemberships =
    targetProfileIds.length === 0
      ? []
      : await db
          .select({
            profileId: schema.clubMembers.profileId,
            clubId: schema.clubMembers.clubId,
            role: schema.clubMembers.role,
            clubName: schema.clubs.name,
          })
          .from(schema.clubMembers)
          .innerJoin(
            schema.clubs,
            eq(schema.clubs.id, schema.clubMembers.clubId),
          )
          .where(inArray(schema.clubMembers.profileId, targetProfileIds));

  const profileById = new Map(targetProfiles.map((p) => [p.id, p]));
  const riderById = new Map(linkedRiders.map((r) => [r.id, r]));
  const membershipByProfile = new Map(
    targetMemberships.map((m) => [m.profileId, m]),
  );

  const result: LinkedAccount[] = [];
  for (const link of links) {
    if (link.targetProfileId) {
      const p = profileById.get(link.targetProfileId);
      if (!p) continue;
      const m = membershipByProfile.get(link.targetProfileId);
      result.push({
        linkId: link.id,
        relation: link.relation,
        label: link.label,
        target: {
          kind: 'profile',
          profileId: p.id,
          email: p.email,
          fullName: p.fullName,
          avatarUrl: p.avatarUrl,
          clubId: m?.clubId ?? null,
          clubName: m?.clubName ?? null,
          roleLabel: m?.role ?? null,
        },
      });
    } else if (link.riderId) {
      const r = riderById.get(link.riderId);
      if (!r) continue;
      result.push({
        linkId: link.id,
        relation: link.relation,
        label: link.label,
        target: {
          kind: 'rider',
          riderId: r.id,
          name: r.name,
          photoUrl: r.photoUrl,
          clubId: r.clubId,
          clubName: r.clubName,
        },
      });
    }
  }

  return result;
}
