'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircleIcon,
  WarningCircleIcon,
  SpinnerIcon,
} from '@phosphor-icons/react/dist/ssr';

export type ToastKind = 'success' | 'saving' | 'error';

export type ToastMessage = {
  id: number;
  kind: ToastKind;
  text: string;
};

let listener: ((toast: ToastMessage) => void) | null = null;

export function showToast(kind: ToastKind, text: string) {
  if (listener) listener({ id: Date.now() + Math.random(), kind, text });
}

const SAVING_FAILSAFE_MS = 6000;
const FINAL_TOAST_MS = 1800;

export function ToastHost() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<ToastMessage[]>([]);
  const savingTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const finalTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    setMounted(true);
    // Capturamos los refs en variables locales para usarlos en la cleanup
    // sin que React avise de "ref might change before cleanup runs".
    const saving = savingTimers.current;
    const finals = finalTimers.current;
    listener = (t) => {
      if (t.kind === 'saving') {
        // Mantén un solo "guardando" a la vez: reemplaza el anterior.
        setItems((prev) => {
          prev
            .filter((x) => x.kind === 'saving')
            .forEach((x) => {
              const timer = savingTimers.current.get(x.id);
              if (timer) clearTimeout(timer);
              savingTimers.current.delete(x.id);
            });
          return [...prev.filter((x) => x.kind !== 'saving'), t];
        });
        // Failsafe: si nadie cierra el "guardando", lo quitamos solos.
        const failsafe = setTimeout(() => {
          setItems((prev) => prev.filter((x) => x.id !== t.id));
          savingTimers.current.delete(t.id);
        }, SAVING_FAILSAFE_MS);
        savingTimers.current.set(t.id, failsafe);
        return;
      }

      // Para success/error: limpia los "guardando" pendientes y añade el final.
      setItems((prev) => {
        prev
          .filter((x) => x.kind === 'saving')
          .forEach((x) => {
            const timer = savingTimers.current.get(x.id);
            if (timer) clearTimeout(timer);
            savingTimers.current.delete(x.id);
          });
        return [...prev.filter((x) => x.kind !== 'saving'), t];
      });
      const off = setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
        finalTimers.current.delete(t.id);
      }, FINAL_TOAST_MS);
      finalTimers.current.set(t.id, off);
    };
    return () => {
      listener = null;
      saving.forEach((t) => clearTimeout(t));
      finals.forEach((t) => clearTimeout(t));
      saving.clear();
      finals.clear();
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-lg ring-1 ring-black/5 ${
            t.kind === 'success'
              ? 'bg-emerald-600 text-white'
              : t.kind === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-stone-900 text-white'
          }`}
        >
          {t.kind === 'saving' && (
            <SpinnerIcon size={14} weight="bold" className="animate-spin" />
          )}
          {t.kind === 'success' && <CheckCircleIcon size={14} weight="fill" />}
          {t.kind === 'error' && <WarningCircleIcon size={14} weight="fill" />}
          {t.text}
        </div>
      ))}
    </div>,
    document.body,
  );
}
