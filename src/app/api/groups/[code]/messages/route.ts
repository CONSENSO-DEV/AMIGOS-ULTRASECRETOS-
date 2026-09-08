import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getParticipantFromRequest } from '@/lib/session'
import { getEffectiveGroupStatus, publicParticipant } from '@/lib/group-state'

const MAX_MESSAGE_LENGTH = 500
const MIN_MESSAGE_LENGTH = 1

/** GET /api/groups/[code]/messages - list messages (with public participant info) */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params
  const group = await db.group.findFirst({ where: { code } })
  if (!group) {
    return NextResponse.json(
      { ok: false, error: 'Grupo no encontrado' },
      { status: 404 }
    )
  }
  const url = new URL(req.url)
  const afterId = url.searchParams.get('afterId')
  // Fetch last 200 messages
  let messages: any[] = await db.message.findMany({
    where: { groupId: group.id },
    orderBy: { createdAt: 'asc' },
    take: 200,
    include: { participant: true },
  })
  if (afterId) {
    const idx = messages.findIndex((m) => m.id === afterId)
    if (idx >= 0) {
      messages = messages.slice(idx + 1)
    } else {
      // unknown afterId, return all
    }
  }
  return NextResponse.json({
    ok: true,
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      participant: publicParticipant(m.participant),
    })),
  })
}

/** POST /api/groups/[code]/messages - send a message */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params
  const auth = await getParticipantFromRequest(req)
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'No autenticado' },
      { status: 401 }
    )
  }
  const { group, participant } = auth
  if (group.code !== code) {
    return NextResponse.json(
      { ok: false, error: 'Grupo incorrecto' },
      { status: 403 }
    )
  }
  const status = await getEffectiveGroupStatus(group)
  if (status === 'FINISHED') {
    return NextResponse.json(
      { ok: false, error: 'El juego ya terminó' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => null)
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  if (content.length < MIN_MESSAGE_LENGTH) {
    return NextResponse.json(
      { ok: false, error: 'Mensaje vacío' },
      { status: 400 }
    )
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Mensaje demasiado largo (máx ${MAX_MESSAGE_LENGTH} caracteres)` },
      { status: 400 }
    )
  }

  // Simple anti-spam: max 5 messages per 5 seconds per participant
  const recentMessages = await db.message.findMany({
    where: {
      participantId: participant.id,
      createdAt: { gte: new Date(Date.now() - 5000) },
    },
  })
  if (recentMessages.length >= 5) {
    return NextResponse.json(
      { ok: false, error: 'Estás enviando mensajes muy rápido. Espera unos segundos.' },
      { status: 429 }
    )
  }

  const message = await db.message.create({
    data: {
      groupId: group.id,
      participantId: participant.id,
      content,
    },
    include: { participant: true },
  })

  return NextResponse.json({
    ok: true,
    message: {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      participant: publicParticipant(message.participant),
    },
  })
}

/** DELETE /api/groups/[code]/messages?id=<messageId> - delete own message or (admin) any */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params
  const auth = await getParticipantFromRequest(req)
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'No autenticado' },
      { status: 401 }
    )
  }
  const { group, participant } = auth
  if (group.code !== code) {
    return NextResponse.json(
      { ok: false, error: 'Grupo incorrecto' },
      { status: 403 }
    )
  }

  const url = new URL(req.url)
  const messageId = url.searchParams.get('id')
  if (!messageId) {
    return NextResponse.json(
      { ok: false, error: 'Falta id del mensaje' },
      { status: 400 }
    )
  }

  const message = await db.message.findFirst({
    where: { id: messageId, groupId: group.id },
  })
  if (!message) {
    return NextResponse.json(
      { ok: false, error: 'Mensaje no encontrado' },
      { status: 404 }
    )
  }
  if (message.participantId !== participant.id) {
    return NextResponse.json(
      { ok: false, error: 'No puedes eliminar un mensaje ajeno' },
      { status: 403 }
    )
  }
  await db.message.delete({ where: { id: message.id } })
  return NextResponse.json({ ok: true })
}
