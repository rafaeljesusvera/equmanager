'use client';

import { useState } from 'react';
import { Field, Input, Textarea } from '@/components/ui';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { BadgeColorPicker } from './BadgeColorPicker';
import { BadgeCard } from './BadgeCard';

/**
 * Editor con preview en vivo. Mantiene el state de los campos visuales
 * y dibuja la carta a la derecha mientras el usuario escribe.
 */
export function BadgeLiveEditor({
  clubName,
  defaultValues = {},
  showDescription = true,
}: {
  clubName: string;
  defaultValues?: {
    name?: string;
    subtitle?: string | null;
    categoryLabel?: string | null;
    description?: string | null;
    color?: string | null;
    iconUrl?: string | null;
  };
  showDescription?: boolean;
}) {
  const [name, setName] = useState(defaultValues.name ?? '');
  const [subtitle, setSubtitle] = useState(defaultValues.subtitle ?? '');
  const [categoryLabel, setCategoryLabel] = useState(
    defaultValues.categoryLabel ?? '',
  );
  const [color, setColor] = useState(defaultValues.color ?? '#3f8649');
  const [iconUrl] = useState(defaultValues.iconUrl ?? null);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <Field label="Título grande" hint="Sale en mayúsculas en la carta.">
          <Input
            required
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mentalidad ganadora"
            maxLength={40}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field
            label="Subtítulo / etiqueta"
            hint='Chip dorado, p. ej. "Mejor salto".'
          >
            <Input
              name="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Mejor salto"
              maxLength={40}
            />
          </Field>
          <Field
            label="Categoría"
            hint='Línea inferior, p. ej. "U10 | Iniciación".'
          >
            <Input
              name="categoryLabel"
              value={categoryLabel}
              onChange={(e) => setCategoryLabel(e.target.value)}
              placeholder="U10 | Iniciación"
              maxLength={40}
            />
          </Field>
        </div>
        {showDescription && (
          <Field
            label="Cómo desbloquearla"
            hint="Lo verán los alumnos que aún no la tengan, como objetivo a conseguir."
          >
            <Textarea
              name="description"
              rows={3}
              defaultValue={defaultValues.description ?? ''}
              placeholder='Ej.: "Completa 10 clases seguidas sin faltas y demuestra galope estable en pista cubierta."'
            />
          </Field>
        )}
        <BadgeColorPicker
          name="color"
          defaultValue={color}
          onChange={setColor}
        />
        <PhotoUpload
          name="iconUrl"
          folder="badges"
          defaultValue={defaultValues.iconUrl ?? undefined}
          label="Imagen del medallón"
        />
      </div>

      <div className="sticky top-24 self-start">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          Vista previa
        </p>
        <BadgeCard
          clubName={clubName}
          recipientName="Alumno demo"
          badge={{
            name: name || 'Nombre de la insignia',
            subtitle: subtitle || null,
            categoryLabel: categoryLabel || null,
            color,
            iconUrl,
          }}
        />
      </div>
    </div>
  );
}
