import Link from 'next/link';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import { LogoMark } from '@/components/brand/Logo';
import { ProfileTabs } from './ProfileTabs';

export const metadata = {
  title: 'Cómo empezar',
  description:
    'Guía paso a paso para empezar en Equmanager según tu perfil: propietario, monitor, propietario de caballo, alumno o mozo.',
};

export default function ComoEmpezarPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={32} />
            <div className="text-sm font-bold text-stone-900">Equmanager</div>
          </Link>
          <Link
            href="/help"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600 hover:text-brand-700"
          >
            Todas las guías
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/help"
          className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
        >
          <ArrowLeftIcon size={12} weight="bold" /> Centro de ayuda
        </Link>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          Empezar
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
          Cómo empezar en Equmanager
        </h1>
        <p className="mt-3 max-w-2xl text-base font-medium text-stone-600">
          Elige tu perfil y te explicamos en pocos pasos cómo darte de alta y
          dónde tienes que ir cuando entres por primera vez.
        </p>

        <ProfileTabs />
      </article>
    </main>
  );
}
