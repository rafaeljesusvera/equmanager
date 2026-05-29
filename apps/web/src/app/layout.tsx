import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastHost } from '@/components/ui/Toast';
import { NavProgress } from '@/components/shell/NavProgress';
import { ChunkErrorReloader } from '@/components/shell/ChunkErrorReloader';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Equmanager',
    template: '%s · Equmanager',
  },
  description:
    'Plataforma todo-en-uno para hípicas, propietarios, mozos y alumnos. Clases, eventos, cuidados, bonos e IA en un mismo sitio.',
  icons: { icon: '/em_fav.png' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-stone-50 font-sans text-stone-900 antialiased">
        <ChunkErrorReloader />
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
