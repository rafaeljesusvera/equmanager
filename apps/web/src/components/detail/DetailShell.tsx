import Link from 'next/link';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui';

/**
 * Layout para páginas de detalle estilo ficha.
 *
 * - Breadcrumb minimal hacia la lista origen.
 * - Eyebrow + título grande con tipografía display serif para diferenciar
 *   la ficha del resto del producto.
 * - Status opcional como pill prominente alineado a la derecha.
 * - Contenido en secciones <DetailSection> con animación de entrada.
 */
export function DetailShell({
  backHref,
  backLabel = 'Volver',
  eyebrow,
  title,
  description,
  status,
  children,
}: {
  backHref: string;
  backLabel?: string;
  eyebrow: string;
  title: string;
  description?: string;
  status?: {
    label: string;
    tone?: 'success' | 'neutral' | 'warn' | 'brand' | 'danger' | 'info';
  };
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 md:p-10">
      <Link
        href={backHref as never}
        className="group mb-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500 transition hover:text-brand-700"
      >
        <ArrowLeftIcon
          size={12}
          weight="bold"
          className="transition group-hover:-translate-x-0.5"
        />
        {backLabel}
      </Link>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 md:mb-10">
        <div className="min-w-0">
          <p className="label-eyebrow">{eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl font-normal leading-[1] tracking-tightest text-stone-900 md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-stone-500 md:text-base">
              {description}
            </p>
          )}
        </div>
        {status && (
          <div className="shrink-0">
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
        )}
      </header>

      <div className="stagger space-y-6">{children}</div>
    </div>
  );
}

export function DetailSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-card transition hover:shadow-lift md:p-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-900 md:text-lg">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs font-medium text-stone-500">
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </header>
      {children}
    </section>
  );
}
