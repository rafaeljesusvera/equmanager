import { SpinnerIcon } from '@phosphor-icons/react/dist/ssr';
import { LogoMark } from '@/components/brand/Logo';

/**
 * Fallback de carga para páginas dentro de /app. Aparece mientras el
 * server prepara la página nueva (Suspense boundary del App Router).
 */
export function PageSpinner({ hint }: { hint?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-10 text-stone-500">
      <div className="relative">
        <LogoMark size={56} className="opacity-90" />
        <SpinnerIcon
          size={20}
          weight="bold"
          className="absolute -bottom-1 -right-1 animate-spin text-brand-700"
        />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
        {hint ?? 'Cargando…'}
      </p>
    </div>
  );
}
