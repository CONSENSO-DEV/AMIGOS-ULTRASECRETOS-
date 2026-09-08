import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/codes'
import {
  ADMIN_SESSION_COOKIE,
  buildAdminSessionCookieValue,
  rateLimit,
  clearRateLimit,
} from '@/lib/session'

const AdminLoginSchema = z.object({
  groupCode: z.string().trim().min(1, 'Código del grupo requerido'),
  adminToken: z.string().trim().min(1, 'Código de administrador requerido'),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = AdminLoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }
  const { groupCode, adminToken } = parsed.data

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const key = `admin-login:${ip}:${groupCode}`
  const rl = rateLimit(key, 5, 5 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
      { status: 429 }
    )
  }

  const group = await db.group.findFirst({ where: { code: groupCode } })
  if (!group || !verifyToken(adminToken, group.adminTokenHash)) {
    return NextResponse.json(
      { ok: false, error: 'Credenciales de administrador inválidas' },
      { status: 401 }
    )
  }
  clearRateLimit(key)
  const cookieValue = buildAdminSessionCookieValue(groupCode, adminToken)
  const response = NextResponse.json({
    ok: true,
    groupCode: group.code,
    groupName: group.name,
  })
  response.cookies.set(ADMIN_SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return response
}
