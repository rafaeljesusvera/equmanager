import Image from 'next/image';
import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import {
  GraduationCapIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { RIDER_CATEGORIES, RIDER_TIERS } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Select,
  SubmitButton,
} from '@/components/ui';
import { CreatePanel } from '@/components/ui/CreatePanel';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { createRiderAction } from './actions';

export const metadata = { title: 'Alumnos' };
export const dynamic = 'force-dynamic';

export default async function RidersPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const riders = await db
    .select()
    .from(schema.riders)
    .where(eq(schema.riders.clubId, session.primary.clubId))
    .orderBy(schema.riders.name);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Alumnos"
        description="Tus jinetes y corredores. Pulsa cualquiera para abrir su ficha."
      />

      <CreatePanel label="Nuevo alumno" defaultOpen={riders.length === 0}>
        <form action={createRiderAction} className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-2 md:row-span-3">
            <PhotoUpload folder="riders" label="Foto del alumno" />
          </div>
          <div className="md:col-span-2">
            <Field label="Nombre">
              <Input required name="name" placeholder="Lucía Pérez" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Email">
              <Input name="email" type="email" placeholder="lucia@correo.com" />
            </Field>
          </div>
          <Field label="Teléfono">
            <Input name="phone" placeholder="600 000 000" />
          </Field>
          <Field label="Fecha de nacimiento">
            <Input name="birthdate" type="date" />
          </Field>
          <Field label="Categoría">
            <Select name="category" defaultValue="adulto">
              {RIDER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nivel">
            <Select name="tier" defaultValue="iniciacion">
              {RIDER_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-4">
            <SubmitButton>Crear y abrir ficha</SubmitButton>
          </div>
        </form>
      </CreatePanel>

      {riders.length === 0 ? (
        <EmptyState
          icon={<GraduationCapIcon size={40} weight="duotone" />}
          title="Aún no hay alumnos"
          description="Crea el primero o pídeles que se unan con el código de tu hípica."
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              <tr>
                <th className="w-14 px-4 py-3"></th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Nivel</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {riders.map((r) => (
                <tr key={r.id} className="group hover:bg-brand-50/40">
                  <td className="px-4 py-2">
                    <Link href={`/app/riders/${r.id}` as never}>
                      <Avatar src={r.photoUrl} name={r.name} />
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-bold text-stone-900">
                    <Link
                      href={`/app/riders/${r.id}` as never}
                      className="hover:text-brand-700"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {r.category.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{r.tier}</td>
                  <td className="px-4 py-3 text-stone-500">{r.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.status === 'activo' ? 'success' : 'neutral'}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/riders/${r.id}` as never}
                      className="inline-flex items-center text-stone-400 transition group-hover:text-brand-600"
                    >
                      <ArrowRightIcon size={16} weight="bold" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-stone-100">
        <Image src={src} alt={name} fill className="object-cover" sizes="40px" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
      <GraduationCapIcon size={18} weight="duotone" />
    </div>
  );
}
