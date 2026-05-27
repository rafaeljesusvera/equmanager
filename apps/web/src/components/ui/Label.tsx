import { type LabelHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-stone-600',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Wrapper de campo: envuelve el input en un `<label>` HTML para que el
 * click en el texto enfoque el input y la accesibilidad asocie ambos
 * automáticamente. Esto también permite que herramientas como bro
 * encuentren el input por su label visible.
 */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-stone-600">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] font-medium text-stone-500">
          {hint}
        </span>
      )}
    </label>
  );
}
