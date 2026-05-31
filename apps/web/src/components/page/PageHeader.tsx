'use client';

import { useEffect } from 'react';
import { pageTitleStore } from '@/lib/page-title-store';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  // Publica el título al Topbar en móvil
  useEffect(() => {
    pageTitleStore.set(title);
    return () => pageTitleStore.set('');
  }, [title]);

  return (
    <>
      {/* Móvil: solo muestra la acción si la hay (título ya está en el Topbar) */}
      {action && (
        <div className="mb-4 md:hidden">
          {action}
        </div>
      )}

      {/* Desktop: header grande con eyebrow + título + descripción + acción */}
      <header className="mb-8 hidden flex-wrap items-end justify-between gap-4 md:mb-10 md:flex">
        <div className="min-w-0">
          <p className="label-eyebrow">{eyebrow}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-stone-900 md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-stone-500 md:text-base">
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </header>
    </>
  );
}
