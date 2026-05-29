'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HorseIcon,
  MicrophoneStageIcon,
  CertificateIcon,
  GraduationCapIcon,
  ClipboardTextIcon,
  StethoscopeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';

type Profile = {
  key: string;
  label: string;
  short: string;
  icon: React.ReactNode;
  steps: Array<{ title: string; body: React.ReactNode }>;
  next: Array<{ label: string; href: string }>;
};

const PROFILES: Profile[] = [
  {
    key: 'owner',
    label: 'Propietario de hípica',
    short: 'Dueño del centro',
    icon: <HorseIcon size={20} weight="duotone" />,
    steps: [
      {
        title: 'Crea tu cuenta',
        body: (
          <>
            Pulsa{' '}
            <Link href="/signup" className="font-bold text-brand-700">
              Crear cuenta
            </Link>{' '}
            y registra tu email y una contraseña. Te pedimos solo nombre,
            email y contraseña.
          </>
        ),
      },
      {
        title: 'Elige “Soy propietario de hípica”',
        body: 'En el onboarding tienes cuatro perfiles. El tuyo es el primero.',
      },
      {
        title: 'Busca tu centro en el padrón',
        body: (
          <>
            Empieza a escribir el nombre. Si tu hípica está federada (RFHE o
            autonómica) la encontramos al instante. Pulsa la sugerencia, así
            quedará <strong>vinculada al padrón oficial</strong> y te
            rellenamos teléfono, web y dirección.
          </>
        ),
      },
      {
        title: 'Pulsa “Crear hípica y entrar”',
        body: 'Te creamos el espacio con plantilla de cuidados, calendario y un primer caballo demo. Listo.',
      },
      {
        title: 'Sube tu logo en Ajustes del centro',
        body: 'Y comprueba que email, teléfono y web son correctos. Estos datos se ven en bonos, eventos e insignias.',
      },
      {
        title: 'Da de alta a tu equipo',
        body: (
          <>
            En <strong>Equipo</strong> añades a tus monitores y mozos por
            email. Si no tienen cuenta, les llega una invitación
            automáticamente.
          </>
        ),
      },
    ],
    next: [
      { label: 'Crear cuenta', href: '/signup' },
      { label: 'Ajustes del centro', href: '/app/club-settings' },
      { label: 'Equipo', href: '/app/staff' },
    ],
  },
  {
    key: 'instructor',
    label: 'Monitor o profesor',
    short: 'Doy clases',
    icon: <MicrophoneStageIcon size={20} weight="duotone" />,
    steps: [
      {
        title: 'Crea tu cuenta',
        body: (
          <>
            Pulsa{' '}
            <Link href="/signup" className="font-bold text-brand-700">
              Crear cuenta
            </Link>
            . Si ya te invitó el propietario de tu centro, entra con el email
            de la invitación.
          </>
        ),
      },
      {
        title: 'Elige “Soy monitor o profesor”',
        body: 'En el onboarding aparece como segunda opción.',
      },
      {
        title: 'Selecciona los centros donde impartes clase',
        body: (
          <>
            Puedes seleccionar <strong>uno o varios</strong>. Cada uno se
            añade como una etiqueta verde. Al darle a “Unirme”, todos los
            centros quedan conectados a tu cuenta.
          </>
        ),
      },
      {
        title: 'Programa tu primera clase',
        body: (
          <>
            Ve a <strong>Clases</strong>, crea la primera y añade alumnos.
            Puedes reutilizar plantillas si das siempre las mismas clases.
          </>
        ),
      },
      {
        title: 'Prueba la Bandeja IA',
        body: 'Termina la clase, abre la app, graba una nota de voz “Lucía muy bien en el galope, Marcos cuidar mano izquierda…” y la IA reparte el feedback por alumno.',
      },
    ],
    next: [
      { label: 'Crear cuenta', href: '/signup' },
      { label: 'Mis clases', href: '/app/lessons' },
      { label: 'Bandeja IA', href: '/app/ai' },
    ],
  },
  {
    key: 'horse_owner',
    label: 'Propietario de caballo',
    short: 'Tengo caballo en pupilaje',
    icon: <CertificateIcon size={20} weight="duotone" />,
    steps: [
      {
        title: 'Crea tu cuenta',
        body: (
          <>
            Si tu hípica ya está en Equmanager, lo más cómodo es que
            pidas al propietario que añada tu email como propietario del
            caballo. Si quieres adelantarte:{' '}
            <Link href="/signup" className="font-bold text-brand-700">
              crea cuenta
            </Link>
            .
          </>
        ),
      },
      {
        title: 'Elige “Soy propietario de un caballo”',
        body: 'Es la tercera opción del onboarding.',
      },
      {
        title: 'Selecciona los centros donde tienes caballos',
        body: 'Multi-selección: si tienes caballos en dos hípicas distintas, añade ambas. Aparecerán como etiquetas verdes.',
      },
      {
        title: 'Espera a que tu hípica te marque como propietario',
        body: 'En cuanto te asigne el caballo, lo verás en “Mis caballos” con su agenda, los cuidados diarios del mozo y el historial de montura.',
      },
      {
        title: 'Activa avisos en tiempo real',
        body: 'Si vas al perfil podrás elegir recibir email o push cuando cambie algo importante (cojera, cita confirmada, cuidados sin completar).',
      },
    ],
    next: [
      { label: 'Crear cuenta', href: '/signup' },
      { label: 'Mis caballos (cuando estés dentro)', href: '/app/horse-owner' },
    ],
  },
  {
    key: 'rider',
    label: 'Alumno o corredor',
    short: 'Monto en clases o compito',
    icon: <GraduationCapIcon size={20} weight="duotone" />,
    steps: [
      {
        title: 'Crea tu cuenta',
        body: (
          <>
            En menos de un minuto desde{' '}
            <Link href="/signup" className="font-bold text-brand-700">
              Crear cuenta
            </Link>
            . Te pedimos solo nombre completo, email y contraseña.
          </>
        ),
      },
      {
        title: 'Elige “Soy alumno o corredor”',
        body: 'En el onboarding aparece como cuarta opción.',
      },
      {
        title: 'Busca tu hípica',
        body: (
          <>
            Empieza a escribir el nombre del centro. Te aparecen
            sugerencias del padrón. <strong>Selecciona la tuya</strong> y
            pulsa “Unirme a este centro”.
          </>
        ),
      },
      {
        title: 'Mira tu home',
        body: 'Verás tu colección de insignias, tus próximas clases, los caballos en los que has montado ordenados por afinidad y la última nota del instructor.',
      },
      {
        title: 'Apúntate a cursos y eventos',
        body: 'Desde “Cursos” y “Eventos” puedes inscribirte con un toque. El club te confirma la plaza desde su panel.',
      },
    ],
    next: [
      { label: 'Crear cuenta', href: '/signup' },
      { label: 'Mi panel', href: '/app/me' },
      { label: 'Cursos disponibles', href: '/app/me/courses' },
    ],
  },
  {
    key: 'groom',
    label: 'Mozo de cuadra',
    short: 'Cuido los caballos',
    icon: <ClipboardTextIcon size={20} weight="duotone" />,
    steps: [
      {
        title: 'Crea tu cuenta',
        body: (
          <>
            Si el propietario ya te invitó, entra con el email de la
            invitación. Si no:{' '}
            <Link href="/signup" className="font-bold text-brand-700">
              crea cuenta
            </Link>
            .
          </>
        ),
      },
      {
        title: 'Elige “Soy mozo de cuadra”',
        body: 'Es la quinta opción del onboarding.',
      },
      {
        title: 'Selecciona los centros donde trabajas',
        body: 'Multi-selección. Si trabajas en dos cuadras, añade ambas y verás las tareas separadas por centro.',
      },
      {
        title: 'Abre “Mi día”',
        body: 'Tus caballos asignados del día con el checklist (alimentación, agua, cepillado, paddock…). Cada check llega al propietario al instante.',
      },
      {
        title: 'Apunta cualquier incidencia',
        body: 'En el mismo checklist tienes un campo de “Notas” por tarea para añadir un detalle (cojera leve, comida rechazada, etc.).',
      },
    ],
    next: [
      { label: 'Crear cuenta', href: '/signup' },
      { label: 'Mi día (mozo)', href: '/app/groom' },
    ],
  },
  {
    key: 'provider',
    label: 'Proveedor',
    short: 'Veterinario, herrador, dentista, fisio…',
    icon: <StethoscopeIcon size={20} weight="duotone" />,
    steps: [
      {
        title: 'Crea tu cuenta',
        body: (
          <>
            Desde{' '}
            <Link href="/signup" className="font-bold text-brand-700">
              Crear cuenta
            </Link>{' '}
            con tu email profesional. Te creamos el espacio para tu agenda.
          </>
        ),
      },
      {
        title: 'Elige “Soy proveedor”',
        body: 'Última opción del onboarding. Es la específica para profesionales que visitan varios centros.',
      },
      {
        title: 'Selecciona los centros con los que trabajas',
        body: (
          <>
            Multi-selección de hípicas. Por cada una creamos tu acceso al
            club, manteniendo una <strong>única agenda unificada</strong> que
            las cruza todas.
          </>
        ),
      },
      {
        title: 'Completa tu ficha profesional',
        body: (
          <>
            En <strong>Mi agenda</strong> rellenas tu especialidad
            (veterinario, herrador, dentista, fisio, nutrición, transporte,
            seguros…), nombre comercial, teléfono y notas con tus servicios.
            Los propietarios la ven al pedirte una visita.
          </>
        ),
      },
      {
        title: 'Recibe tu primera visita',
        body: 'Cuando un propietario te asigne a un caballo en su agenda de cuidados, aparecerá en tu panel con el detalle del centro y la hora.',
      },
    ],
    next: [
      { label: 'Crear cuenta', href: '/signup' },
      { label: 'Mi agenda', href: '/app/provider' },
    ],
  },
];

