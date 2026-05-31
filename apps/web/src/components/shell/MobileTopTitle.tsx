'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import { pageTitleStore } from '@/lib/page-title-store';

export function MobileTopTitle() {
  const router = useRouter();
  const title = useSyncExternalStore(
    pageTitleStore.subscribe,
    pageTitleStore.get,
    () => '', // server snapshot
  );

  if (!title) return <div className="flex-1" />;

  return (
    <div className="flex flex-1 items-center gap-1 min-w-0">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Volver"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-stone-600 active:bg-stone-100"
      >
        <ArrowLeftIcon size={20} weight="bold" />
      </button>
      <span className="truncate text-sm font-bold text-stone-900">{title}</span>
    </div>
  );
}
