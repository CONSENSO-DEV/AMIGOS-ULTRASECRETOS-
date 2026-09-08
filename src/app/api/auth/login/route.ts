import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getParticipantByCredentials,
  buildSessionCookieValue,
  SESSION_COOKIE,
  rateLimit,
  clearRateLimit,
} from '@/lib/session'

const LoginSchema = z.object({
  groupCode: z.string().trim().min(1, 'Código del grupo requerido'),
  alias: z.string().trim().min(1, 'Alias requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }
  const { groupCode, alias, password } = parsed.data

  // Rate limit: 5 attempts per 5 minutes per IP+alias
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const key = `login:${ip}:${groupCode}:${alias}`
  const rl = rateLimit(key, 5, 5 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Demasiados intentos. Intenta de nuevo en unos minutos.',
      },
      { status: 429 }
    )
  }

  const result = await getParticipantByCredentials(groupCode, alias, password)
  if (!result) {
    return NextResponse.json(
      { ok: false, error: 'No pudimos validar tu acceso.' },
      { status: 401 }
    )
  }
  clearRateLimit(key)
  const { participant, group } = result
  const cookieValue = buildSessionCookieValue(
    participant.id,
    group.code,
    password
  )
  const response = NextResponse.json({
    ok: true,
    groupCode: group.code,
    participant: {
      id: participant.id,
      alias: participant.alias,
      avatar: participant.avatar,
    },
  })
  response.cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return response
}
