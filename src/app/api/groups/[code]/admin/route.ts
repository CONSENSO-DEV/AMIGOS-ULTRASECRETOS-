import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/session'
import { publicGroup, publicParticipant } from '@/lib/group-state'
import { generateGroupCode } from '@/lib/codes'

/** GET /api/groups/[code]/admin - dashboard info */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params
  const auth = await getAdminFromRequest(req)
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'No autenticado como administrador' },
      { status: 401 }
    )
  }
  const { group } = auth
  if (group.code !== code) {
    return NextResponse.json(
      { ok: false, error: 'Grupo incorrecto' },
      { status: 403 }
    )
  }
  const participants = await db.participant.findMany({
    where: { groupId: group.id },
    orderBy: { joinedAt: 'asc' },
  })
  const messageCount = await db.message.count({ where: { groupId: group.id } })
  return NextResponse.json({
    ok: true,
    group: publicGroup(group),
    organizerName: group.organizerName,
    participants: participants.map((p) => ({
      ...publicParticipant(p),
      active: p.active,
    })),
    participantCount: participants.filter((p) => p.active).length,
    messageCount,
  })
}

const UpdateSchema = z.object({
  name: z.string().min(3).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
  presentationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  presentationTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z
    .enum(['REGISTRATION', 'ACTIVE', 'LOCKED', 'REVEAL', 'FINISHED'])
    .optional(),
})

/** PATCH /api/groups/[code]/admin - update group settings */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params
  const auth = await getAdminFromRequest(req)
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'No autenticado como administrador' },
      { status: 401 }
    )
  }
  const { group } = auth
  if (group.code !== code) {
    return NextResponse.json(
      { ok: false, error: 'Grupo incorrecto' },
      { status: 403 }
    )
  }
  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }
  const updated = await db.group.update({
    where: { id: group.id },
    data: parsed.data,
  })
  return NextResponse.json({ ok: true, group: publicGroup(updated) })
}

/** DELETE /api/groups/[code]/admin?participantId=... - kick participant */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params
  const auth = await getAdminFromRequest(req)
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'No autenticado como administrador' },
      { status: 401 }
    )
  }
  const { group } = auth
  if (group.code !== code) {
    return NextResponse.json(
      { ok: false, error: 'Grupo incorrecto' },
      { status: 403 }
    )
  }
  const url = new URL(req.url)
  const participantId = url.searchParams.get('participantId')
  if (!participantId) {
    return NextResponse.json(
      { ok: false, error: 'Falta participantId' },
      { status: 400 }
    )
  }
  // Deactivate (we don't fully delete to preserve messages & guesses integrity, but mark inactive)
  await db.participant.update({
    where: { id: participantId },
    data: { active: false },
  })
  return NextResponse.json({ ok: true })
}

/** PUT /api/groups/[code]/admin?action=... - special actions */
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params
  const auth = await getAdminFromRequest(req)
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'No autenticado como administrador' },
      { status: 401 }
    )
  }
  const { group } = auth
  if (group.code !== code) {
    return NextResponse.json(
      { ok: false, error: 'Grupo incorrecto' },
      { status: 403 }
    )
  }
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (action === 'regenerate-code') {
    let newCode = generateGroupCode()
    let tries = 0
    while (await db.group.findUnique({ where: { code: newCode } })) {
      newCode = generateGroupCode()
      tries++
      if (tries > 10) break
    }
    const updated = await db.group.update({
      where: { id: group.id },
      data: { code: newCode },
    })
    return NextResponse.json({ ok: true, group: publicGroup(updated) })
  }

  if (action === 'force-reveal') {
    const updated = await db.group.update({
      where: { id: group.id },
      data: { status: 'REVEAL' },
    })
    return NextResponse.json({ ok: true, group: publicGroup(updated) })
  }

  if (action === 'lock-registration') {
    const updated = await db.group.update({
      where: { id: group.id },
      data: { status: 'LOCKED' },
    })
    return NextResponse.json({ ok: true, group: publicGroup(updated) })
  }

  if (action === 'open-registration') {
    const updated = await db.group.update({
      where: { id: group.id },
      data: { status: 'REGISTRATION' },
    })
    return NextResponse.json({ ok: true, group: publicGroup(updated) })
  }

  return NextResponse.json(
    { ok: false, error: 'Acción desconocida' },
    { status: 400 }
  )
}
