'use client';

import { useEffect } from 'react';

const KEY = 'eq_chunk_reload_attempt';

/**
 * Detecta el ChunkLoadError típico cuando hay un deploy nuevo y el
 * navegador intenta cargar un chunk del bundle anterior (404).
 *
 * Cuando lo ve, recarga la página una sola vez (flag en sessionStorage
 * para evitar bucle infinito si el error persiste por otra causa).
 */
export function ChunkErrorReloader() {
  useEffect(() => {
    const shouldReloadOnce = () => {
      const attempt = sessionStorage.getItem(KEY);
      if (attempt) return false;
      sessionStorage.setItem(KEY, String(Date.now()));
      return true;
    };

    function isChunkError(err: unknown): boolean {
      if (!err) return false;
      const e = err as { name?: string; message?: string };
      const name = e.name ?? '';
      const msg = e.message ?? '';
      return (
        name === 'ChunkLoadError' ||
        /Loading chunk [\w-]+ failed/i.test(msg) ||
        /Loading CSS chunk/i.test(msg) ||
        /Failed to fetch dynamically imported module/i.test(msg)
      );
    }

    function onError(ev: ErrorEvent) {
      if (isChunkError(ev.error ?? new Error(ev.message))) {
        if (shouldReloadOnce()) window.location.reload();
      }
    }

    function onRejection(ev: PromiseRejectionEvent) {
      if (isChunkError(ev.reason)) {
        if (shouldReloadOnce()) window.location.reload();
      }
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    // Reset flag a los 30s para permitir un futuro reload si vuelve a pasar
    const t = setTimeout(() => sessionStorage.removeItem(KEY), 30_000);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      clearTimeout(t);
    };
  }, []);

  return null;
}