export function ProfileTabs() {
  const [active, setActive] = useState(PROFILES[0]!.key);
  const profile = PROFILES.find((p) => p.key === active) ?? PROFILES[0]!;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
        {PROFILES.map((p) => {
          const isActive = p.key === active;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setActive(p.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                isActive
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              <span
                className={`${
                  isActive ? 'text-white' : 'text-brand-700'
                }`}
              >
                {p.icon}
              </span>
              {p.label}
            </button>
          );
        })}
      </div>

      <p className="mt-6 max-w-2xl text-sm font-medium text-stone-600">
        Pasos para empezar como{' '}
        <span className="font-bold text-brand-700">{profile.short}</span>.
      </p>

      <ol className="mt-5 space-y-3">
        {profile.steps.map((s, i) => (
          <li
            key={i}
            className="flex gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-card"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {i + 1}
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">{s.title}</h3>
              <div className="mt-1 text-sm font-medium leading-relaxed text-stone-700">
                {s.body}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
        <div className="flex items-center gap-2 text-emerald-800">
          <CheckCircleIcon size={18} weight="fill" />
          <h4 className="text-sm font-bold uppercase tracking-[0.18em]">
            Atajos
          </h4>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.next.map((n) => (
            <Link
              key={n.href}
              href={n.href as never}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-900 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
            >
              {n.label}
              <ArrowRightIcon size={12} weight="bold" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
