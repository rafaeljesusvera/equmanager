'use client';

import { useMemo, useState } from 'react';
import { CalendarBlankIcon, SparkleIcon } from '@phosphor-icons/react/dist/ssr';
import { Field, Input, Select } from '@/components/ui';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDelete';
import { generateCourseSessionsAction } from '@/app/app/courses/actions';

const WEEKDAYS = [
  { value: 1, label: 'L', long: 'Lunes' },
  { value: 2, label: 'M', long: 'Martes' },
  { value: 3, label: 'X', long: 'Miércoles' },
  { value: 4, label: 'J', long: 'Jueves' },
  { value: 5, label: 'V', long: 'Viernes' },
  { value: 6, label: 'S', long: 'Sábado' },
  { value: 0, label: 'D', long: 'Domingo' },
];

/**
 * Genera previa local del número de sesiones que se crearán según los
 * filtros, y dispara la server action al confirmar.
 */
export function SessionGenerator({
  courseId,
  defaultStart,
  defaultEnd,
  hasExistingSessions,
}: {
  courseId: string;
  defaultStart?: string | null;
  defaultEnd?: string | null;
  hasExistingSessions?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(defaultStart ?? today);
  const [endDate, setEndDate] = useState(
    defaultEnd ?? new Date(Date.now() + 56 * 86400000).toISOString().slice(0, 10),
  );
  const [time, setTime] = useState('17:30');
  const [duration, setDuration] = useState(60);
  const [days, setDays] = useState<number[]>([3]); // miércoles

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  }

  const preview = useMemo(() => {
    if (!startDate || !endDate || days.length === 0) return 0;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start)
      return 0;
    let n = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      if (days.includes(cursor.getDay())) n++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return n;
  }, [startDate, endDate, days]);

  return (
    <form
      action={generateCourseSessionsAction}
      className="rounded-2xl border border-brand-200 bg-brand-50/40 p-5"
    >
      <input type="hidden" name="courseId" value={courseId} />
      {days.map((d) => (
        <input key={d} type="hidden" name="weekdays" value={d} />
      ))}

      <div className="mb-3 flex items-center gap-2 text-brand-800">
        <SparkleIcon size={16} weight="duotone" />
        <h3 className="text-sm font-bold uppercase tracking-[0.18em]">
          Generador automático
        </h3>
      </div>
      <p className="mb-4 text-xs font-medium text-stone-600">
        Indica el rango y los días de la semana. Crearemos una sesión por cada
        fecha que caiga en esos días.
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <Field label="Inicio">
            <Input
              required
              type="date"
              name="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Fin">
            <Input
              required
              type="date"
              name="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Hora">
          <Input
            required
            type="time"
            name="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Field>
        <Field label="Duración (min)">
          <Input
            type="number"
            min={15}
            max={300}
            name="duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </Field>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-600">
          Días de la semana
        </p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => {
            const active = days.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition ${
                  active
                    ? 'bg-brand-700 text-white shadow-card'
                    : 'border border-stone-300 bg-white text-stone-700 hover:border-brand-400'
                }`}
                title={d.long}
                aria-pressed={active}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-stone-200">
        <div className="flex items-center gap-2 text-sm">
          <CalendarBlankIcon size={18} weight="duotone" className="text-brand-700" />
          <span className="font-bold text-stone-900">
            {preview === 0
              ? 'Selecciona fechas y días para ver cuántas sesiones se crearán'
              : `Se crearán ${preview} sesión${preview === 1 ? '' : 'es'}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Field label="Si ya hay sesiones">
            <Select name="mode" defaultValue={hasExistingSessions ? 'append' : 'replace'}>
              <option value="append">Añadir a las existentes</option>
              <option value="replace">Reemplazar todas</option>
            </Select>
          </Field>
          {hasExistingSessions ? (
            <ConfirmDeleteButton
              variant="button"
              action={generateCourseSessionsAction}
              hidden={{
                courseId,
                startDate,
                endDate,
                time,
                duration: String(duration),
                mode: 'append',
                ...Object.fromEntries(
                  days.map((d, i) => [`weekdays_${i}`, String(d)]),
                ),
              }}
              triggerLabel={
                preview === 0
                  ? 'Generar sesiones'
                  : `Generar ${preview} sesión${preview === 1 ? '' : 'es'}`
              }
              triggerClassName="bg-brand-700 hover:bg-brand-600"
              title="Generar sesiones"
              description="Vas a añadir sesiones al curso. Si has elegido 'Reemplazar todas', las anteriores se eliminarán."
              confirmLabel="Sí, generar"
            />
          ) : (
            <button
              type="submit"
              disabled={preview === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-card transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SparkleIcon size={14} weight="bold" />
              {preview === 0 ? 'Generar' : `Generar ${preview}`}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
