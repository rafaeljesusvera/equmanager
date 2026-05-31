import Image from 'next/image';
import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { eq, sql } from 'drizzle-orm';
import {
  BookOpenTextIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { DISCIPLINES } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
  SubmitButton,
} from '@/components/ui';
import { CreatePanel } from '@/components/ui/CreatePanel';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { formatCents, formatDate } from '@/lib/format';
import { createCourseAction } from './actions';

export const metadata = { title: 'Cursos' };
export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const courses = await db
    .select({
      id: schema.courses.id,
      title: schema.courses.title,
      description: schema.courses.description,
      discipline: schema.courses.discipline,
      startDate: schema.courses.startDate,
      endDate: schema.courses.endDate,
      priceCents: schema.courses.priceCents,
      maxStudents: schema.courses.maxStudents,
      photoUrl: schema.courses.photoUrl,
      status: schema.courses.status,
      enrollments: sql<number>`(
        SELECT count(*)::int FROM enrollments e
        WHERE e.target_type = 'curso' AND e.target_id = ${schema.courses.id}
      )`,
    })
    .from(schema.courses)
    .where(eq(schema.courses.clubId, session.primary.clubId))
    .orderBy(schema.courses.startDate);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Cursos"
        description="Programas de varias sesiones. Pulsa un curso para editar sus datos y gestionar sesiones."
      />

      <CreatePanel label="Nuevo curso" defaultOpen={courses.length === 0}>
        <form action={createCourseAction} className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-2 md:row-span-4">
            <PhotoUpload folder="courses" label="Foto" aspect="wide" />
          </div>
          <div className="md:col-span-2">
            <Field label="Título">
              <Input required name="title" placeholder="Iniciación a salto" />
            </Field>
          </div>
          <Field label="Disciplina">
            <Select name="discipline" defaultValue="iniciacion">
              {DISCIPLINES.map((d) => (
                <option key={d} value={d}>
                  {d.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Precio (€)">
            <Input name="price" type="text" placeholder="120" />
          </Field>
          <Field label="Cupo">
            <Input name="maxStudents" type="number" min={1} max={200} placeholder="12" />
          </Field>
          <Field label="Inicio">
            <Input name="startDate" type="date" />
          </Field>
          <Field label="Fin">
            <Input name="endDate" type="date" />
          </Field>
          <div className="md:col-span-4">
            <Field label="Descripción">
              <Textarea
                name="description"
                rows={2}
                placeholder="Resumen de objetivos, lo que se incluye, requisitos..."
              />
            </Field>
          </div>
          <div className="md:col-span-4">
            <SubmitButton>Crear y abrir ficha</SubmitButton>
          </div>
        </form>
      </CreatePanel>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpenTextIcon size={40} weight="duotone" />}
          title="Sin cursos publicados"
          description="Crea tu primer curso. Tus alumnos lo verán y podrán apuntarse desde su panel."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/app/courses/${c.id}` as never}
              className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
            >
              {c.photoUrl && (
                <div className="relative aspect-[16/9] w-full bg-stone-100">
                  <Image
                    src={c.photoUrl}
                    alt={c.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      {c.discipline}
                    </p>
                    <h3 className="mt-0.5 text-base font-bold text-stone-900">
                      {c.title}
                    </h3>
                  </div>
                  <Badge
                    tone={
                      c.status === 'publicado'
                        ? 'success'
                        : c.status === 'cerrado'
                          ? 'warn'
                          : 'neutral'
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-stone-600">
                    {c.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="brand">{formatCents(c.priceCents)}</Badge>
                  {c.maxStudents && (
                    <Badge tone="info">
                      {c.enrollments}/{c.maxStudents}
                    </Badge>
                  )}
                  {c.startDate && (
                    <Badge tone="neutral">{formatDate(c.startDate)}</Badge>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-end pt-4 text-stone-300 group-hover:text-brand-600">
                  <ArrowRightIcon size={16} weight="bold" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
