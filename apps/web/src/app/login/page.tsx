import Link from 'next/link';
import { signInWithPassword } from '../auth/actions';
import { LogoMark } from '@/components/brand/Logo';
import { Button, Field, Input } from '@/components/ui';

export const metadata = { title: 'Iniciar sesión' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="bg-mesh flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex flex-col items-center"
          aria-label="Equmanager"
        >
          <LogoMark size={60} />
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
            Bienvenido de vuelta
          </p>
        </Link>

        <div className="surface-glass p-7">
          <h1 className="font-display text-4xl font-normal leading-[1] tracking-tightest text-stone-900">
            Entra a tu cuenta
          </h1>
          <p className="mt-2 text-sm font-medium text-stone-500">
            Accede a tu panel con tu correo.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <form action={signInWithPassword} className="mt-6 space-y-3">
            <Field label="Email">
              <Input
                required
                type="email"
                name="email"
                placeholder="tu@correo.com"
              />
            </Field>
            <Field label="Contraseña">
              <Input required type="password" name="password" minLength={6} />
            </Field>
            <Button type="submit" size="lg" className="mt-2 w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-stone-500">
            ¿No tienes cuenta?{' '}
            <Link
              href="/signup"
              className="font-bold uppercase tracking-[0.14em] text-brand-700 hover:text-brand-900"
            >
              Crear una
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-stone-400">
          <Link href="/" className="hover:text-brand-700">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
