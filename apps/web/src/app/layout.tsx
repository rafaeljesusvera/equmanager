import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { ToastHost } from '@/components/ui/Toast';
import { NavProgress } from '@/components/shell/NavProgress';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Equmanager',
    template: '%s · Equmanager',
  },
  description:
    'Plataforma todo-en-uno para hípicas, propietarios, mozos y alumnos. Clases, eventos, cuidados, bonos e IA en un mismo sitio.',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${display.variable}`}
    >
      <body className="min-h-screen bg-stone-50 font-sans text-stone-900 antialiased">
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
