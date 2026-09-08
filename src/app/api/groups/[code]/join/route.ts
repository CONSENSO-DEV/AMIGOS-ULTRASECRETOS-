import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  hashToken,
  pickRandomAvatar,
} from '@/lib/codes'
import { canJoinGroup } from '@/lib/group-state'
import {
  SESSION_COOKIE,
  buildSessionCookieValue,
} from '@/lib/session'

const JoinSchema = z.object({
  alias: z
    .string()
    .trim()
    .min(2, 'El alias debe tener al menos 2 caracteres')
    .max(24, 'El alias es demasiado largo (máx 24)'),
  realName: z
    .string()
    .trim()
    .min(2, 'Tu nombre real es obligatorio')
    .max(60, 'El nombre es demasiado largo'),
  password: z
    .string()
    .min(4, 'La contraseña debe tener al menos 4 caracteres')
    .max(100, 'La contraseña es demasiado larga (máx 100)'),
})

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await ctx.params
    const group = await db.group.findFirst({ where: { code } })
    if (!group) {
      return NextResponse.json(
        { ok: false, error: 'Grupo no encontrado' },
        { status: 404 }
      )
    }

    if (!(await canJoinGroup(group))) {
      return NextResponse.json(
        { ok: false, error: 'El grupo ya está cerrado a nuevos participantes' },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => null)
    const parsed = JoinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }

    const alias = parsed.data.alias.trim()
    const realName = parsed.data.realName.trim()
    const password = parsed.data.password

    // Check alias uniqueness
    const existing = await db.participant.findFirst({
      where: { groupId: group.id, alias: { equals: alias } },
    })
    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'Ese alias ya está en uso. Elige otro.' },
        { status: 409 }
      )
    }

    // Hash the user-chosen password with SHA-256 + salt (same primitive as codes)
    const participant = await db.participant.create({
      data: {
        groupId: group.id,
        alias,
        realName,
        personalCodeHash: hashToken(password),
        avatar: pickRandomAvatar(),
      },
    })

    // Build session cookie value. We store the raw password so the cookie
    // acts as a bearer credential that's re-validated against the hash on
    // every request (see lib/session.ts getParticipantFromRequest).
    const cookieValue = buildSessionCookieValue(
      participant.id,
      group.code,
      password
    )

    const response = NextResponse.json({
      ok: true,
      participant: {
        id: participant.id,
        alias: participant.alias,
        avatar: participant.avatar,
      },
    })
    response.cookies.set(SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })
    return response
  } catch (e: any) {
    console.error('[POST /api/groups/[code]/join] error', e)
    return NextResponse.json(
      { ok: false, error: 'No se pudo unir al grupo' },
      { status: 500 }
    )
  }
}
