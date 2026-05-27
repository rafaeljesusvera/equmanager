import { cookies } from 'next/headers';

const COOKIE = 'equm_imp_from';

/**
 * Marca que el usuario actual está "viendo como otro": guardamos el email
 * original para poder volver. Cookie httpOnly de 8h.
 */
export async function setImpersonationFlag(originalEmail: string) {
  const store = await cookies();
  store.set(COOKIE, originalEmail, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });
}

export async function clearImpersonationFlag() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getImpersonationFrom(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}
