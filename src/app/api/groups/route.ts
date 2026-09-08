import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  generateGroupCode,
  generateAdminCode,
  generatePersonalCode,
  hashToken,
  pickRandomAvatar,
} from '@/lib/codes'
import { publicGroup } from '@/lib/group-state'

const CreateGroupSchema = z.object({
  name: z.string().min(3, 'El nombre del grupo debe tener al menos 3 caracteres').max(80),
  description: z.string().max(500).optional().nullable(),
  presentationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (use YYYY-MM-DD)'),
  presentationTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida (use HH:MM)'),
  timezone: z.string().default('America/Bogota'),
  organizerName: z.string().min(2, 'Tu nombre es obligatorio').max(80),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = CreateGroupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }
    const data = parsed.data

    // Validate that presentation datetime is in the future
    const targetTs = new Date(
      `${data.presentationDate}T${data.presentationTime}:00`
    ).getTime()
    if (Number.isNaN(targetTs)) {
      return NextResponse.json(
        { ok: false, error: 'Fecha u hora inválida' },
        { status: 400 }
      )
    }
    if (targetTs <= Date.now()) {
      return NextResponse.json(
        { ok: false, error: 'La fecha de presentación debe ser futura' },
        { status: 400 }
      )
    }

    // Generate group code with retry on collision
    let code = generateGroupCode()
    let tries = 0
    while (await db.group.findUnique({ where: { code } })) {
      code = generateGroupCode()
      tries++
      if (tries > 10) break
    }

    // Generate admin token (returned to client ONCE in plaintext)
    const adminToken = generateAdminCode()
    const adminTokenHash = hashToken(adminToken)

    const group = await db.group.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        code,
        presentationDate: data.presentationDate,
        presentationTime: data.presentationTime,
        timezone: data.timezone,
        status: 'REGISTRATION',
        adminTokenHash,
        organizerName: data.organizerName,
      },
    })

    // Auto-create the organizer as the first participant.
    const personalCode = generatePersonalCode()
    const organizerAlias = sanitizeAlias(data.organizerName)
    // ensure unique alias in this group
    let finalAlias = organizerAlias
    if (await db.participant.findFirst({ where: { groupId: group.id, alias: finalAlias } })) {
      finalAlias = `${organizerAlias}-${Math.floor(Math.random() * 9000 + 1000)}`
    }

    const participant = await db.participant.create({
      data: {
        groupId: group.id,
        alias: finalAlias,
        realName: data.organizerName,
        personalCodeHash: hashToken(personalCode),
        avatar: pickRandomAvatar(),
      },
    })

    return NextResponse.json({
      ok: true,
      group: publicGroup(group),
      // Reveal only at creation time:
      adminToken,
      participant: {
        id: participant.id,
        alias: participant.alias,
        avatar: participant.avatar,
        personalCode,
      },
    })
  } catch (e: any) {
    console.error('[POST /api/groups] error', e)
    return NextResponse.json(
      { ok: false, error: 'No se pudo crear el grupo' },
      { status: 500 }
    )
  }
}

function sanitizeAlias(name: string): string {
  // take first 24 chars and trim
  const trimmed = name.trim().slice(0, 24)
  return trimmed
}
