'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import {
  HORSE_KINDS,
  HORSE_STATUSES,
  type HorseKind,
  type HorseStatus,
} from '@equmanager/domain';

import { ensureSession } from '@/lib/db';

async function assertStaff() {
  const session = await ensureSession();
  if (!['owner', 'admin', 'instructor'].includes(session.primary.role)) {
    redirect('/app');
  }
  return session;
}

export async function createHorseAction(formData: FormData) {
  const session = await assertStaff();
  const name = String(formData.get('name') ?? '').trim();
  const kind = (formData.get('kind') ?? 'caballo') as HorseKind;
  const breed = String(formData.get('breed') ?? '').trim() || null;
  const birthYear = Number(formData.get('birthYear')) || null;
  const color = String(formData.get('color') ?? '').trim() || null;
  const photoUrl = String(formData.get('photoUrl') ?? '').trim() || null;

  if (!name || !HORSE_KINDS.includes(kind)) return;

  const [created] = await db
    .insert(schema.horses)
    .values({
      clubId: session.primary.clubId,
      name,
      kind,
      breed,
      birthYear,
      color,
      photoUrl,
    })
    .returning();
  revalidatePath('/app/horses');
  if (created) redirect(`/app/horses/${created.id}`);
}

export async function updateHorseAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  const kind = (formData.get('kind') ?? 'caballo') as HorseKind;
  const breed = String(formData.get('breed') ?? '').trim() || null;
  const birthYear = Number(formData.get('birthYear')) || null;
  const color = String(formData.get('color') ?? '').trim() || null;
  const photoUrl = String(formData.get('photoUrl') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;
  const status = (formData.get('status') ?? 'activo') as HorseStatus;
  const careTemplateId =
    String(formData.get('careTemplateId') ?? '').trim() || null;

  if (!name || !HORSE_KINDS.includes(kind) || !HORSE_STATUSES.includes(status))
    return;

  try {
    await db
      .update(schema.horses)
      .set({
        name,
        kind,
        breed,
        birthYear,
        color,
        photoUrl,
        notes,
        status,
        careTemplateId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.horses.id, id),
          eq(schema.horses.clubId, session.primary.clubId),
        ),
      );
  } catch (err) {
    // Si la migración 0007 (care_template_id) todavía no se ha aplicado,
    // reintentamos sin esa columna para no bloquear el flujo.
    if (
      err instanceof Error &&
      /care_template_id|careTemplateId/.test(err.message)
    ) {
      await db
        .update(schema.horses)
        .set({
          name,
          kind,
          breed,
          birthYear,
          color,
          photoUrl,
          notes,
          status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.horses.id, id),
            eq(schema.horses.clubId, session.primary.clubId),
          ),
        );
    } else {
      throw err;
    }
  }
  revalidatePath('/app/horses');
  revalidatePath(`/app/horses/${id}`);
}

export async function updateHorseStatusAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  const status = (formData.get('status') ?? 'activo') as HorseStatus;
  if (!HORSE_STATUSES.includes(status)) return;
  await db
    .update(schema.horses)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(schema.horses.id, id),
        eq(schema.horses.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/horses');
}

export async function deleteHorseAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  await db
    .delete(schema.horses)
    .where(
      and(
        eq(schema.horses.id, id),
        eq(schema.horses.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/horses');
  redirect('/app/horses');
}

export async function addHorseOwnerAction(formData: FormData) {
  const session = await assertStaff();
  const horseId = String(formData.get('horseId'));
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role =
    (formData.get('role') ?? 'owner') === 'authorized'
      ? 'authorized'
      : 'owner';

  if (!horseId || !email) return;

  // Verifica que el caballo pertenece al club
  const [horse] = await db
    .select()
    .from(schema.horses)
    .where(
      and(
        eq(schema.horses.id, horseId),
        eq(schema.horses.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!horse) return;

  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.email, email))
    .limit(1);
  if (!profile) return;

  // Asegurar que es miembro horse_owner del club
  const [existingMember] = await db
    .select()
    .from(schema.clubMembers)
    .where(
      and(
        eq(schema.clubMembers.clubId, session.primary.clubId),
        eq(schema.clubMembers.profileId, profile.id),
      ),
    )
    .limit(1);
  if (!existingMember) {
    await db.insert(schema.clubMembers).values({
      clubId: session.primary.clubId,
      profileId: profile.id,
      role: 'horse_owner',
    });
  }

  await db
    .insert(schema.horseOwners)
    .values({ horseId, profileId: profile.id, role })
    .onConflictDoNothing();

  revalidatePath(`/app/horses/${horseId}`);
}

export async function removeHorseOwnerAction(formData: FormData) {
  await assertStaff();
  const id = String(formData.get('id'));
  const horseId = String(formData.get('horseId'));
  await db
    .delete(schema.horseOwners)
    .where(eq(schema.horseOwners.id, id));
  revalidatePath(`/app/horses/${horseId}`);
}
