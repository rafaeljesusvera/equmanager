import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, asc, eq, ne } from 'drizzle-orm';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import { ensureSession } from '@/lib/db';
import { Avatar } from '@/components/ui';
import { MessageTime } from '../MessageTime';
import { SendMessageForm } from '../SendMessageForm';

export const dynamic = 'force-dynamic';

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await ensureSession();
  const { id } = await params;

  const [me] = await db
    .select()
    .from(schema.threadParticipants)
    .where(
      and(
        eq(schema.threadParticipants.threadId, id),
        eq(schema.threadParticipants.profileId, session.user.id),
      ),
    )
    .limit(1);
  if (!me) notFound();

  const [thread] = await db
    .select()
    .from(schema.messageThreads)
    .where(eq(schema.messageThreads.id, id))
    .limit(1);
  if (!thread) notFound();

  const others = await db
    .select({
      profileId: schema.profiles.id,
      fullName: schema.profiles.fullName,
      email: schema.profiles.email,
      avatarUrl: schema.profiles.avatarUrl,
    })
    .from(schema.threadParticipants)
    .innerJoin(
      schema.profiles,
      eq(schema.profiles.id, schema.threadParticipants.profileId),
    )
    .where(
      and(
        eq(schema.threadParticipants.threadId, id),
        ne(schema.threadParticipants.profileId, session.user.id),
      ),
    );

  const msgs = await db
    .select({
      id: schema.messages.id,
      body: schema.messages.body,
      createdAt: schema.messages.createdAt,
      senderId: schema.messages.senderId,
      senderName: schema.profiles.fullName,
      senderAvatar: schema.profiles.avatarUrl,
    })
    .from(schema.messages)
    .leftJoin(schema.profiles, eq(schema.profiles.id, schema.messages.senderId))
    .where(eq(schema.messages.threadId, id))
    .orderBy(asc(schema.messages.createdAt));

  await db
    .update(schema.threadParticipants)
    .set({ lastReadAt: new Date() })
    .where(eq(schema.threadParticipants.id, me.id));

  const title =
    thread.title ??
    others.map((o) => o.fullName ?? o.email).join(', ') ??
    'Conversación';

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 md:p-10">
      <Link
        href="/app/messages"
        className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
      >
        <ArrowLeftIcon size={12} weight="bold" /> Mensajes
      </Link>

      <header className="flex items-center gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-card">
        <Avatar name={title} src={others[0]?.avatarUrl ?? null} size="md" />
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-stone-900">
            {title}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            {thread.kind === 'broadcast' ? 'Anuncio' : 'Conversación'}
          </p>
        </div>
      </header>

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto rounded-3xl border border-stone-200 bg-stone-50 p-4">
        {msgs.length === 0 && (
          <p className="text-center text-sm font-medium text-stone-500">
            Sin mensajes aún.
          </p>
        )}
        {msgs.map((m) => {
          const mine = m.senderId === session.user.id;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                  mine
                    ? 'bg-brand-700 text-white'
                    : 'bg-white text-stone-900 ring-1 ring-stone-200'
                }`}
              >
                {!mine && (
                  <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest opacity-70">
                    {m.senderName ?? '—'}
                  </div>
                )}
                <div className="text-sm font-medium">{m.body}</div>
                <div className="mt-0.5 text-right text-[10px] opacity-60">
                  <MessageTime date={m.createdAt} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <SendMessageForm threadId={id} />
    </div>
  );
}
