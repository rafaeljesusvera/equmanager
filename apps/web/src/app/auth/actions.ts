'use server';

import { createAdminClient, createServerClient } from '@equmanager/auth';
import { redirect } from 'next/navigation';
import {
  clearImpersonationFlag,
  getImpersonationFrom,
} from '@/lib/impersonation';

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect('/app');
}

/**
 * Signup directo sin confirmación de email: creamos el usuario con
 * `email_confirm: true` usando la service role key y a continuación
 * iniciamos sesión con el cliente SSR. Cuando vayamos a producción real
 * volveremos a activar la doble verificación.
 */
export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('fullName') ?? '').trim();

  if (!email || password.length < 8) {
    redirect('/signup?error=' + encodeURIComponent('Email o contraseña inválidos'));
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  if (!data?.user) {
    redirect('/signup?error=' + encodeURIComponent('No se pudo crear la cuenta'));
  }

  // Inicia sesión inmediatamente con el cliente SSR para que las cookies
  // queden establecidas en la respuesta.
  const supabase = await createServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    redirect(`/login?error=${encodeURIComponent(signInError.message)}`);
  }

  redirect('/onboarding');
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  await clearImpersonationFlag();
  redirect('/login');
}

/**
 * Vuelve a la cuenta original del que inició la impersonación. Lee el
 * email guardado en la cookie, genera un magic link admin para esa
 * cuenta y verifica el OTP para reestablecer la sesión original.
 */
export async function stopImpersonatingAction() {
  const originalEmail = await getImpersonationFrom();
  if (!originalEmail) redirect('/app');

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: originalEmail,
  });
  if (error || !data?.properties?.hashed_token) {
    await clearImpersonationFlag();
    redirect(
      `/login?error=${encodeURIComponent(error?.message ?? 'No se pudo restaurar tu cuenta.')}`,
    );
  }

  const supabase = await createServerClient();
  await supabase.auth.signOut();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: 'magiclink',
  });
  await clearImpersonationFlag();
  if (verifyError) {
    redirect(`/login?error=${encodeURIComponent(verifyError.message)}`);
  }

  redirect('/app');
}
