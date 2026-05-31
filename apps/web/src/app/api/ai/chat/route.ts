/**
 * POST /api/ai/chat
 * Asistente conversacional que reconoce intenciones y ejecuta acciones
 * en el club (crear clase, dar de alta caballo, registrar cuidado, etc.)
 */
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@equmanager/auth';
import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import { loadSession } from '@/lib/db/profile';
import type { ClubRole, Discipline, HorseKind, EventKind } from '@equmanager/domain';
import { DISCIPLINES, HORSE_KINDS, EVENT_KINDS } from '@equmanager/domain';

export const dynamic = 'force-dynamic';

type Horse = { id: string; name: string };
type Rider = { id: string; name: string };

// ─── Utilidades ────────────────────────────────────────────────────────────

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function fuzzyFind<T extends { name: string }>(list: T[], query: string): T | undefined {
  const q = norm(query);
  return (
    list.find((x) => norm(x.name) === q) ??
    list.find((x) => norm(x.name).includes(q)) ??
    list.find((x) => q.includes(norm(x.name)))
  );
}

// ─── Herramientas por rol ───────────────────────────────────────────────────

function buildTools(role: ClubRole): Anthropic.Tool[] {
  const tools: Anthropic.Tool[] = [];

  if (['owner', 'admin', 'instructor'].includes(role)) {
    tools.push({
      name: 'create_lesson',
      description:
        'Crea una clase de equitación programada en el club. Úsala cuando el usuario quiera programar, añadir o dar de alta una clase.',
      input_schema: {
        type: 'object' as const,
        properties: {
          date: {
            type: 'string',
            description:
              'Fecha y hora de la clase en formato ISO 8601 con zona horaria, ej: 2026-06-01T10:00:00+02:00. Calcula a partir de la fecha de hoy proporcionada.',
          },
          discipline: {
            type: 'string',
            enum: DISCIPLINES as unknown as string[],
            description:
              'Disciplina: salto, doma, iniciacion, concurso_completo, raid u otros.',
          },
          durationMinutes: {
            type: 'number',
            description: 'Duración en minutos. Por defecto 60.',
          },
          notes: {
            type: 'string',
            description: 'Notas adicionales opcionales.',
          },
        },
        required: ['date', 'discipline'],
      },
    });
  }

  if (['owner', 'admin', 'instructor'].includes(role)) {
    tools.push({
      name: 'add_rider_feedback',
      description:
        'Añade un comentario/feedback a un jinete o alumno del club. Úsalo cuando el usuario quiera dejar un comentario sobre el rendimiento de un alumno.',
      input_schema: {
        type: 'object' as const,
        properties: {
          riderName: {
            type: 'string',
            description: 'Nombre del jinete/alumno (puede ser parcial, se buscará en la lista del club).',
          },
          feedback: {
            type: 'string',
            description: 'Texto del comentario o feedback para el alumno.',
          },
        },
        required: ['riderName', 'feedback'],
      },
    });
  }

  if (['owner', 'admin'].includes(role)) {
    tools.push({
      name: 'create_horse',
      description:
        'Da de alta un nuevo caballo en el club. Úsala cuando el usuario quiera registrar o añadir un caballo.',
      input_schema: {
        type: 'object' as const,
        properties: {
          name: { type: 'string', description: 'Nombre del caballo.' },
          kind: {
            type: 'string',
            enum: HORSE_KINDS as unknown as string[],
            description: 'Tipo: caballo, pony o shetland.',
          },
          breed: { type: 'string', description: 'Raza (opcional).' },
          birthYear: { type: 'number', description: 'Año de nacimiento (opcional).' },
          color: { type: 'string', description: 'Color o capa (opcional).' },
        },
        required: ['name', 'kind'],
      },
    });

    tools.push({
      name: 'create_event',
      description:
        'Crea un evento o concurso en el club. Úsalo cuando el usuario quiera programar un evento, concurso, salida o clinic.',
      input_schema: {
        type: 'object' as const,
        properties: {
          title: { type: 'string', description: 'Título del evento.' },
          kind: {
            type: 'string',
            enum: EVENT_KINDS as unknown as string[],
            description: 'Tipo: competicion, concurso_social, salida, clinic, charla u otros.',
          },
          startsAt: {
            type: 'string',
            description: 'Fecha y hora de inicio en ISO 8601, ej: 2026-06-15T09:00:00+02:00.',
          },
          description: { type: 'string', description: 'Descripción opcional.' },
          location: { type: 'string', description: 'Lugar opcional.' },
        },
        required: ['title', 'kind', 'startsAt'],
      },
    });
  }

  if (role === 'groom') {
    tools.push({
      name: 'log_horse_care',
      description:
        'Registra el cuidado diario de un caballo. Úsalo cuando el mozo quiera marcar que ha atendido o cuidado a un caballo.',
      input_schema: {
        type: 'object' as const,
        properties: {
          horseName: {
            type: 'string',
            description: 'Nombre del caballo (puede ser parcial).',
          },
          notes: {
            type: 'string',
            description: 'Notas u observaciones del cuidado realizado.',
          },
        },
        required: ['horseName', 'notes'],
      },
    });
  }

  return tools;
}

