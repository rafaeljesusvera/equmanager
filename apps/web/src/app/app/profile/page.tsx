import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import {
  CheckCircleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, roleLabel } from '@/lib/db';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import {
  Avatar,
  Badge,
  Button,
  Field,
  Input,
  SubmitButton,
} from '@/components/ui';
import { AutoSaveForm } from '@/components/ui/AutoSaveForm';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import {
  updateEmailAction,
  updatePasswordAction,
  updateProfileAction,
} from './actions';

export const metadata = { title: 'Mi perfil' };
export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await ensureSession();
  const { ok, error: errMsg } = await searchParams;

  // Si el usuario es rider en algún club, mostramos también el teléfono
  // que tiene como rider para que pueda editarlo desde aquí.
  const [anyRider] = await db
    .select({
      phone: schema.riders.phone,
      photoUrl: schema.riders.photoUrl,
    })
    .from(schema.riders)
    .where(eq(schema.riders.profileId, session.user.id))
    .limit(1);

  const profile = session.profile!;
  const photo = profile.avatarUrl ?? anyRider?.photoUrl ?? null;

  return (
    <DetailShell
      backHref="/app"
      backLabel="Inicio"
      eyebrow="Mi cuenta"
      title="Mi perfil"
      description="Tus datos personales, tu foto y las credenciales con las que entras a Equmanager."
    >
      {ok === 'email' && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          <CheckCircleIcon size={16} weight="fill" /> Email actualizado.
        </div>
      )}
      {ok === 'password' && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          <CheckCircleIcon size={16} weight="fill" /> Contraseña actualizada.
        </div>
      )}
      {errMsg && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
          <WarningCircleIcon size={16} weight="fill" />
          {errMsg}
        </div>
      )}

      {/* Resumen */}
      <section className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <Avatar
            name={profile.fullName ?? profile.email}
            src={photo}
            size="xl"
            square
            className="shadow-card"
          />
          <div className="min-w-0">
            <p className="label-eyebrow">Sesión activa</p>
            <h2 className="text-3xl font-bold tracking-tight leading-tight tracking-tight text-stone-900">
              {profile.fullName ?? profile.email.split('@')[0]}
            </h2>
            <p className="mt-1 truncate text-sm font-medium text-stone-500">
              {profile.email}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {session.memberships.map((m) => (
            <Badge key={m.id} tone="brand">
              {m.clubName} · {roleLabel(m.role)}
            </Badge>
          ))}
        </div>
      </section>

      {/* Datos personales (autosave) */}
      <DetailSection
        title="Datos personales"
        description="Foto, nombre y teléfono. Se sincronizan con tu ficha de alumno en las hípicas a las que pertenezcas."
      >
        <AutoSaveForm
          action={updateProfileAction}
          className="grid grid-cols-1 gap-4 md:grid-cols-6"
        >
          <div className="md:col-span-2 md:row-span-3">
            <PhotoUpload
              folder="profiles"
              name="avatarUrl"
              defaultValue={photo}
              label="Foto"
            />
          </div>
          <div className="md:col-span-4">
            <Field label="Nombre completo">
              <Input
                required
                name="fullName"
                defaultValue={profile.fullName ?? ''}
                placeholder="Lucía Pérez"
                maxLength={120}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Teléfono">
              <Input
                name="phone"
                defaultValue={anyRider?.phone ?? ''}
                placeholder="600 000 000"
                maxLength={40}
              />
            </Field>
          </div>
          <div className="md:col-span-2 hidden md:block" />
        </AutoSaveForm>
      </DetailSection>

      {/* Email */}
      <DetailSection
        title="Email"
        description="El email que usas para entrar a Equmanager. Cambia y confirma con tu contraseña actual."
      >
        <form
          action={updateEmailAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-6"
        >
          <div className="md:col-span-4">
            <Field label="Email">
              <Input
                required
                type="email"
                name="email"
                defaultValue={profile.email}
                placeholder="tu@correo.com"
              />
            </Field>
          </div>
          <div className="md:col-span-2 flex items-end">
            <SubmitButton className="w-full">
              Cambiar email
            </SubmitButton>
          </div>
        </form>
      </DetailSection>

      {/* Contraseña */}
      <DetailSection
        title="Contraseña"
        description="Mínimo 8 caracteres. Te mantendremos logado tras el cambio."
      >
        <form
          action={updatePasswordAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-6"
        >
          <div className="md:col-span-3">
            <Field label="Nueva contraseña">
              <Input
                required
                type="password"
                name="password"
                minLength={8}
                placeholder="········"
                autoComplete="new-password"
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Repítela">
              <Input
                required
                type="password"
                name="confirm"
                minLength={8}
                placeholder="········"
                autoComplete="new-password"
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <SubmitButton className="w-full">
              Actualizar contraseña
            </SubmitButton>
          </div>
        </form>
      </DetailSection>

      <DetailSection
        title="Sobre tu cuenta"
        description="Datos meta que conviene que sepas."
      >
        <ul className="space-y-2 text-sm font-medium text-stone-700">
          <li>
            <span className="text-stone-500">ID de usuario:</span>{' '}
            <span className="font-mono text-xs">{session.user.id}</span>
          </li>
          <li>
            <span className="text-stone-500">Cuenta creada:</span>{' '}
            {new Date(profile.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </li>
          <li>
            <span className="text-stone-500">Hípicas:</span>{' '}
            {session.memberships.length}
          </li>
        </ul>
      </DetailSection>
    </DetailShell>
  );
}
