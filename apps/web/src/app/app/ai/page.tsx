import { redirect } from 'next/navigation';
import { SparkleIcon } from '@phosphor-icons/react/dist/ssr';
import { ensureSession } from '@/lib/db';
import { Badge } from '@/components/ui';
import { AiChat } from './AiChat';

export const metadata = { title: 'Asistente IA' };
export const dynamic = 'force-dynamic';

export default async function AiPage() {
  const session = await ensureSession();
  const role = session.primary.role;

  if (['rider', 'horse_owner', 'provider'].includes(role)) {
    redirect('/app');
  }

  const aiOn = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="flex flex-1 flex-col min-h-0 h-full">
      {/* Header compacto */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:px-8">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            Equmanager
          </div>
          <h1 className="text-base font-bold text-stone-900">Asistente IA</h1>
        </div>
        <Badge tone={aiOn ? 'success' : 'warn'}>
          <SparkleIcon size={11} weight="bold" />
          {aiOn ? 'Claude conectado' : 'Sin configurar'}
        </Badge>
      </div>

      <AiChat />
    </div>
  );
}
