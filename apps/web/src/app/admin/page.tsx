import Link from 'next/link';
import {
  BuildingsIcon,
  HorseIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  ChartLineIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page/PageHeader';

export const metadata = { title: 'Superadmin · Resumen' };

const SECTIONS = [
  {
    href: '/admin/clubs',
    icon: <BuildingsIcon size={22} weight="duotone" />,
    label: 'Clubes',
    desc: 'Operativos, planes y federaciones',
    color: 'bg-cyan-100 text-cyan-700',
  },
  {
    href: '/admin/users',
    icon: <UsersIcon size={22} weight="duotone" />,
    label: 'Usuarios',
    desc: 'Perfiles, roles y membresías',
    color: 'bg-violet-100 text-violet-700',
  },
  {
    href: '/admin/horses',
    icon: <HorseIcon size={22} weight="duotone" />,
    label: 'Caballos',
    desc: 'Todos los clubes',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    href: '/admin/directory',
    icon: <MagnifyingGlassIcon size={22} weight="duotone" />,
    label: 'Directorio',
    desc: 'Padrón oficial RFHE',
    color: 'bg-stone-100 text-stone-600',
  },
  {
    href: '/admin/stats',
    icon: <ChartLineIcon size={22} weight="duotone" />,
    label: 'Estadísticas',
    desc: 'Gráficas de evolución del sistema',
    color: 'bg-emerald-100 text-emerald-700',
  },
];

export default function AdminHome() {
  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Panel de control"
        description="Elige una sección."
      />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-card transition hover:border-brand-200 hover:bg-brand-50/30"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${s.color}`}
            >
              {s.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-stone-900">{s.label}</div>
              <div className="mt-0.5 truncate text-xs font-medium text-stone-500">
                {s.desc}
              </div>
            </div>
            <ArrowRightIcon
              size={15}
              weight="bold"
              className="shrink-0 text-stone-300 transition group-hover:text-brand-500"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
