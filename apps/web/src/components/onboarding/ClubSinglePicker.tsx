'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  XIcon,
} from '@phosphor-icons/react/dist/ssr';

type Suggestion = {
  id: string;
  name: string;
  province: string | null;
  federation: string;
  website: string | null;
};

/**
 * Selector único de centro contra el directorio público. El value se
 * envía al servidor como `directoryClubIds` (CSV con un único id) para
 * que `joinClubsAction` reciba un array uniforme.
 */
export function ClubSinglePicker() {
  const [q, setQ] = useState('');
  const [pinned, setPinned] = useState<Suggestion | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pinned) return;
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
        setSuggestions(data.results ?? []);
        setOpen(true);
      } catch {
        /* ignore */
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, pinned]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="hidden"
        name="directoryClubIds"
        value={pinned?.id ?? ''}
        required
      />
      {pinned ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-emerald-50/70 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircleIcon
              size={16}
              weight="fill"
              className="shrink-0 text-emerald-700"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-stone-900">
                {pinned.name}
              </div>
              <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                {pinned.federation.replace('_', ' ')}
                {pinned.province ? ` · ${pinned.province}` : ''}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPinned(null);
              setQ('');
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 hover:bg-white hover:text-red-700"
            aria-label="Quitar"
          >
            <XIcon size={12} weight="bold" />
          </button>
        </div>
      ) : (
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
            placeholder="Club Hípico Valdebebas"
            autoComplete="off"
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 pl-9 text-sm font-medium text-stone-900 outline-none focus:border-brand-500"
          />
        </div>
      )}

      {open && !pinned && suggestions.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-lift">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setPinned(s);
                setQ(s.name);
                setOpen(false);
              }}
              className="flex w-full items-start gap-2 border-b border-stone-100 px-3 py-2 text-left last:border-b-0 hover:bg-stone-50"
            >
              <MagnifyingGlassIcon
                size={12}
                weight="bold"
                className="mt-1 shrink-0 text-stone-400"
              />
              <div className="min-w-0">
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
