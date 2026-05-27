'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 180,
  minimum: 0.15,
  easing: 'ease',
  speed: 320,
});

/**
 * Barra de progreso superior tipo Linear/GitHub para cubrir las latencias
 * de navegación de App Router. Arranca al hacer clic en cualquier link
 * interno y termina cuando cambian pathname/searchParams.
 */
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Finaliza cuando llegamos a la nueva página
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  // Arranca al detectar un clic en un link interno
  useEffect(() => {
    function onClick(ev: MouseEvent) {
      if (ev.defaultPrevented) return;
      if (ev.button !== 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

      const target = (ev.target as HTMLElement | null)?.closest('a');
      if (!target) return;
      if (target.target && target.target !== '_self') return;
      const href = target.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.startsWith('http')) {
        try {
          const url = new URL(href);
          if (url.origin !== window.location.origin) return;
        } catch {
          return;
        }
      }
      // Mismo path: no recarga
      if (
        href === window.location.pathname + window.location.search ||
        href === window.location.pathname
      ) {
        return;
      }
      NProgress.start();
    }

    // Forms también disparan navegación (submits server actions)
    function onSubmit() {
      NProgress.start();
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
    };
  }, []);

  return null;
}
