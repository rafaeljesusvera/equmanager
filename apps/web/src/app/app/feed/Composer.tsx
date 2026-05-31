'use client';

import { useState } from 'react';
import { Button, Textarea, SubmitButton } from '@/components/ui';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { createPostAction } from './actions';

export function Composer() {
  const [body, setBody] = useState('');
  return (
    <form
      action={async (fd: FormData) => {
        await createPostAction(fd);
        setBody('');
      }}
      className="rounded-3xl border border-stone-200 bg-white p-4 shadow-card"
    >
      <Textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="¿Qué cuentas? Comparte tu última clase, una foto del caballo…"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="max-w-[140px]">
          <PhotoUpload name="photoUrl" folder="posts" label="Foto" />
        </div>
        <SubmitButton disabled={!body.trim()}>
          Publicar
        </SubmitButton>
      </div>
    </form>
  );
}
