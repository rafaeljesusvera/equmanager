import Link from 'next/link';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react/dist/ssr';

const PER_OPTIONS = [20, 50, 100] as const;

export function Paginator({
  total,
  page,
  per,
  basePath,
}: {
  total: number;
  page: number;
  per: number;
  basePath: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / per));
  const from = total === 0 ? 0 : (page - 1) * per + 1;
  const to = Math.min(page * per, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-4 py-3 text-xs">
      <div className="flex items-center gap-3">
        <span className="font-medium text-stone-500">
          {from}–{to} de {total.toLocaleString('es-ES')}
        </span>
        <div className="flex items-center gap-0.5">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Por página
          </span>
          {PER_OPTIONS.map((n) => (
            <Link
              key={n}
              href={`${basePath}?page=1&per=${n}`}
              className={`rounded-lg px-2 py-1 font-bold transition ${
                per === n
                  ? 'bg-brand-100 text-brand-700'
                  : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700'
              }`}
            >
              {n}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-1 font-bold text-stone-600">
          Pág. {page} / {totalPages}
        </span>
        {page > 1 ? (
          <Link
            href={`${basePath}?page=${page - 1}&per=${per}`}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100"
          >
            <CaretLeftIcon size={14} weight="bold" />
          </Link>
        ) : (
          <span className="rounded-lg p-1.5 text-stone-300">
            <CaretLeftIcon size={14} weight="bold" />
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={`${basePath}?page=${page + 1}&per=${per}`}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100"
          >
            <CaretRightIcon size={14} weight="bold" />
          </Link>
        ) : (
          <span className="rounded-lg p-1.5 text-stone-300">
            <CaretRightIcon size={14} weight="bold" />
          </span>
        )}
      </div>
    </div>
  );
}
