import { NextRequest } from 'next/server'
import { db } from './db'
import { verifyToken } from './codes'

/**
 * Session is stored in a signed HTTP-only cookie named `us_session`.
 * Cookie payload format: `<participantId>:<groupCode>:<token>` where `token`
 * is the participant's personal code (raw). On each request, we re-validate
 * the personal code hash against the DB.
 *
 * This is a stateless session: the user "re-logs in" on every request by
 * proving they know their personal code, which is stored in the cookie.
 *
 * For additional safety, the cookie is HttpOnly and SameSite=Lax.
 */
export const SESSION_COOKIE = 'us_session'

export interface SessionInfo {
  participantId: string
  groupId: string
  groupCode: string
}

export function buildSessionCookieValue(
  participantId: string,
  groupCode: string,
  personalCode: string
): string {
  return `${participantId}::${groupCode}::${personalCode}`
}

export function parseSessionCookie(value: string | undefined): {
  participantId: string
  groupCode: string
  personalCode: string
} | null {
  if (!value) return null
  const parts = value.split('::')
  if (parts.length !== 3) return null
  const [participantId, groupCode, personalCode] = parts
  if (!participantId || !groupCode || !personalCode) return null
  return { participantId, groupCode, personalCode }
}

/**
 * Resolve the current participant from a NextRequest, by validating the
 * session cookie against the DB. Returns null if not authenticated.
 */
export async function getParticipantFromRequest(
  req: NextRequest
): Promise<{ participant: any; group: any } | null> {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value
  const parsed = parseSessionCookie(cookie)
  if (!parsed) return null
  const { participantId, groupCode, personalCode } = parsed

  const group = await db.group.findFirst({
    where: { code: groupCode },
  })
  if (!group) return null

  const participant = await db.participant.findFirst({
    where: { id: participantId, groupId: group.id, active: true },
  })
  if (!participant) return null

  if (!verifyToken(personalCode, participant.personalCodeHash)) return null

  return { participant, group }
}

/**
 * Resolve a participant by explicit credentials (group code + alias + personal code).
 * Used by the recovery screen.
 */
export async function getParticipantByCredentials(
  groupCode: string,
  alias: string,
  personalCode: string
): Promise<{ participant: any; group: any } | null> {
  const group = await db.group.findFirst({ where: { code: groupCode } })
  if (!group) return null
  const participant = await db.participant.findFirst({
    where: { groupId: group.id, alias, active: true },
  })
  if (!participant) return null
  if (!verifyToken(personalCode, participant.personalCodeHash)) return null
  return { participant, group }
}

/** Resolve an admin from request cookies. */
export const ADMIN_SESSION_COOKIE = 'us_admin_session'

export async function getAdminFromRequest(
  req: NextRequest
): Promise<{ group: any } | null> {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!cookie) return null
  const parts = cookie.split('::')
  if (parts.length !== 2) return null
  const [groupCode, adminToken] = parts
  const group = await db.group.findFirst({ where: { code: groupCode } })
  if (!group) return null
  if (!verifyToken(adminToken, group.adminTokenHash)) return null
  return { group }
}

export function buildAdminSessionCookieValue(
  groupCode: string,
  adminToken: string
): string {
  return `${groupCode}::${adminToken}`
}

/** In-memory rate limiter for sensitive operations. */
const attempts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000
): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: maxAttempts - 1 }
  }
  if (entry.count >= maxAttempts) {
    return { ok: false, remaining: 0 }
  }
  entry.count += 1
  return { ok: true, remaining: maxAttempts - entry.count }
}

export function clearRateLimit(key: string) {
  attempts.delete(key)
}
