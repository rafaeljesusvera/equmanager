import { db, schema } from '@equmanager/database';
import { and, eq, inArray } from 'drizzle-orm';
import {
  UsersIcon,
  ClipboardTextIcon,
  MicrophoneStageIcon,
  GearIcon,
  HorseIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole, roleLabel } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Avatar, Badge, Button, CreatePanel, EmptyState, Field, Input, Select, SubmitButton,
} from '@/components/ui';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDelete';
import { addStaffAction, removeStaffAction, updateStaffRoleAction } from './actions';

export const metadata = { title: 'Equipo' };
export const dynamic = 'force-dynamic';

const STAFF_ROLES = ['admin', 'instructor', 'groom'] as const;

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin']);
  const { error, message } = await searchParams;

  const members = await db
    .select({
      id: schema.clubMembers.id,
      role: schema.clubMembers.role,
      profileId: schema.clubMembers.profileId,
      joinedAt: schema.clubMembers.joinedAt,
      fullName: schema.profiles.fullName,
      email: schema.profiles.email,
      avatarUrl: schema.profiles.avatarUrl,
    })
    .from(schema.clubMembers)
    .innerJoin(
      schema.profiles,
      eq(schema.profiles.id, schema.clubMembers.profileId),
    )
    .where(
      and(
        eq(schema.clubMembers.clubId, session.primary.clubId),
        inArray(schema.clubMembers.role, [
          'owner',
          'admin',
          'instructor',
          'groom',
        ]),
      ),
    )
    .orderBy(schema.clubMembers.joinedAt);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Propietario"
        title="Equipo de la hípica"
        description="Da de alta a instructores, mozos y administradores. Si la persona aún no tiene cuenta, le creamos invitación al añadir su email."
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

      <CreatePanel
        label="Añadir miembro al equipo"
        defaultOpen={members.length <= 1}
      >
        <form
          action={addStaffAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-6"
        >
          <div className="md:col-span-2">
            <Field label="Nombre completo">
              <Input required name="fullName" placeholder="Pepe Mozo" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Email">
              <Input required name="email" type="email" placeholder="pepe@correo.com" />
            </Field>
          </div>
          <Field label="Rol">
            <Select name="role" defaultValue="groom">
              <option value="groom">Mozo de cuadra</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Administrador</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <SubmitButton className="w-full">
              Añadir
            </SubmitButton>
          </div>
        </form>
        <p className="mt-3 text-[11px] font-medium text-stone-500">
          Si la persona aún no tiene cuenta Equmanager, le mandaremos email
          para que se una con la contraseña que elija.
        </p>
      </CreatePanel>

      {members.length === 0 ? (
        <EmptyState
          icon={<UsersIcon size={40} weight="duotone" />}
          title="Aún no tienes equipo"
          description="Empieza por añadir a tu primer mozo o instructor."
        />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              <tr>
                <th className="w-14 px-4 py-3"></th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {members.map((m) => {
                const isSelf = m.profileId === session.user.id;
                const isOwner = m.role === 'owner';
                return (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <Avatar
                        name={m.fullName ?? m.email}
                        src={m.avatarUrl}
                        size="md"
                      />
                    </td>
                    <td className="px-4 py-3 font-bold text-stone-900">
                      {m.fullName ?? '—'}
                      {isSelf && (
                        <Badge tone="info" className="ml-2">
                          Tú
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{m.email}</td>
                    <td className="px-4 py-3">
                      <RoleIcon role={m.role} />
                      <span className="ml-2 text-xs font-bold text-stone-800">
                        {roleLabel(m.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {!isOwner && !isSelf && (
                          <form action={updateStaffRoleAction} className="flex items-center gap-2">
                            <input type="hidden" name="memberId" value={m.id} />
                            <Select name="role" defaultValue={m.role}>
                              {STAFF_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {roleLabel(r)}
                                </option>
                              ))}
                            </Select>
                            <SubmitButton variant="outline" size="sm">
                              Cambiar
                            </SubmitButton>
                          </form>
                        )}
                        {!isOwner && !isSelf && (
                          <ConfirmDeleteButton
                            variant="icon"
                            action={removeStaffAction}
                            hidden={{ memberId: m.id }}
                            title={`Eliminar a ${m.fullName ?? m.email}`}
                            description="Perderá el acceso al club. Su trabajo y los registros se mantienen."
                            triggerLabel="Eliminar miembro"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RoleIcon({ role }: { role: string }) {
  if (role === 'owner') return <HorseIcon size={16} weight="duotone" className="inline text-amber-700" />;
  if (role === 'admin') return <GearIcon size={16} weight="duotone" className="inline text-stone-700" />;
  if (role === 'instructor') return <MicrophoneStageIcon size={16} weight="duotone" className="inline text-brand-700" />;
  if (role === 'groom') return <ClipboardTextIcon size={16} weight="duotone" className="inline text-rose-700" />;
  return null;
}
