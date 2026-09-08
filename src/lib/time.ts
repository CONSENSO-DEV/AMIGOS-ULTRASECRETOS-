/**
 * Compute the precise "presentation" datetime (as UTC ms) for a group,
 * based on its stored date string (YYYY-MM-DD), time (HH:MM), and timezone.
 *
 * We avoid relying on Intl for arbitrary timezone support, instead we use
 * a simple approach: compute the wall-clock UTC for Bogotá (UTC-5, no DST)
 * and for the listed common timezones. For full IANA support we use Intl with
 * formatToParts which works in Node 18+.
 */
export function getPresentationTimestamp(
  dateStr: string, // YYYY-MM-DD
  timeStr: string, // HH:MM
  timezone: string // IANA tz, e.g., America/Bogota
): number {
  // Build a date that represents the wall-clock time at UTC, then offset.
  // Simpler: use Intl to compute the offset at that time.
  // We construct ISO string and parse as if local to that timezone.

  // Construct a date in UTC representing the wall clock time.
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  // Date.UTC gives us the UTC time for "wall clock" if timezone were UTC.
  const utcWall = Date.UTC(year, month - 1, day, hour, minute, 0, 0)

  // Now compute the timezone offset at that wall-clock time using Intl.
  // We use formatToParts on a date formatter with the tz specified.
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    // For a given utcWall (treated as UTC), compute what the local wall-clock would be in tz
    const parts = dtf.formatToParts(new Date(utcWall))
    const map: Record<string, string> = {}
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value
    }
    // Convert local parts back to UTC
    const localMs = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour) === 24 ? 0 : Number(map.hour),
      Number(map.minute),
      Number(map.second),
      0
    )
    // Offset between local and UTC at that time:
    const offset = localMs - utcWall
    // The real UTC instant when the local wall clock shows dateStr/timeStr:
    return utcWall - offset
  } catch {
    // Fallback: assume America/Bogota (UTC-5)
    return utcWall - 5 * 60 * 60 * 1000
  }
}

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

export function computeCountdown(target: number, now: number = Date.now()): CountdownParts {
  const diff = target - now
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds, isPast: false }
}

/** Format a presentation date in a friendly Spanish format. */
export function formatPresentationDate(
  dateStr: string,
  timeStr: string,
  timezone: string = 'America/Bogota'
): string {
  try {
    const ts = getPresentationTimestamp(dateStr, timeStr, timezone)
    const dtf = new Intl.DateTimeFormat('es-CO', {
      timeZone: timezone,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    return dtf.format(new Date(ts))
  } catch {
    return `${dateStr} ${timeStr}`
  }
}
