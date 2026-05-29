'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';

type Action = (formData: FormData) => Promise<void> | void;

/**
 * Botón que abre un modal de confirmación antes de ejecutar una server
 * action destructiva. Útil para "Eliminar caballo", "Eliminar curso", etc.
 */
export function ConfirmDeleteButton({
  action,
  hidden,
  variant = 'icon',
  triggerLabel,
  triggerClassName,
  title = '¿Eliminar?',
  description = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Sí, eliminar',
  cancelLabel = 'Cancelar',
}: {
  action: Action;
  /** Campos hidden a enviar con la acción, p. ej. { id: '...' } */
  hidden?: Record<string, string>;
  /** Estilo del trigger: icono pequeño o botón completo. */
  variant?: 'icon' | 'button';
  /** Texto del trigger cuando variant='button'. */
  triggerLabel?: string;
  triggerClassName?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Cierra con Esc
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const triggerNode =
    variant === 'icon' ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600',
          triggerClassName,
        )}
        title={triggerLabel ?? 'Eliminar'}
      >
        <TrashIcon size={16} weight="bold" />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-card transition hover:bg-red-700',
          triggerClassName,
        )}
      >
        <TrashIcon size={14} weight="bold" />
        {triggerLabel ?? 'Eliminar'}
      </button>
    );

  return (
    <>
      {triggerNode}
      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
            >
              <button
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
              />
              <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
                  aria-label="Cerrar"
                >
                  <XIcon size={16} weight="bold" />
                </button>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                  <WarningCircleIcon size={26} weight="fill" />
                </div>
                <h2 className="mt-3 text-lg font-bold text-stone-900">
                  {title}
                </h2>
                <p className="mt-1 text-sm font-medium leading-relaxed text-stone-600">
                  {description}
                </p>

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-stone-800 transition hover:border-stone-400"
                  >
                    {cancelLabel}
                  </button>
                  <form action={action}>
                    {Object.entries(hidden ?? {}).map(([k, v]) => (
                      <input key={k} type="hidden" name={k} value={v} />
                    ))}
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-red-700"
                    >
                      <TrashIcon size={14} weight="bold" /> {confirmLabel}
                    </button>
                  </form>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
