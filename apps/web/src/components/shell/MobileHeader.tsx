'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
} from '@phosphor-icons/react/dist/ssr';
import { LogoMark } from '@/components/brand/Logo';
import { MobileNav } from './MobileNav';
import type { NavSection } from '@/lib/nav';

const STATIC_TITLES: Record<string, string> = {
  '/app': 'Equmanager',
  '/app/horses': 'Caballos',
  '/app/riders': 'Alumnos',
  '/app/courses': 'Cursos',
  '/app/lessons': 'Clases',
  '/app/events': 'Eventos',
  '/app/news': 'Noticias',
  '/app/bonos': 'Bonos',
  '/app/badges': 'Insignias',
  '/app/ai': 'Bandeja IA',
  '/app/me': 'Mi panel',
  '/app/me/lessons': 'Mis clases',
  '/app/me/horses': 'Mis caballos',
  '/app/me/events': 'Eventos',
  '/app/me/bonos': 'Mis bonos',
  '/app/me/badges': 'Mis insignias',
  '/app/horse-owner': 'Mis caballos',
  '/app/groom': 'Mi día',
  '/app/notifications': 'Notificaciones',
};

const PATTERN_TITLES: Array<[RegExp, string]> = [
  [/^\/app\/horses\/[^/]+$/, 'Caballo'],
  [/^\/app\/riders\/[^/]+$/, 'Alumno'],
  [/^\/app\/courses\/[^/]+$/, 'Curso'],
  [/^\/app\/events\/[^/]+$/, 'Evento'],
  [/^\/app\/news\/[^/]+$/, 'Noticia'],
  [/^\/app\/bonos\/[^/]+$/, 'Bono'],
  [/^\/app\/badges\/[^/]+$/, 'Insignia'],
  [/^\/app\/ai\/[^/]+$/, 'Nota IA'],
  [/^\/app\/horse-owner\/[^/]+$/, 'Caballo'],
  [/^\/app\/groom\/[^/]+$/, 'Checklist'],
];

function titleFor(path: string): string {
  if (STATIC_TITLES[path]) return STATIC_TITLES[path];
  for (const [re, title] of PATTERN_TITLES) {
    if (re.test(path)) return title;
  }
  return 'Equmanager';
}

/**
 * Cabecera móvil contextual:
 *  - En /app: icono menú (hamburguesa) + logo + nombre.
 *  - En cualquier otra ruta: flecha atrás + título de la sección.
 *
 * En desktop está oculta porque la sidebar ya cumple la misma función.
 */
export function MobileHeader({
  sections,
  clubName,
  roleLabel,
  email,
}: {
  sections: NavSection[];
  clubName: string;
  roleLabel: string;
  email: string;
}) {
  const pathname = usePathname() ?? '/app';
  const router = useRouter();
  const isHome = pathname === '/app';
  const title = titleFor(pathname);

  if (isHome) {
    return (
      <div className="flex items-center gap-2 md:hidden">
        <MobileNav
          sections={sections}
          clubName={clubName}
          roleLabel={roleLabel}
          email={email}
        />
        <Link href="/app" className="flex items-center gap-2">
          <LogoMark size={26} />
          <span className="text-sm font-bold text-stone-900">Equmanager</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3 md:hidden">
      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
          } else {
            router.push('/app');
          }
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-700 transition hover:border-brand-300 hover:text-brand-700"
        aria-label="Volver"
      >
        <ArrowLeftIcon size={18} weight="bold" />
      </button>
      <h1 className="min-w-0 truncate text-base font-bold text-stone-900">
        {title}
      </h1>
    </div>
  );
}
