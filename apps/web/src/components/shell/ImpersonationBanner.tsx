import { EyeIcon, SignOutIcon } from '@phosphor-icons/react/dist/ssr';
import { stopImpersonatingAction } from '@/app/auth/actions';
import { getImpersonationFrom } from '@/lib/impersonation';

export async function ImpersonationBanner({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const originalEmail = await getImpersonationFrom();
  if (!originalEmail) return null;
  // Si por alguna razón ya estás logado como tu cuenta original, no muestres
  if (originalEmail === currentEmail) return null;

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2 text-amber-900 md:px-6">
      <div className="flex min-w-0 items-center gap-2 text-xs font-bold">
        <EyeIcon size={14} weight="bold" />
        <span className="truncate">
          Estás viendo Equmanager como{' '}
          <span className="font-black">{currentEmail}</span>.
        </span>
      </div>
      <form action={stopImpersonatingAction}>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-50 transition hover:bg-amber-950"
        >
          <SignOutIcon size={12} weight="bold" /> Volver a {originalEmail}
        </button>
      </form>
    </div>
  );
}
