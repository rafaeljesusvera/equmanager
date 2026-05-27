'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useTransition,
  type FormEvent,
  type ReactNode,
} from 'react';
import { showToast } from './Toast';

type Action = (formData: FormData) => Promise<void> | void;

/**
 * Form de edición con auto-guardado al perder foco.
 * - Detecta blur en inputs/selects/textareas hijos.
 * - Si el valor cambió desde el último guardado, dispara la action.
 * - Muestra toast "Guardando…" (singleton) → "Guardado".
 * - Si varios blurs caen seguidos, sólo se ejecuta el último (debounce 200ms)
 *   y nunca dos guardados en paralelo (cola interna).
 */
export function AutoSaveForm({
  action,
  children,
  className,
  silent = false,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  silent?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const lastSerialized = useRef<string>('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const pendingDirty = useRef(false);
  const [, start] = useTransition();

  const serialize = useCallback((): string => {
    if (!formRef.current) return '';
    const fd = new FormData(formRef.current);
    const parts: string[] = [];
    fd.forEach((v, k) =>
      parts.push(`${k}=${typeof v === 'string' ? v : '[file]'}`),
    );
    return parts.sort().join('&');
  }, []);

  useEffect(() => {
    lastSerialized.current = serialize();
  }, [serialize]);

  const runSave = useCallback(async () => {
    if (!formRef.current) return;
    const current = serialize();
    if (current === lastSerialized.current) return;
    if (inFlight.current) {
      pendingDirty.current = true;
      return;
    }
    inFlight.current = true;
    const fd = new FormData(formRef.current);
    lastSerialized.current = current;
    if (!silent) showToast('saving', 'Guardando…');
    try {
      await new Promise<void>((resolve, reject) => {
        start(async () => {
          try {
            await action(fd);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
      if (!silent) showToast('success', 'Guardado');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      inFlight.current = false;
      if (pendingDirty.current) {
        pendingDirty.current = false;
        // Reintentamos por si quedaron cambios sin guardar
        void runSave();
      }
    }
  }, [action, serialize, silent, start]);

  function scheduleSave() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void runSave();
    }, 200);
  }

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    void runSave();
  }

  function handleBlur(e: React.FocusEvent<HTMLFormElement>) {
    const target = e.target as HTMLElement;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
      scheduleSave();
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onBlur={handleBlur}
      className={className}
    >
      {children}
    </form>
  );
}
