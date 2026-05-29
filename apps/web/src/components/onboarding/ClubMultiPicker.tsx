'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MagnifyingGlassIcon,
  XIcon,
  PlusIcon,
} from '@phosphor-icons/react/dist/ssr';

type Suggestion = {
  id: string;
  name: string;
  province: string | null;
  federation: string;
  website: string | null;
};

/**
 * Selector multi de centros contra el directorio público.
 * El value se envía como CSV en `directoryClubIds`.
 */
export function ClubMultiPicker() {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Suggestion[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/directory-search?q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal },
        );
        const data: { results: Suggestion[] } = await res.json();
        setSuggestions(
          (data.results ?? []).filter(
            (s) => !picked.some((p) => p.id === s.id),
          ),
        );
        setOpen(true);
      } catch {
        /* ignore */
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, picked]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function add(s: Suggestion) {
    setPicked((p) => [...p, s]);
    setQ('');
    setSuggestions([]);
    setOpen(false);
  }

  function remove(id: string) {
    setPicked((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="hidden"
        name="directoryClubIds"
        value={picked.map((p) => p.id).join(',')}
        required={picked.length === 0}
      />

      {picked.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {picked.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-900"
              title={
                p.province ? `${p.name} · ${p.province}` : p.name
              }
            >
              {p.name}
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-200"
                aria-label={`Quitar ${p.name}`}
              >
                <XIcon size={10} weight="bold" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <MagnifyingGlassIcon
          size={14}
          weight="bold"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={
            picked.length === 0
              ? 'Buscar centro y añadir…'
              : 'Añadir otro centro…'
          }
          autoComplete="off"
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 pl-9 text-sm font-medium text-stone-900 outline-none focus:border-brand-500"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-lift">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => add(s)}
              className="flex w-full items-center gap-2 border-b border-stone-100 px-3 py-2 text-left last:border-b-0 hover:bg-stone-50"
            >
              <PlusIcon
                size={12}
                weight="bold"
                className="shrink-0 text-emerald-700"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-stone-900">
                  {s.name}
                </div>
                <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                  {s.federation.replace('_', ' ')}
                  {s.province ? ` · ${s.province}` : ''}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
