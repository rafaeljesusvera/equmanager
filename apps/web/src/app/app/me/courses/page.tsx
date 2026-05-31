import Image from 'next/image';
import { db, schema } from '@equmanager/database';
import { and, asc, eq, gte, or, isNull } from 'drizzle-orm';
import {
  BookOpenTextIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarBlankIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, Button, EmptyState, SubmitButton,
} from '@/components/ui';
import { formatCents, formatDate } from '@/lib/format';
import { enrollInCourseAction } from './actions';

export const metadata = { title: 'Cursos' };
export const dynamic = 'force-dynamic';

export default async function MeCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);

  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  const { error, message } = await searchParams;
  const now = new Date();

  const courses = await db
    .select()
    .from(schema.courses)
    .where(
      and(
        eq(schema.courses.clubId, session.primary.clubId),
        eq(schema.courses.status, 'publicado'),
        or(
          isNull(schema.courses.endDate),
          gte(schema.courses.endDate, now),
        ),
      ),
    )
    .orderBy(asc(schema.courses.startDate));

  const myEnrollments = await db
    .select()
    .from(schema.enrollments)
    .where(
      and(
        eq(schema.enrollments.clubId, session.primary.clubId),
        eq(schema.enrollments.profileId, session.user.id),
        eq(schema.enrollments.targetType, 'curso'),
      ),
    );
  const statusByCourseId = new Map(
    myEnrollments.map((e) => [e.targetId, e.status]),
  );

  const enrolled = courses.filter((c) => statusByCourseId.has(c.id));
  const available = courses.filter((c) => !statusByCourseId.has(c.id));

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Alumno"
        title="Cursos abiertos"
        description="Series de clases organizadas por tu hípica. Apúntate al que te interese y reserva tu plaza."
      />

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      )}

      {enrolled.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="text-base font-bold uppercase tracking-[0.18em] text-stone-500">
            Tus cursos
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {enrolled.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                status={statusByCourseId.get(c.id)!}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-base font-bold uppercase tracking-[0.18em] text-stone-500">
          {enrolled.length > 0 ? 'Otros cursos disponibles' : 'Disponibles'}
        </h2>
        {available.length === 0 ? (
          <EmptyState
            icon={<BookOpenTextIcon size={40} weight="duotone" />}
            title="No hay cursos disponibles"
            description="Cuando tu hípica publique uno, podrás apuntarte desde aquí."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {available.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                status={null}
                riderId={rider?.id ?? null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CourseCard({
  course,
  status,
  riderId,
}: {
  course: typeof schema.courses.$inferSelect;
  status: string | null;
  riderId?: string | null;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
      {course.photoUrl && (
        <div className="relative aspect-[16/9] w-full bg-stone-100">
          <Image
            src={course.photoUrl}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              {course.discipline.replace('_', ' ')}
            </div>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-stone-900">
              {course.title}
            </h3>
          </div>
          {status && (
            <Badge tone={status === 'confirmada' ? 'success' : 'info'}>
              {status === 'confirmada' ? (
                <CheckCircleIcon size={11} weight="fill" />
              ) : (
                <ClockIcon size={11} weight="bold" />
              )}
              {status}
            </Badge>
          )}
        </div>

        {course.description && (
          <p className="mt-2 line-clamp-3 text-sm font-medium text-stone-600">
            {course.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-stone-500">
          {course.startDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarBlankIcon size={12} weight="duotone" />
              {formatDate(course.startDate)}
              {course.endDate ? ` → ${formatDate(course.endDate)}` : ''}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
            {formatCents(course.priceCents)}
          </span>
        </div>

        {!status && (
          <form action={enrollInCourseAction} className="mt-4">
            <input type="hidden" name="courseId" value={course.id} />
            {riderId && (
              <input type="hidden" name="riderId" value={riderId} />
            )}
            <SubmitButton size="sm" className="w-full">
              Apuntarme al curso
            </SubmitButton>
          </form>
        )}
      </div>
    </article>
  );
}
