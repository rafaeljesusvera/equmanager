'use client';

import { useEffect } from 'react';

const KEY = 'eq_chunk_reload_count';
const MAX_ATTEMPTS = 2;

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const chunkError = isChunkError(error);

  useEffect(() => {
    if (!chunkError) return;
    const raw = sessionStorage.getItem(KEY);
    const attempts = raw ? Number(raw) || 0 : 0;
    if (attempts >= MAX_ATTEMPTS) return;
    sessionStorage.setItem(KEY, String(attempts + 1));
    const url = new URL(window.location.href);
    url.searchParams.set('_v', String(Date.now()));
    window.location.replace(url.toString());
  }, [chunkError]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
          Superadmin
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">
          {chunkError ? 'Actualizando la app…' : 'Algo ha fallado'}
        </h1>
        <p className="mt-2 text-sm font-medium text-stone-600">
          {chunkError
            ? 'Hay una versión nueva. Vuelvo a cargar la página automáticamente.'
            : 'Recarga para volver a intentarlo. Si vuelve a pasar, escríbenos.'}
        </p>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem(KEY);
            reset();
          }}
          className="mt-6 inline-flex items-center rounded-xl bg-stone-900 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:bg-stone-800"
        >
          Recargar
        </button>
      </div>
    </div>
  );
}

function isChunkError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { name?: string; message?: string };
  const name = e.name ?? '';
  const msg = e.message ?? '';
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk [\w/-]+ failed/i.test(msg) ||
    /Loading CSS chunk/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Failed to load .*chunk/i.test(msg)
  );
}
