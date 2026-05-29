import Link from 'next/link';
import {
  HorseIcon,
  CertificateIcon,
  GraduationCapIcon,
  ClipboardTextIcon,
  MicrophoneStageIcon,
  CalendarBlankIcon,
  ArrowRightIcon,
  SparkleIcon,
  BookOpenTextIcon,
  TrophyIcon,
  NewspaperIcon,
  TicketIcon,
  MedalIcon,
  BellIcon,
  StethoscopeIcon,
  HeartIcon,
  CheckCircleIcon,
  ChatCircleTextIcon,
  UsersThreeIcon,
  ChatCircleIcon,
  SealCheckIcon,
} from '@phosphor-icons/react/dist/ssr';
import { LogoFull, LogoMark } from '@/components/brand/Logo';

export default function HomePage() {
  return (
    <main className="bg-mesh min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6 md:py-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Equmanager">
          <LogoMark size={52} className="md:hidden" />
          <LogoFull className="hidden h-12 w-auto md:block" />
        </Link>
        <nav className="flex items-center gap-2 md:gap-3">
          <Link
            href="/help/como-empezar"
            className="hidden text-xs font-bold uppercase tracking-[0.18em] text-stone-600 hover:text-brand-700 md:block"
          >
            Cómo funciona
          </Link>
          <Link
            href="/login"
            className="whitespace-nowrap rounded-xl border border-stone-300 bg-white/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-800 backdrop-blur transition hover:border-brand-400 hover:text-brand-700 md:px-4 md:py-2.5 md:text-xs md:tracking-[0.18em]"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="whitespace-nowrap rounded-xl bg-stone-900 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lift transition hover:bg-brand-800 md:px-4 md:py-2.5 md:text-xs md:tracking-[0.18em]"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-6 md:pb-20 md:pt-12">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
          <div className="stagger">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-800 backdrop-blur">
              <SparkleIcon size={12} weight="fill" /> Beta · con IA
            </div>
            <h1 className="mt-5 text-5xl font-bold tracking-tight text-stone-900 md:text-7xl">
              La hípica que se{' '}
              <span className="text-brand-700">gestiona sola</span>.
            </h1>
            <p className="mt-6 max-w-lg text-base font-medium leading-relaxed text-stone-600 md:text-lg">
              Un solo espacio para clases, eventos, cuidados y comunicación. La
              IA escucha tu nota de voz, identifica al alumno y reparte el
              feedback. Tú a montar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-lift transition hover:bg-brand-800"
              >
                Empezar gratis
                <ArrowRightIcon
                  size={14}
                  weight="bold"
                  className="transition group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/help/como-empezar"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white/70 px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-stone-800 backdrop-blur transition hover:border-brand-400 hover:text-brand-700"
              >
                Ver cómo funciona
              </Link>
            </div>
          </div>

          {/* Mock IA bandeja */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2.5rem] bg-gradient-to-br from-brand-200/50 to-accent-200/40 blur-2xl" />
            <div className="surface-glass relative rotate-1 p-6 md:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-700">
                  <MicrophoneStageIcon size={16} weight="duotone" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
                    Bandeja IA · Hoy
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  <SparkleIcon size={10} weight="fill" /> 3 nuevas
                </span>
              </div>
              <div className="space-y-2.5">
                <FakeFeedback
                  name="Lucía Pérez"
                  horse="Sultán"
                  text="Muy buen ritmo en el galope, dadle insignia de progreso."
                  highlight
                />
                <FakeFeedback
                  name="Marcos Ruiz"
                  horse="Trueno"
                  text="Cuidar la mano izquierda en el círculo abierto."
                />
                <FakeFeedback
                  name="Inés Vidal"
                  horse="Pícaro"
                  text="Excelente posición de pierna, lista para subir nivel."
                />
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-stone-200/70 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
                  Procesado en 1.2s
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
                  Enviar todo
                  <ArrowRightIcon size={10} weight="bold" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-eyebrow">Un espacio · Seis perfiles</p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
              Todo el mundo en la hípica,{' '}
              <span className="text-brand-700">conectado</span>.
            </h2>
          </div>
          <p className="max-w-xs text-sm font-medium text-stone-500">
            Cada rol ve solo lo suyo, pero todos están enlazados: cuando algo
            cambia aquí, el resto se entera ahí.
          </p>
        </div>

        <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <RoleCard
            icon={<HorseIcon size={32} weight="duotone" />}
            title="Propietario de hípica"
            text="Clases, cursos, eventos, noticias y bonos. Equipo con su checklist."
            tone="brand"
          />
          <RoleCard
            icon={<MicrophoneStageIcon size={32} weight="duotone" />}
            title="Monitor o profesor"
            text="Imparte clases con la Bandeja IA. Reparte feedback en segundos."
            tone="sky"
          />
          <RoleCard
            icon={<CertificateIcon size={32} weight="duotone" />}
            title="Propietario de caballo"
            text="Agenda de cuidados, historial de montura y avisos en tiempo real."
            tone="amber"
          />
          <RoleCard
            icon={<GraduationCapIcon size={32} weight="duotone" />}
            title="Alumno o corredor"
            text="Próximas clases, caballo asignado, calendario federado e insignias."
            tone="sky"
          />
          <RoleCard
            icon={<ClipboardTextIcon size={32} weight="duotone" />}
            title="Mozo de cuadra"
            text="Checklists del día por caballo. Una pulsación y el propietario lo sabe."
            tone="rose"
          />
          <RoleCard
            icon={<StethoscopeIcon size={32} weight="duotone" />}
            title="Proveedor"
            text="Veterinario, herrador, dentista, fisio. Tu agenda con todos los clientes."
            tone="brand"
          />
        </div>
      </section>

      {/* Desglose por perfil */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-eyebrow">Qué puede hacer cada perfil</p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
              Funcionalidades,{' '}
              <span className="text-brand-700">rol a rol</span>.
            </h2>
          </div>
          <p className="max-w-xs text-sm font-medium text-stone-500">
            El mismo Equmanager, cuatro experiencias. Mira con qué herramientas
            cuenta cada perfil cuando entra.
          </p>
        </div>

        <div className="stagger space-y-4">
          <ProfileBreakdown
            icon={<HorseIcon size={26} weight="duotone" />}
            title="Propietario de hípica"
            subtitle="También admin e instructor"
            tone="brand"
            features={[
              {
                icon: <HorseIcon size={18} weight="duotone" />,
                label: 'Gestión de caballos',
                text: 'Altas, descansos, fichas y disponibilidad.',
              },
              {
                icon: <GraduationCapIcon size={18} weight="duotone" />,
                label: 'Gestión de alumnos',
                text: 'Categorías, niveles y altas en un clic.',
              },
              {
                icon: <CalendarBlankIcon size={18} weight="duotone" />,
                label: 'Clases',
                text: 'Programación, asistencia y feedback.',
              },
              {
                icon: <BookOpenTextIcon size={18} weight="duotone" />,
                label: 'Cursos',
                text: 'Series de clases con inscripciones y pagos.',
              },
              {
                icon: <TrophyIcon size={18} weight="duotone" />,
                label: 'Eventos',
                text: 'Concursos, ferias y entradas.',
              },
              {
                icon: <NewspaperIcon size={18} weight="duotone" />,
                label: 'Noticias',
                text: 'Comunicados a toda la hípica.',
              },
              {
                icon: <TicketIcon size={18} weight="duotone" />,
                label: 'Bonos',
                text: 'Paquetes de clases con saldo y caducidad.',
              },
              {
                icon: <MedalIcon size={18} weight="duotone" />,
                label: 'Insignias',
                text: 'Diseña retos y premia progresos.',
              },
              {
                icon: <MicrophoneStageIcon size={18} weight="duotone" />,
                label: 'Bandeja IA',
                text: 'Nota de voz convertida en feedback por alumno.',
              },
            ]}
          />

          <ProfileBreakdown
            icon={<MicrophoneStageIcon size={26} weight="duotone" />}
            title="Monitor o profesor"
            subtitle="Instructores y entrenadores"
            tone="sky"
            features={[
              {
                icon: <CalendarBlankIcon size={18} weight="duotone" />,
                label: 'Calendario unificado',
                text: 'Tus clases de uno o varios centros en una sola agenda.',
              },
              {
                icon: <MicrophoneStageIcon size={18} weight="duotone" />,
                label: 'Bandeja IA',
                text: 'Nota de voz al terminar y feedback repartido por alumno.',
              },
              {
                icon: <MedalIcon size={18} weight="duotone" />,
                label: 'Insignias y progresos',
                text: 'Reconoces logros con un toque.',
              },
              {
                icon: <ChatCircleIcon size={18} weight="duotone" />,
                label: 'Mensajería directa',
                text: 'Habla con tus alumnos sin salir de la app.',
              },
            ]}
          />

          <ProfileBreakdown
            icon={<CertificateIcon size={26} weight="duotone" />}
            title="Propietario de caballo"
            subtitle="Familias con caballo en pupilaje"
            tone="amber"
            features={[
              {
                icon: <StethoscopeIcon size={18} weight="duotone" />,
                label: 'Agenda de cuidados',
                text: 'Veterinario, herrador, dentista y desparasitaciones.',
              },
              {
                icon: <ClipboardTextIcon size={18} weight="duotone" />,
                label: 'Parte del mozo',
                text: 'Comida, ejercicio, salud y descanso del día.',
              },
              {
                icon: <CalendarBlankIcon size={18} weight="duotone" />,
                label: 'Historial de montura',
                text: 'Quién, cuándo y con qué intensidad lo ha trabajado.',
              },
              {
                icon: <BellIcon size={18} weight="duotone" />,
                label: 'Avisos en tiempo real',
                text: 'Cojeras, incidencias o citas confirmadas.',
              },
            ]}
          />

          <ProfileBreakdown
            icon={<GraduationCapIcon size={26} weight="duotone" />}
            title="Alumno o corredor"
            subtitle="Jinetes y sus familias"
            tone="sky"
            features={[
              {
                icon: <CalendarBlankIcon size={18} weight="duotone" />,
                label: 'Mis clases',
                text: 'Próximas, asistencia y feedback recibido.',
              },
              {
                icon: <HeartIcon size={18} weight="duotone" />,
                label: 'Mis caballos',
                text: 'Caballos asignados y afinidad acumulada.',
              },
              {
                icon: <TrophyIcon size={18} weight="duotone" />,
                label: 'Eventos',
                text: 'Apúntate a concursos y cursos abiertos.',
              },
              {
                icon: <TicketIcon size={18} weight="duotone" />,
                label: 'Mis bonos',
                text: 'Saldo de clases y caducidad.',
              },
              {
                icon: <MedalIcon size={18} weight="duotone" />,
                label: 'Insignias y retos',
                text: 'Logros conseguidos y próximas metas.',
              },
              {
                icon: <NewspaperIcon size={18} weight="duotone" />,
                label: 'Noticias del club',
                text: 'Avisos importantes en tu inicio.',
              },
            ]}
          />

          <ProfileBreakdown
            icon={<ClipboardTextIcon size={26} weight="duotone" />}
            title="Mozo de cuadra"
            subtitle="Personal de cuadra"
            tone="rose"
            features={[
              {
                icon: <CheckCircleIcon size={18} weight="duotone" />,
                label: 'Checklist diaria',
                text: 'Por caballo: comida, agua, cama, salud.',
              },
              {
                icon: <ChatCircleTextIcon size={18} weight="duotone" />,
                label: 'Notas y partes',
                text: 'Incidencias que llegan al propietario al instante.',
              },
              {
                icon: <HorseIcon size={18} weight="duotone" />,
                label: 'Caballos asignados',
                text: 'Tu lista del día, ordenada por prioridad.',
              },
            ]}
          />

          <ProfileBreakdown
            icon={<StethoscopeIcon size={26} weight="duotone" />}
            title="Proveedor"
            subtitle="Veterinario, herrador, dentista, fisio…"
            tone="brand"
            features={[
              {
                icon: <CalendarBlankIcon size={18} weight="duotone" />,
                label: 'Agenda multicentro',
                text: 'Tus visitas en todos los centros con los que trabajas.',
              },
              {
                icon: <SealCheckIcon size={18} weight="duotone" />,
                label: 'Ficha profesional',
                text: 'Especialidad, teléfono y servicios siempre visibles para tus clientes.',
              },
              {
                icon: <ChatCircleIcon size={18} weight="duotone" />,
                label: 'Mensajería directa',
                text: 'Habla con propietarios y centros sin intermediarios.',
              },
              {
                icon: <HorseIcon size={18} weight="duotone" />,
                label: 'Historial por caballo',
                text: 'Tus visitas y tratamientos asociados a cada animal.',
              },
            ]}
          />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-5 text-center backdrop-blur">
          <UsersThreeIcon
            size={20}
            weight="duotone"
            className="shrink-0 text-brand-700"
          />
          <p className="text-xs font-medium text-stone-600 md:text-sm">
            Una misma persona puede tener varios perfiles (padre + propietario
            de caballo + alumno) y{' '}
            <span className="font-bold text-stone-900">
              cambiar de uno a otro
            </span>{' '}
            sin volver a entrar.
          </p>
        </div>
      </section>

      {/* Features destacadas */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
          <FeatureCard
            className="md:col-span-3"
            icon={<MicrophoneStageIcon size={28} weight="duotone" />}
            title="Nota de voz → feedback al alumno"
            text="Graba o pega lo que recuerdes de la clase. La IA identifica a cada alumno, su caballo y propone insignias. Tú revisas y mandas."
            big
          />
          <FeatureCard
            className="md:col-span-2"
            icon={<CalendarBlankIcon size={28} weight="duotone" />}
            title="Calendario único"
            text="Clases, cursos, eventos y cuidados en la misma agenda. Cada perfil ve solo lo suyo."
          />
        </div>
      </section>

      <footer className="mt-12 border-t border-stone-200/80 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 md:flex-row">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
            Equmanager · v0.3 · Beta pública
          </p>
          <Link
            href="/help/como-empezar"
            className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700 hover:text-brand-900"
          >
            Centro de ayuda
          </Link>
        </div>
      </footer>
    </main>
  );
}

function FakeFeedback({
  name,
  horse,
  text,
  highlight,
}: {
  name: string;
  horse: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 transition ${
        highlight
          ? 'border-brand-300 bg-brand-50/80 ring-1 ring-brand-200'
          : 'border-stone-200/70 bg-white/80'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-stone-900">{name}</p>
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {horse}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-stone-700">{text}</p>
    </div>
  );
}

const TONE_BG: Record<string, string> = {
  brand: 'from-brand-100 to-brand-50 text-brand-700',
  amber: 'from-amber-100 to-amber-50 text-amber-700',
  sky: 'from-sky-100 to-sky-50 text-sky-700',
  rose: 'from-rose-100 to-rose-50 text-rose-700',
};

function RoleCard({
  icon,
  title,
  text,
  tone = 'brand',
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  tone?: keyof typeof TONE_BG;
}) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${TONE_BG[tone]} transition group-hover:scale-110`}
      >
        {icon}
      </div>
      <h3 className="text-base font-bold text-stone-900">{title}</h3>
      <p className="mt-1.5 text-sm font-medium leading-relaxed text-stone-600">
        {text}
      </p>
    </article>
  );
}

const TONE_ACCENT: Record<string, { chip: string; ring: string; icon: string }> = {
  brand: {
    chip: 'bg-brand-100 text-brand-800',
    ring: 'ring-brand-200',
    icon: 'bg-brand-100 text-brand-700',
  },
  amber: {
    chip: 'bg-amber-100 text-amber-800',
    ring: 'ring-amber-200',
    icon: 'bg-amber-100 text-amber-700',
  },
  sky: {
    chip: 'bg-sky-100 text-sky-800',
    ring: 'ring-sky-200',
    icon: 'bg-sky-100 text-sky-700',
  },
  rose: {
    chip: 'bg-rose-100 text-rose-800',
    ring: 'ring-rose-200',
    icon: 'bg-rose-100 text-rose-700',
  },
};

function ProfileBreakdown({
  icon,
  title,
  subtitle,
  tone,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: keyof typeof TONE_ACCENT;
  features: Array<{ icon: React.ReactNode; label: string; text: string }>;
}) {
  const accent = TONE_ACCENT[tone] ?? TONE_ACCENT.brand!;
  return (
    <article className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-6 shadow-card md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <div className="md:w-1/4 md:shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent.icon}`}
            >
              {icon}
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ring-1 ${accent.chip} ${accent.ring}`}
            >
              Perfil
            </span>
          </div>
          <h3 className="mt-4 text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
            {title}
          </h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
            {subtitle}
          </p>
        </div>

        <ul className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li
              key={f.label}
              className="flex items-start gap-3 rounded-2xl border border-stone-200/70 bg-stone-50/60 p-3 transition hover:border-brand-300 hover:bg-white"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent.icon}`}
              >
                {f.icon}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-stone-900">
                  {f.label}
                </div>
                <p className="mt-0.5 text-xs font-medium leading-relaxed text-stone-600">
                  {f.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  big,
  className = '',
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  big?: boolean;
  className?: string;
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-7 shadow-card transition hover:shadow-lift md:p-9 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-brand-200/40 to-transparent blur-2xl"
      />
      <div className="relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          {icon}
        </div>
        <h3
          className={`mt-5 font-bold text-stone-900 ${big ? 'text-2xl font-bold tracking-tight md:text-3xl' : 'text-lg'}`}
        >
          {title}
        </h3>
        <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-stone-600">
          {text}
        </p>
      </div>
    </article>
  );
}
