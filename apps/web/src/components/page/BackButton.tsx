'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Volver"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-stone-600 active:bg-stone-100"
    >
      <ArrowLeftIcon size={20} weight="bold" />
    </button>
  );
}
