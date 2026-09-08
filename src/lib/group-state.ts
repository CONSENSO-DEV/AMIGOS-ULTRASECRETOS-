import { db } from './db'
import { getPresentationTimestamp } from './time'

/**
 * Compute the *effective* status of a group.
 * The stored `status` may be REGISTRATION or ACTIVE, but if the presentation
 * time has passed, the effective status becomes REVEAL regardless of the
 * stored status (unless explicitly FINISHED).
 *
 * The admin can also lock the group (LOCKED) which prevents new participants
 * but doesn't reveal.
 *
 * Order of precedence:
 * 1. FINISHED > everything
 * 2. REVEAL > reveal explicitly triggered by admin OR presentation time passed
 * 3. LOCKED > admin locked registrations
 * 4. ACTIVE > has participants
 * 5. REGISTRATION > default
 */
export async function getEffectiveGroupStatus(group: any): Promise<string> {
  if (group.status === 'FINISHED') return 'FINISHED'

  const ts = getPresentationTimestamp(
    group.presentationDate,
    group.presentationTime,
    group.timezone
  )
  const now = Date.now()

  if (now >= ts) return 'REVEAL'

  if (group.status === 'LOCKED') return 'LOCKED'
  if (group.status === 'REVEAL') return 'REVEAL'

  // If still before presentation, return stored status (REGISTRATION or ACTIVE)
  return group.status
}

/** Whether new participants can join. */
export async function canJoinGroup(group: any): Promise<boolean> {
  const status = await getEffectiveGroupStatus(group)
  return status === 'REGISTRATION' || status === 'ACTIVE'
}

/** Whether guesses can be modified. */
export async function canModifyGuesses(group: any): Promise<boolean> {
  const status = await getEffectiveGroupStatus(group)
  return status !== 'REVEAL' && status !== 'FINISHED'
}

/** Whether reveal data is available. */
export async function isRevealAvailable(group: any): Promise<boolean> {
  const status = await getEffectiveGroupStatus(group)
  return status === 'REVEAL' || status === 'FINISHED'
}

/** Returns public-safe fields for a group (no admin token hash, etc.). */
export function publicGroup(group: any) {
  return {
    id: group.id,
    name: group.name,
    code: group.code,
    description: group.description,
    presentationDate: group.presentationDate,
    presentationTime: group.presentationTime,
    timezone: group.timezone,
    status: group.status,
    createdAt: group.createdAt,
  }
}

/** Returns public-safe fields for a participant (no real name, no hashes). */
export function publicParticipant(p: any) {
  return {
    id: p.id,
    alias: p.alias,
    avatar: p.avatar,
    joinedAt: p.joinedAt,
  }
}
