import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  generateGroupCode,
  generateAdminCode,
  hashToken,
} from '@/lib/codes'
import { publicGroup } from '@/lib/group-state'

const CODE_PATTERN = /^[A-Z0-9]{3,30}$/

const CreateGroupSchema = z.object({
  name: z.string().min(3, 'El nombre del grupo debe tener al menos 3 caracteres').max(80),
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(30, 'El código es demasiado largo (máx 30)')
    .regex(CODE_PATTERN, 'El código solo puede contener letras y números, sin espacios')
    .optional(),
  description: z.string().max(500).optional().nullable(),
  presentationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (use YYYY-MM-DD)'),
  presentationTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida (use HH:MM)'),
  timezone: z.string().default('America/Bogota'),
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

    // Use custom code if provided, otherwise generate one.
    let code = data.code?.toUpperCase().trim()
    if (!code) {
      code = generateGroupCode()
    }
    // Ensure uniqueness (retry if generated, error if custom)
    if (data.code) {
      const existing = await db.group.findUnique({ where: { code } })
      if (existing) {
        return NextResponse.json(
          { ok: false, error: 'Ese código ya está en uso. Elige otro.' },
          { status: 409 }
        )
      }
    } else {
      let tries = 0
      while (await db.group.findUnique({ where: { code } })) {
        code = generateGroupCode()
        tries++
        if (tries > 10) break
      }
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
        organizerName: null, // admin is NOT a participant; we no longer store organizer name on the group
      },
    })

    // IMPORTANT: We deliberately do NOT create a Participant for the admin.
    // The admin is a separate identity, identified only by the adminToken.

    return NextResponse.json({
      ok: true,
      group: publicGroup(group),
      // Reveal admin token only at creation time:
      adminToken,
    })
  } catch (e: any) {
    console.error('[POST /api/groups] error', e)
    return NextResponse.json(
      { ok: false, error: 'No se pudo crear el grupo' },
      { status: 500 }
    )
  }
}
