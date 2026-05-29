'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { getCurrentUser } from '@equmanager/auth';
import { CLUB_ROLES, type ClubRole } from '@equmanager/domain';
import { and, eq } from 'drizzle-orm';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

async function ensureProfile(user: { id: string; email: string }) {
  const [existing] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, user.id))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(schema.profiles)
    .values({ id: user.id, email: user.email })
    .returning();
  return created;
}

/**
 * Crea un club nuevo y al usuario como owner.
 * Si el owner ha elegido una entrada del directorio público en el
 * autocomplete, vinculamos el club y pre-rellenamos `settings` con los
 * datos públicos (web, teléfono, dirección).
 */
export async function createClubAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.email) redirect('/login');
  await ensureProfile({ id: user.id, email: user.email });

  const rawName = String(formData.get('name') ?? '').trim();
  const directoryClubId =
    String(formData.get('directoryClubId') ?? '').trim() || null;
  if (rawName.length < 2) {
    redirect('/onboarding?error=' + encodeURIComponent('El nombre es muy corto'));
  }

  // Si el directorio ya está reclamado, anulamos el vínculo (pero el
  // club se sigue creando). El owner podrá vincularlo luego o pedir
  // transferencia desde club-settings.
  let validDirectoryId: string | null = null;
  let directoryPrefill: Record<string, string | null> = {};
  if (directoryClubId) {
    const [dir] = await db
      .select()
      .from(schema.directoryClubs)
      .where(eq(schema.directoryClubs.id, directoryClubId))
      .limit(1);
    if (dir) {
      const [reclaimed] = await db
        .select({ id: schema.clubs.id })
        .from(schema.clubs)
        .where(eq(schema.clubs.directoryClubId, dir.id))
        .limit(1);
      if (!reclaimed) {
        validDirectoryId = dir.id;
        directoryPrefill = {
          phone: dir.phone,
          email: dir.email,
          website: dir.website,
          address: [dir.address, dir.city, dir.postalCode]
            .filter(Boolean)
            .join(', ') || null,
        };
      }
    }
  }

  const baseSlug = slugify(rawName) || `hipica-${Date.now().toString(36)}`;
  let slug = baseSlug;
  let attempt = 0;
  while (attempt < 5) {
    const [taken] = await db
      .select({ id: schema.clubs.id })
      .from(schema.clubs)
      .where(eq(schema.clubs.slug, slug))
      .limit(1);
    if (!taken) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  const [club] = await db
    .insert(schema.clubs)
    .values({
      name: rawName,
      slug,
      directoryClubId: validDirectoryId,
      settings: Object.fromEntries(
        Object.entries(directoryPrefill).filter(([, v]) => v !== null),
      ),
    })
    .returning();

  if (!club) {
    redirect('/onboarding?error=' + encodeURIComponent('No se pudo crear el club'));
  }

  await db.insert(schema.clubMembers).values({
    clubId: club.id,
    profileId: user.id,
    role: 'owner',
  });

  // Crear una plantilla de cuidados por defecto
  await db.insert(schema.horseCareTemplates).values({
    clubId: club.id,
    name: 'Cuidados diarios',
    description: 'Checklist estándar mañana/tarde para cada caballo.',
    items: [
      { key: 'alimentacion', label: 'Alimentación', kind: 'alimentacion' },
      { key: 'agua', label: 'Agua fresca', kind: 'agua' },
      { key: 'cepillado', label: 'Cepillado', kind: 'cepillado' },
      { key: 'cascos', label: 'Revisión de cascos', kind: 'cascos' },
      { key: 'paddock', label: 'Salida a paddock', kind: 'salida_paddock' },
      { key: 'observaciones', label: 'Observaciones generales', kind: 'observacion_general' },
    ],
  });

  await db.insert(schema.notifications).values({
    profileId: user.id,
    clubId: club.id,
    kind: 'sistema',
    title: '¡Bienvenido a Equmanager!',
    body: `Tu hípica "${club.name}" ya está lista. Empieza añadiendo caballos y alumnos.`,
    link: '/app',
  });

  revalidatePath('/app');
  redirect('/app');
}

/**
 * Une al usuario a uno o varios centros eligiendo del directorio público.
 * - Si el `directory_club` tiene club operativo vinculado: crea el
 *   club_member directamente (rider, horse_owner, instructor o groom).
 * - Si no tiene club operativo: registra la solicitud en
 *   `club_join_requests` con status 'pendiente' para avisar al admin y al
 *   propio usuario cuando alguien reclame el padrón.
 */
export async function joinClubsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.email) redirect('/login');
  await ensureProfile({ id: user.id, email: user.email });

  const role = String(formData.get('role') ?? '') as ClubRole;
  const idsRaw = String(formData.get('directoryClubIds') ?? '').trim();
  const ids = idsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!CLUB_ROLES.includes(role) || role === 'owner' || role === 'admin') {
    redirect('/onboarding?error=' + encodeURIComponent('Rol no permitido'));
  }
  if (ids.length === 0) {
    redirect(
      '/onboarding?as=' +
        role +
        '&error=' +
        encodeURIComponent('Selecciona al menos un centro.'),
    );
  }

  let joinedCount = 0;
  let pendingCount = 0;

  for (const directoryId of ids) {
    const [dir] = await db
      .select()
      .from(schema.directoryClubs)
      .where(eq(schema.directoryClubs.id, directoryId))
      .limit(1);
    if (!dir) continue;

    // ¿Hay club operativo vinculado?
    const [club] = await db
      .select()
      .from(schema.clubs)
      .where(eq(schema.clubs.directoryClubId, dir.id))
      .limit(1);

    if (club) {
      const [member] = await db
        .select()
        .from(schema.clubMembers)
        .where(
          and(
            eq(schema.clubMembers.clubId, club.id),
            eq(schema.clubMembers.profileId, user.id),
          ),
        )
        .limit(1);

      if (!member) {
        await db.insert(schema.clubMembers).values({
          clubId: club.id,
          profileId: user.id,
          role,
        });
        joinedCount++;
      }

      // Si es rider, le creamos su entrada en `riders` si no existe
      if (role === 'rider') {
        const [existingRider] = await db
          .select({ id: schema.riders.id })
          .from(schema.riders)
          .where(
            and(
              eq(schema.riders.clubId, club.id),
              eq(schema.riders.profileId, user.id),
            ),
          )
          .limit(1);
        if (!existingRider) {
          await db.insert(schema.riders).values({
            clubId: club.id,
            profileId: user.id,
            name: (user.user_metadata?.full_name as string) || user.email!,
            email: user.email,
            category: 'adulto',
            tier: 'iniciacion',
          });
        }
      }

      await db.insert(schema.notifications).values({
        profileId: user.id,
        clubId: club.id,
        kind: 'sistema',
        title: `Bienvenido a ${club.name}`,
        body: 'Ya formas parte del centro.',
        link: '/app',
      });
    } else {
      await db
        .insert(schema.clubJoinRequests)
        .values({
          profileId: user.id,
          directoryClubId: dir.id,
          requestedRole: role,
          status: 'pendiente',
        });
      pendingCount++;
    }
  }

  revalidatePath('/app');
  if (joinedCount === 0 && pendingCount > 0) {
    redirect(
      '/app?message=' +
        encodeURIComponent(
          'Tu solicitud está guardada. Te avisaremos cuando tu centro active Equmanager.',
        ),
    );
  }
  redirect('/app');
}
