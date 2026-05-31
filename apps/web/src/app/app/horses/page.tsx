import Image from 'next/image';
import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import { HorseIcon, ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import { HORSE_KINDS, HORSE_STATUSES } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, Button, Field, Input, Select, EmptyState, SubmitButton,
} from '@/components/ui';
import { AutoSubmitSelect } from '@/components/ui/AutoSubmitSelect';
import { CreatePanel } from '@/components/ui/CreatePanel';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import {
  createHorseAction,
  updateHorseStatusAction,
} from './actions';

export const metadata = { title: 'Caballos' };
export const dynamic = 'force-dynamic';

const statusTone: Record<string, 'success' | 'neutral' | 'warn'> = {
  activo: 'success',
  baja: 'neutral',
  descanso: 'warn',
};

export default async function HorsesPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const horses = await db
    .select()
    .from(schema.horses)
    .where(eq(schema.horses.clubId, session.primary.clubId))
    .orderBy(schema.horses.name);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Caballos"
        description="Da de alta los caballos del club. Pulsa cualquier caballo para abrir su ficha."
      />

      <CreatePanel label="Nuevo caballo" defaultOpen={horses.length === 0}>
        <form action={createHorseAction} className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-2 md:row-span-2">
            <PhotoUpload folder="horses" label="Foto del caballo" />
          </div>
          <div className="md:col-span-2">
            <Field label="Nombre">
              <Input required name="name" placeholder="Sultán" />
            </Field>
          </div>
          <Field label="Tipo">
            <Select name="kind" defaultValue="caballo">
              {HORSE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Raza">
            <Input name="breed" placeholder="PRE" />
          </Field>
          <Field label="Año">
            <Input
              name="birthYear"
              type="number"
              min={1980}
              max={new Date().getFullYear()}
              placeholder="2018"
            />
          </Field>
          <Field label="Color">
            <Input name="color" placeholder="Castaño" />
          </Field>
          <div className="md:col-span-4">
            <SubmitButton className="w-full md:w-auto">
              Crear y abrir ficha
            </SubmitButton>
          </div>
        </form>
      </CreatePanel>

      {horses.length === 0 ? (
        <EmptyState
          icon={<HorseIcon size={40} weight="duotone" />}
          title="Aún no hay caballos"
          description="Crea el primero con el formulario de arriba. Después podrás asignarles propietarios, mozos y clases."
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              <tr>
                <th className="w-14 px-4 py-3"></th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Raza</th>
                <th className="px-4 py-3 text-left">Año</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {horses.map((h) => (
                <tr key={h.id} className="group hover:bg-brand-50/40">
                  <td className="px-4 py-2">
                    <Link href={`/app/horses/${h.id}` as never} className="block">
                      <Avatar src={h.photoUrl} name={h.name} />
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-bold text-stone-900">
                    <Link
                      href={`/app/horses/${h.id}` as never}
                      className="hover:text-brand-700"
                    >
                      {h.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-stone-700">
                    {h.kind}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{h.breed ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-700">
                    {h.birthYear ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateHorseStatusAction} className="inline-flex">
                      <input type="hidden" name="id" value={h.id} />
                      <AutoSubmitSelect name="status" defaultValue={h.status}>
                        {HORSE_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </AutoSubmitSelect>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/horses/${h.id}` as never}
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

      {horses.length > 0 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {Object.entries(statusTone).map(([s, tone]) => {
            const count = horses.filter((h) => h.status === s).length;
            return (
              <Badge key={s} tone={tone}>
                {count} {s}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-stone-100">
        <Image src={src} alt={name} fill className="object-cover" sizes="40px" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
      <HorseIcon size={18} weight="duotone" />
    </div>
  );
}
