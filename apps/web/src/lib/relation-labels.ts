/**
 * Etiquetas legibles para los tipos de relación de profile_links.
 * En módulo neutro (sin 'use client' ni 'server only') para poder
 * importarse desde server y client components indistintamente.
 */
const RELATION_LABEL: Record<string, string> = {
  self: 'Yo',
  padre: 'Padre',
  madre: 'Madre',
  tutor: 'Tutor/a',
  conyuge: 'Pareja',
  hijo: 'Hijo',
  hija: 'Hija',
  secretaria: 'Secretaría',
  asistente: 'Asistente',
  otro: 'Vinculada',
};

export function relationLabelFor(relation: string) {
  return RELATION_LABEL[relation] ?? 'Vinculada';
}
