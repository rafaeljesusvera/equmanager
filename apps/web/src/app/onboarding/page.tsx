import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  HorseIcon,
  CertificateIcon,
  GraduationCapIcon,
  ClipboardTextIcon,
  MicrophoneStageIcon,
} from '@phosphor-icons/react/dist/ssr';
import { getSessionOrRedirect } from '@/lib/db';
import { LogoMark } from '@/components/brand/Logo';
import { Button, Field } from '@/components/ui';
import { ClubNameAutocomplete } from '@/components/onboarding/ClubNameAutocomplete';
import { ClubMultiPicker } from '@/components/onboarding/ClubMultiPicker';
import { ClubSinglePicker } from '@/components/onboarding/ClubSinglePicker';
import { createClubAction, joinClubsAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bienvenido' };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; error?: string }>;
}) {
  const session = await getSessionOrRedirect();
  if (session.primary) redirect('/app');

  const { as, error } = await searchParams;
  const choice = as ?? '';

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-stone-50 to-stone-100">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <LogoMark size={36} />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
          Bienvenido · {session.user.email}
        </p>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {!choice && <RoleChooser />}
        {choice === 'owner' && <OwnerForm />}
        {(choice === 'horse_owner' ||
          choice === 'rider' ||
          choice === 'groom' ||
          choice === 'instructor') && <JoinForm preset={choice} />}
      </section>
    </main>
  );
}

function RoleChooser() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900">
        ¿Quién entra por la puerta?
      </h1>
      <p className="mt-2 max-w-lg text-sm font-medium text-stone-600">
        Esto decide qué ves al entrar. Podrás cambiarlo o tener varios roles en
        distintas hípicas más adelante.
      </p>

      <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2">
        <RoleChip
          href="/onboarding?as=owner"
          icon={<HorseIcon size={28} weight="duotone" />}
          title="Soy propietario de hípica"
          text="Quiero gestionar mi club, dar de alta clases, eventos y bonos."
        />
        <RoleChip
          href="/onboarding?as=instructor"
          icon={<MicrophoneStageIcon size={28} weight="duotone" />}
          title="Soy monitor o profesor"
          text="Imparto clases en uno o varios centros. Reparto feedback con IA."
        />
        <RoleChip
          href="/onboarding?as=horse_owner"
          icon={<CertificateIcon size={28} weight="duotone" />}
          title="Soy propietario de un caballo"
          text="Tengo uno o varios caballos en pupilaje y quiero su agenda."
        />
        <RoleChip
          href="/onboarding?as=rider"
          icon={<GraduationCapIcon size={28} weight="duotone" />}
          title="Soy alumno o corredor"
          text="Quiero apuntarme a clases y ver eventos de mi hípica."
        />
        <RoleChip
          href="/onboarding?as=groom"
          icon={<ClipboardTextIcon size={28} weight="duotone" />}
          title="Soy mozo de cuadra"
          text="Trabajo en uno o varios centros y llevo sus checklists."
        />
      </div>

      <p className="mt-8 text-center text-xs font-medium text-stone-500">
        ¿Aún no sabes qué eres?{' '}
        <Link
          href="/help/como-empezar"
          className="font-bold uppercase tracking-[0.14em] text-brand-700 hover:text-brand-900"
        >
          Ver guía rápida
        </Link>
      </p>
    </div>
  );
}

function RoleChip({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-3xl border border-stone-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-bold text-stone-900">{title}</h3>
          <p className="mt-1 text-sm font-medium leading-relaxed text-stone-600">
            {text}
          </p>
        </div>
      </div>
    </Link>
  );
}

function OwnerForm() {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-7 shadow-soft">
      <Link
        href="/onboarding"
        className="mb-5 inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
      >
        ← Cambiar perfil
      </Link>
      <h1 className="text-2xl font-bold text-stone-900">Crea tu hípica</h1>
      <p className="mt-1.5 max-w-md text-sm font-medium text-stone-600">
        Solo el nombre. Te creamos el espacio con plantillas listas para usar
        (mozos, cuidados, calendario).
      </p>

      <form action={createClubAction} className="mt-6 space-y-3">
        <Field
          label="Nombre de la hípica"
          hint="Empieza a escribir: si está en la federación, la encontramos por ti."
        >
          <ClubNameAutocomplete name="name" />
        </Field>
        <Button type="submit" size="lg" className="w-full">
          Crear hípica y entrar
        </Button>
      </form>
    </div>
  );
}

function JoinForm({
  preset,
}: {
  preset: 'horse_owner' | 'rider' | 'groom' | 'instructor';
}) {
  const presetLabels: Record<
    typeof preset,
    { title: string; subtitle: string; multi: boolean }
  > = {
    horse_owner: {
      title: 'Tus caballos en propiedad',
      subtitle:
        'Elige el centro o centros donde tienes caballos en pupilaje. Después podrás añadir más.',
      multi: true,
    },
    rider: {
      title: 'Tu hípica',
      subtitle:
        'Elige el centro donde montas. Si está federado al RFHE o a una autonómica, lo encontramos por ti.',
      multi: false,
    },
    groom: {
      title: 'Tus centros como mozo',
      subtitle:
        'Selecciona los clubes donde trabajas. Verás las tareas diarias de cada uno separadas.',
      multi: true,
    },
    instructor: {
      title: 'Centros donde impartes clase',
      subtitle:
        'Selecciona uno o varios centros. Tendrás un calendario y bandeja IA unificados.',
      multi: true,
    },
  };
  const labels = presetLabels[preset];

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-7 shadow-soft">
      <Link
        href="/onboarding"
        className="mb-5 inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
      >
        ← Cambiar perfil
      </Link>
      <h1 className="text-2xl font-bold text-stone-900">{labels.title}</h1>
      <p className="mt-1.5 max-w-md text-sm font-medium text-stone-600">
        {labels.subtitle}
      </p>

      <form action={joinClubsAction} className="mt-6 space-y-4">
        <input type="hidden" name="role" value={preset} />
        <Field
          label={labels.multi ? 'Centros' : 'Centro'}
          hint="Busca por nombre y selecciona la opción que coincida."
        >
          {labels.multi ? (
            <ClubMultiPicker />
          ) : (
            <ClubSinglePicker />
          )}
        </Field>
        <Button type="submit" size="lg" className="w-full">
          {labels.multi ? 'Unirme a estos centros' : 'Unirme a este centro'}
        </Button>
      </form>
    </div>
  );
}