// ─── Prompt del sistema ─────────────────────────────────────────────────────

function buildSystemPrompt(ctx: {
  role: ClubRole;
  clubName: string;
  today: string;
  horses: Horse[];
  riders: Rider[];
}) {
  const roleDesc: Record<string, string> = {
    owner: 'propietario de la hípica con control total',
    admin: 'administrador del club',
    instructor: 'instructor/monitor de equitación',
    groom: 'mozo de cuadra',
  };

  const horsesList = ctx.horses.length
    ? ctx.horses.map((h) => `- ${h.name}`).join('\n')
    : '(sin caballos registrados)';

  const ridersList = ctx.riders.length
    ? ctx.riders.map((r) => `- ${r.name}`).join('\n')
    : '(sin jinetes registrados)';

  return `Eres el asistente de gestión de Equmanager para el club "${ctx.clubName}".
El usuario es ${roleDesc[ctx.role] ?? ctx.role}.
Fecha de hoy: ${ctx.today}.

Caballos del club:
${horsesList}

Jinetes/alumnos del club:
${ridersList}

Instrucciones:
- Responde siempre en español, de forma breve y directa.
- Cuando el usuario exprese una intención clara de realizar una acción, ejecuta la herramienta correspondiente sin pedir confirmación adicional.
- Si falta información esencial (ej: fecha de una clase), pregunta solo por eso.
- Después de ejecutar una acción, confirma brevemente qué hiciste.
- Si el usuario pregunta algo que no puedes hacer o no está en tus herramientas, explícalo amablemente.
- No inventes datos. Si no encuentras un jinete o caballo con el nombre indicado, dilo.`;
}

// ─── Ejecución de herramientas ──────────────────────────────────────────────

type ActionResult = {
  result: Record<string, unknown>;
  action: { type: string; summary: string; link?: string };
};

