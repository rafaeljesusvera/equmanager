'use client';

import Link from 'next/link';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react/dist/ssr';

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DayPicker({ selectedDay }: { selectedDay: string }) {
  const parts = selectedDay.split('-').map(Number) as [number, number, number];
  const [y, m, d] = parts;
  const date = new Date(Date.UTC(y, m - 1, d));
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  const next = new Date(Date.UTC(y, m - 1, d + 1));

  const today = isoDay(new Date());
  const isToday = selectedDay === today;

  const label = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <Link
        href={`/app?day=${isoDay(prev)}`}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
        aria-label="Día anterior"
      >
        <CaretLeftIcon size={13} weight="bold" />
      </Link>

      <div className="flex min-w-0 flex-col items-center gap-0.5">
        {isToday && (
          <span className="rounded-full bg-brand-700 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white">
            Hoy
          </span>
        )}
        <span className="text-sm font-bold capitalize text-stone-900">
          {label}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {!isToday && (
          <Link
            href="/app"
            className="rounded-lg border border-stone-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-600 transition hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700"
          >
            Hoy
          </Link>
        )}
        <Link
          href={`/app?day=${isoDay(next)}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
          aria-label="Día siguiente"
        >
          <CaretRightIcon size={13} weight="bold" />
        </Link>
      </div>
    </div>
  );
}
