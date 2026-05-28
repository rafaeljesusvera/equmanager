import Link from 'next/link';
import {
  HorseIcon,
  CertificateIcon,
  GraduationCapIcon,
  ClipboardTextIcon,
  MicrophoneStageIcon,
  CalendarBlankIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { LogoFull, LogoMark } from '@/components/brand/Logo';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-stone-50 to-stone-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 md:px-6 md:py-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Equmanager">
          <LogoMark size={40} className="md:hidden" />
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
            className="whitespace-nowrap rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-800 transition hover:border-brand-400 hover:text-brand-700 md:px-4 md:text-xs md:tracking-[0.18em]"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="whitespace-nowrap rounded-xl bg-brand-700 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-card transition hover:bg-brand-600 md:px-4 md:text-xs md:tracking-[0.18em]"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10 md:py-20">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700">
              · Gestión integral · Hípicas · Propietarios · Alumnos ·
            </p>
            <h1 className="text-4xl font-bold leading-tight text-stone-900 md:text-6xl">
              La hípica que se gestiona{' '}
              <span className="text-brand-700">sola</span>.
            </h1>
            <p className="mt-5 max-w-lg text-base font-medium leading-relaxed text-stone-600">
              Un solo espacio para clases, eventos, cuidados y comunicación. La
              IA escucha tu nota de voz, identifica al alumno y reparte el
              feedback. Tú a montar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-card transition hover:bg-brand-600"
              >
                Empezar gratis <ArrowRightIcon size={14} weight="bold" />
              </Link>
              <Link
                href="/help/como-empezar"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-stone-800 transition hover:border-brand-400 hover:text-brand-700"
              >
                Ver cómo funciona
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 translate-x-6 translate-y-6 rounded-[2.5rem] bg-brand-100" />
            <div className="rounded-[2.5rem] border border-stone-200 bg-white p-7 shadow-soft">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                  Bandeja IA · Hoy
                </p>
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-800">
                  3 nuevas
                </span>
              </div>
              <div className="space-y-3">
                <FakeFeedback
                  name="Lucía Pérez"
                  horse="Sultán"
                  text="Muy buen ritmo en el galope, dadle insignia de progreso."
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
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
          Un espacio · Cuatro perfiles
        </p>
        <h2 className="text-2xl font-bold text-stone-900 md:text-3xl">
          Todo el mundo en la hípica, conectado.
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <RoleCard
            icon={<HorseIcon size={32} weight="duotone" />}
            title="Propietario de hípica"
            text="Clases, cursos, eventos, noticias y bonos. Mozos con su checklist diaria."
          />
          <RoleCard
            icon={<CertificateIcon size={32} weight="duotone" />}
            title="Propietario de caballo"
            text="Agenda de cuidados, historial de montura y avisos en tiempo real."
          />
          <RoleCard
            icon={<GraduationCapIcon size={32} weight="duotone" />}
            title="Alumno o corredor"
            text="Próximas clases, caballo asignado, afinidad, insignias y eventos."
          />
          <RoleCard
            icon={<ClipboardTextIcon size={32} weight="duotone" />}
            title="Mozo de cuadra"
            text="Checklists del día por caballo. Una pulsación y el propietario lo sabe."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FeatureCard
            icon={<MicrophoneStageIcon size={28} weight="duotone" />}
            title="Nota de voz → feedback al alumno"
            text="Graba o pega lo que recuerdas de la clase. La IA identifica a cada alumno, su caballo y propone insignias. Tú revisas y mandas."
          />
          <FeatureCard
            icon={<CalendarBlankIcon size={28} weight="duotone" />}
            title="Calendario único"
            text="Clases, cursos, eventos y cuidados en la misma agenda. Cada perfil ve solo lo suyo."
          />
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 md:flex-row">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
            Equmanager · v0.2 · Beta pública
          </p>
          <Link
            href="/help/como-empezar"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700 hover:text-brand-900"
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
}: {
  name: string;
  horse: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-stone-900">{name}</p>
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {horse}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-stone-600">{text}</p>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300">
      <div className="text-brand-700">{icon}</div>
      <h3 className="mt-4 text-base font-bold text-stone-900">{title}</h3>
      <p className="mt-1.5 text-sm font-medium leading-relaxed text-stone-600">
        {text}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-7 shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-bold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-relaxed text-stone-600">
        {text}
      </p>
    </div>
  );
}