async function executeTool(
  toolUse: Anthropic.ToolUseBlock,
  ctx: {
    clubId: string;
    userId: string;
    horses: Horse[];
    riders: Rider[];
  },
): Promise<ActionResult> {
  const input = toolUse.input as Record<string, unknown>;

  switch (toolUse.name) {
    case 'create_lesson': {
      const date = new Date(String(input.date));
      const discipline = String(input.discipline) as Discipline;
      const durationMinutes = Number(input.durationMinutes) || 60;
      const notes = input.notes ? String(input.notes) : null;

      if (!DISCIPLINES.includes(discipline)) {
        return {
          result: { error: 'Disciplina no válida' },
          action: { type: 'error', summary: 'Disciplina no válida' },
        };
      }

      const [lesson] = await db.insert(schema.lessons).values({
        clubId: ctx.clubId,
        instructorId: ctx.userId,
        date,
        durationMinutes,
        discipline,
        notes,
      }).returning({ id: schema.lessons.id });

      return {
        result: { success: true, lessonId: lesson?.id },
        action: {
          type: 'lesson_created',
          summary: `Clase de ${discipline} creada el ${date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
          link: '/app/lessons',
        },
      };
    }

    case 'create_horse': {
      const name = String(input.name).trim();
      const kind = String(input.kind) as HorseKind;
      const breed = input.breed ? String(input.breed).trim() : null;
      const birthYear = input.birthYear ? Number(input.birthYear) : null;
      const color = input.color ? String(input.color).trim() : null;

      if (!name || !HORSE_KINDS.includes(kind)) {
        return {
          result: { error: 'Nombre o tipo inválido' },
          action: { type: 'error', summary: 'Nombre o tipo inválido' },
        };
      }

      const [horse] = await db.insert(schema.horses).values({
        clubId: ctx.clubId,
        name,
        kind,
        breed,
        birthYear,
        color,
      }).returning({ id: schema.horses.id });

      return {
        result: { success: true, horseId: horse?.id },
        action: {
          type: 'horse_created',
          summary: `${kind === 'pony' ? 'Pony' : 'Caballo'} "${name}" registrado en el club`,
          link: horse?.id ? `/app/horses/${horse.id}` : '/app/horses',
        },
      };
    }

    case 'create_event': {
      const title = String(input.title).trim();
      const kind = String(input.kind) as EventKind;
      const startsAt = new Date(String(input.startsAt));
      const description = input.description ? String(input.description) : null;
      const location = input.location ? String(input.location) : null;

      if (!title || !EVENT_KINDS.includes(kind)) {
        return {
          result: { error: 'Título o tipo inválido' },
          action: { type: 'error', summary: 'Título o tipo inválido' },
        };
      }

      const [event] = await db.insert(schema.events).values({
        clubId: ctx.clubId,
        title,
        kind,
        startsAt,
        description,
        location,
        createdBy: ctx.userId,
      }).returning({ id: schema.events.id });

      return {
        result: { success: true, eventId: event?.id },
        action: {
          type: 'event_created',
          summary: `Evento "${title}" creado para el ${startsAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`,
          link: '/app/events',
        },
      };
    }

    case 'add_rider_feedback': {
      const riderName = String(input.riderName);
      const feedbackText = String(input.feedback);

      const rider = fuzzyFind(ctx.riders, riderName);
      if (!rider) {
        return {
          result: { error: `No encontré ningún jinete llamado "${riderName}"` },
          action: { type: 'error', summary: `Jinete "${riderName}" no encontrado` },
        };
      }

      await db.insert(schema.lessonFeedback).values({
        riderId: rider.id,
        body: feedbackText,
        source: 'ia',
        createdBy: ctx.userId,
      });

      return {
        result: { success: true, riderId: rider.id },
        action: {
          type: 'feedback_added',
          summary: `Feedback enviado a ${rider.name}`,
          link: '/app/lessons',
        },
      };
    }

    case 'log_horse_care': {
      const horseName = String(input.horseName);
      const notes = String(input.notes);

      const horse = fuzzyFind(ctx.horses, horseName);
      if (!horse) {
        return {
          result: { error: `No encontré ningún caballo llamado "${horseName}"` },
          action: { type: 'error', summary: `Caballo "${horseName}" no encontrado` },
        };
      }

      const forDate = new Date().toISOString().slice(0, 10);
      await db.insert(schema.horseCareLogs).values({
        clubId: ctx.clubId,
        horseId: horse.id,
        groomId: ctx.userId,
        forDate,
        itemsDone: [],
        notes,
        completedAt: new Date(),
      });

      return {
        result: { success: true, horseId: horse.id },
        action: {
          type: 'care_logged',
          summary: `Cuidado de ${horse.name} registrado para hoy`,
          link: '/app/groom',
        },
      };
    }

    default:
      return {
        result: { error: 'Herramienta desconocida' },
        action: { type: 'error', summary: 'Acción no reconocida' },
      };
  }
}

// ─── Handler principal ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const session = await loadSession({ id: user.id, email: user.email });
  if (!session.primary) {
    return NextResponse.json({ error: 'Sin club activo' }, { status: 403 });
  }

  const role = session.primary.role;
  if (!['owner', 'admin', 'instructor', 'groom'].includes(role)) {
    return NextResponse.json({ error: 'Rol sin acceso al asistente' }, { status: 403 });
  }

  let body: { message: string; history?: Array<{ role: string; content: string }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { message, history = [] } = body;
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      reply: 'El asistente IA no está configurado en este entorno. Configura ANTHROPIC_API_KEY para activarlo.',
    });
  }

  const clubId = session.primary.clubId;

  const [horses, riders] = await Promise.all([
    db.select({ id: schema.horses.id, name: schema.horses.name })
      .from(schema.horses)
      .where(eq(schema.horses.clubId, clubId)),
    db.select({ id: schema.riders.id, name: schema.riders.name })
      .from(schema.riders)
      .where(eq(schema.riders.clubId, clubId)),
  ]);

  const tools = buildTools(role);
  const today = new Date().toISOString().slice(0, 10);
  const systemPrompt = buildSystemPrompt({
    role,
    clubName: session.primary.clubName,
    today,
    horses,
    riders,
  });

  const messages: Anthropic.MessageParam[] = [
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: tools.length > 0 ? tools : undefined,
    });

    if (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      if (!toolUseBlock) {
        return NextResponse.json({ reply: getText(response) });
      }

      const toolResult = await executeTool(toolUseBlock, {
        clubId,
        userId: user.id,
        horses,
        riders,
      });

      const finalResponse = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...messages,
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: JSON.stringify(toolResult.result),
              },
            ],
          },
        ],
        tools: tools.length > 0 ? tools : undefined,
      });

      return NextResponse.json({
        reply: getText(finalResponse),
        action: toolResult.action,
      });
    }

    return NextResponse.json({ reply: getText(response) });
  } catch (err) {
    console.error('[api/ai/chat] error:', err);
    return NextResponse.json({
      reply: 'Ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
    });
  }
}

function getText(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}
