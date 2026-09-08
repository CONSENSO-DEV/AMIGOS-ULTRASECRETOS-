import crypto from 'crypto'

/**
 * Generate a random alphanumeric code of `length` characters.
 * Avoids ambiguous characters (0/O, 1/I/L).
 */
export function generateCode(length: number = 5, charset?: string): string {
  const chars =
    charset ?? 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0, O, 1, I, L
  let out = ''
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length]
  }
  return out
}

/** Group code format: ULTRA-XXXXX (e.g., ULTRA-8K29) */
export function generateGroupCode(): string {
  return `ULTRA-${generateCode(4)}`
}

/** Personal code format: XXXX-XXXX (e.g., 7H4K-92P2) */
export function generatePersonalCode(): string {
  return `${generateCode(4)}-${generateCode(4)}`
}

/** Admin code format: ADMIN-XXXXXX */
export function generateAdminCode(): string {
  return `ADMIN-${generateCode(6)}`
}

/**
 * Hash a token/code using SHA-256 + per-token salt.
 * Returns a string suitable for db storage.
 * Format: <salt>$<hash_hex>
 */
export function hashToken(token: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .createHash('sha256')
    .update(salt + token)
    .digest('hex')
  return `${salt}$${hash}`
}

/** Verify whether a token matches a stored hashed token. */
export function verifyToken(token: string, stored: string): boolean {
  if (!stored) return false
  const [salt, hash] = stored.split('$')
  if (!salt || !hash) return false
  const computed = crypto
    .createHash('sha256')
    .update(salt + token)
    .digest('hex')
  // Constant time compare
  if (computed.length !== hash.length) return false
  let diff = 0
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ hash.charCodeAt(i)
  }
  return diff === 0
}

/** Pick a random emoji avatar for a participant. */
export function pickRandomAvatar(): string {
  const avatars = [
    '🦊', '🐸', '🎩', '👻', '🦁', '🎃', '🦉', '🐙', '🦝', '🐢',
    '🦄', '🐼', '🐨', '🦖', '🐉', '🦅', '🐺', '🦇', '🕷️', '🦂',
    '🐙', '🦑', '🦀', '🐡', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍',
  ]
  return avatars[Math.floor(Math.random() * avatars.length)]
}

/** Generate a session token for browser-stored "remember me". */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
