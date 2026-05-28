import Image from 'next/image';
import { cn } from '@/lib/utils';

const SIZE_PX: Record<NonNullable<AvatarProps['size']>, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  '2xl': 120,
};

const TEXT_BY_SIZE: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl',
  '2xl': 'text-3xl',
};

// Paleta determinista a partir del nombre, para que cada persona tenga
// siempre el mismo color al pintar iniciales
const PALETTE = [
  'from-brand-200 to-brand-400 text-brand-900',
  'from-amber-200 to-amber-400 text-amber-900',
  'from-sky-200 to-sky-400 text-sky-900',
  'from-rose-200 to-rose-400 text-rose-900',
  'from-violet-200 to-violet-400 text-violet-900',
  'from-emerald-200 to-emerald-400 text-emerald-900',
  'from-orange-200 to-orange-400 text-orange-900',
  'from-fuchsia-200 to-fuchsia-400 text-fuchsia-900',
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export type AvatarProps = {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  square?: boolean;
  className?: string;
  ring?: boolean;
};

export function Avatar({
  name,
  src,
  size = 'md',
  square = false,
  className,
  ring = false,
}: AvatarProps) {
  const px = SIZE_PX[size];
  const radius = square ? 'rounded-2xl' : 'rounded-full';
  const palette = PALETTE[hashName(name) % PALETTE.length];
  const ringCls = ring ? 'ring-2 ring-white' : '';

  if (src) {
    return (
      <div
        className={cn(
          'relative overflow-hidden bg-stone-100',
          radius,
          ringCls,
          className,
        )}
        style={{ width: px, height: px }}
      >
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={`${px}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center bg-gradient-to-br font-bold',
        radius,
        ringCls,
        palette,
        TEXT_BY_SIZE[size],
        className,
      )}
      style={{ width: px, height: px }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}

/**
 * Pila de avatares solapados, útil para listas de asistentes/inscritos.
 */
export function AvatarStack({
  people,
  max = 4,
  size = 'sm',
}: {
  people: Array<{ name: string; src?: string | null }>;
  max?: number;
  size?: AvatarProps['size'];
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => (
        <Avatar key={`${p.name}-${i}`} name={p.name} src={p.src} size={size} ring />
      ))}
      {extra > 0 && (
        <div
          className="flex items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-700 ring-2 ring-white"
          style={{ width: SIZE_PX[size!], height: SIZE_PX[size!] }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
