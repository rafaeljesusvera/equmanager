'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import { COURSE_STATUSES, type CourseStatus } from '@equmanager/domain';

import { ensureSession } from '@/lib/db';
import { parseEurosToCents } from '@/lib/format';

async function assertStaff() {
  const session = await ensureSession();
  if (!['owner', 'admin', 'instructor'].includes(session.primary.role)) {
    redirect('/app');
  }
  return session;
}

export async function createCourseAction(formData: FormData) {
  const session = await assertStaff();
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const discipline = String(formData.get('discipline') ?? 'iniciacion');
  const startDate = formData.get('startDate')
    ? new Date(String(formData.get('startDate')))
    : null;
  const endDate = formData.get('endDate')
    ? new Date(String(formData.get('endDate')))
    : null;
  const priceCents = parseEurosToCents(String(formData.get('price')));
  const maxStudents = Number(formData.get('maxStudents')) || null;
  const photoUrl = String(formData.get('photoUrl') ?? '').trim() || null;

  if (!title) return;

  const [created] = await db
    .insert(schema.courses)
    .values({
      clubId: session.primary.clubId,
      title,
      description,
      discipline,
      startDate,
      endDate,
      priceCents,
      maxStudents,
      photoUrl,
      status: 'publicado',
      createdBy: session.user.id,
    })
    .returning();
  revalidatePath('/app/courses');
  if (created) redirect(`/app/courses/${created.id}`);
}

export async function updateCourseAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const discipline = String(formData.get('discipline') ?? 'iniciacion');
  const startDate = formData.get('startDate')
    ? new Date(String(formData.get('startDate')))
    : null;
  const endDate = formData.get('endDate')
    ? new Date(String(formData.get('endDate')))
    : null;
  const priceCents = parseEurosToCents(String(formData.get('price')));
  const maxStudents = Number(formData.get('maxStudents')) || null;
  const photoUrl = String(formData.get('photoUrl') ?? '').trim() || null;
  const status = (formData.get('status') ?? 'publicado') as CourseStatus;

  if (!title || !COURSE_STATUSES.includes(status)) return;

  await db
    .update(schema.courses)
    .set({
      title,
      description,
      discipline,
      startDate,
      endDate,
      priceCents,
      maxStudents,
      photoUrl,
      status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.courses.id, id),
        eq(schema.courses.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/courses');
  revalidatePath(`/app/courses/${id}`);
}

export async function updateCourseStatusAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  const status = (formData.get('status') ?? 'publicado') as CourseStatus;
  if (!COURSE_STATUSES.includes(status)) return;
  await db
    .update(schema.courses)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(schema.courses.id, id),
        eq(schema.courses.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/courses');
}

export async function deleteCourseAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  await db
    .delete(schema.courses)
    .where(
      and(
        eq(schema.courses.id, id),
        eq(schema.courses.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/courses');
  redirect('/app/courses');
}

export async function addCourseSessionAction(formData: FormData) {
  await assertStaff();
  const courseId = String(formData.get('courseId'));
  const date = new Date(String(formData.get('date')));
  const durationMinutes = Number(formData.get('duration')) || 60;
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (!courseId || Number.isNaN(date.getTime())) return;

  await db.insert(schema.courseSessions).values({
    courseId,
    date,
    durationMinutes,
    notes,
  });
  revalidatePath(`/app/courses/${courseId}`);
}

export async function deleteCourseSessionAction(formData: FormData) {
  await assertStaff();
  const id = String(formData.get('id'));
  const courseId = String(formData.get('courseId'));
  await db.delete(schema.courseSessions).where(eq(schema.courseSessions.id, id));
  revalidatePath(`/app/courses/${courseId}`);
}

/**
 * Genera automáticamente las sesiones del curso entre dos fechas, en los
 * días de la semana indicados y a la hora marcada.
 *
 * formData:
 *  - courseId
 *  - startDate (YYYY-MM-DD)
 *  - endDate (YYYY-MM-DD)
 *  - time (HH:MM)
 *  - duration (minutos)
 *  - weekdays (varias entradas con value 0..6, 0 = domingo)
 *  - mode = 'replace' | 'append'
 */
export async function generateCourseSessionsAction(formData: FormData) {
  const session = await assertStaff();
  const courseId = String(formData.get('courseId'));
  const startStr = String(formData.get('startDate') ?? '');
  const endStr = String(formData.get('endDate') ?? '');
  const time = String(formData.get('time') ?? '10:00');
  const duration = Math.max(15, Number(formData.get('duration')) || 60);
  const mode = String(formData.get('mode') ?? 'append');
  const weekdays = formData
    .getAll('weekdays')
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);

  if (!courseId || !startStr || !endStr || weekdays.length === 0) {
    redirect(
      `/app/courses/${courseId}?error=${encodeURIComponent('Faltan fechas o días de la semana.')}`,
    );
  }

  // Verifica que el curso pertenece al club
  const [course] = await db
    .select()
    .from(schema.courses)
    .where(
      and(
        eq(schema.courses.id, courseId),
        eq(schema.courses.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!course) redirect('/app/courses');

  const start = new Date(`${startStr}T00:00:00`);
  const end = new Date(`${endStr}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    redirect(
      `/app/courses/${courseId}?error=${encodeURIComponent('Rango de fechas inválido.')}`,
    );
  }
  const [h, m] = time.split(':').map((n) => Number(n));
  if (!Number.isInteger(h) || !Number.isInteger(m)) {
    redirect(
      `/app/courses/${courseId}?error=${encodeURIComponent('Hora inválida.')}`,
    );
  }

  // Si modo replace, borra todas las sesiones previas del curso
  if (mode === 'replace') {
    await db
      .delete(schema.courseSessions)
      .where(eq(schema.courseSessions.courseId, courseId));
  }

  const sessionsToInsert: Array<{
    courseId: string;
    date: Date;
    durationMinutes: number;
  }> = [];

  // Itera día a día
  const cursor = new Date(start);
  while (cursor <= end) {
    if (weekdays.includes(cursor.getDay())) {
      const date = new Date(cursor);
      date.setHours(h!, m!, 0, 0);
      sessionsToInsert.push({
        courseId,
        date,
        durationMinutes: duration,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (sessionsToInsert.length > 0) {
    await db.insert(schema.courseSessions).values(sessionsToInsert);
  }

  // Actualiza las fechas del curso si extiende el rango
  await db
    .update(schema.courses)
    .set({
      startDate: course.startDate
        ? new Date(Math.min(new Date(course.startDate).getTime(), start.getTime()))
        : start,
      endDate: course.endDate
        ? new Date(Math.max(new Date(course.endDate).getTime(), end.getTime()))
        : end,
      updatedAt: new Date(),
    })
    .where(eq(schema.courses.id, courseId));

  revalidatePath(`/app/courses/${courseId}`);
  redirect(
    `/app/courses/${courseId}?generated=${sessionsToInsert.length}`,
  );
}
