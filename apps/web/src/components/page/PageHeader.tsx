import { BackButton } from './BackButton';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <>
      {/* Móvil: barra compacta con flecha + título centrado + acción */}
      <div className="mb-4 flex items-center gap-2 md:hidden">
        <BackButton />
        <h1 className="flex-1 text-center text-base font-bold text-stone-900">
          {title}
        </h1>
        {/* Placeholder para mantener el título centrado cuando hay acción */}
        {action
          ? <div className="shrink-0">{action}</div>
          : <div className="w-8" />
        }
      </div>

      {/* Desktop: header grande con eyebrow + título + descripción */}
      <header className="mb-8 hidden flex-wrap items-end justify-between gap-4 md:mb-10 md:flex">
        <div className="min-w-0">
          <p className="label-eyebrow">{eyebrow}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-stone-900 md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-stone-500 md:text-base">
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </header>
    </>
  );
}
