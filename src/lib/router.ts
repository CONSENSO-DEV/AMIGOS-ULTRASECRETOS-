/**
 * Lightweight client-side router using hash fragments with query string support.
 *
 * Routes:
 *  - #/                       -> Landing
 *  - #/create                  -> Create group
 *  - #/join                    -> Join group (entry by code)
 *  - #/join/:code              -> Join specific group (alias picker)
 *  - #/login                   -> Recover access (no preset code)
 *  - #/login?code=XXXX        -> Recover access with code preset
 *  - #/group/:code             -> Dashboard (requires session)
 *  - #/admin/login             -> Admin login (with optional ?code=)
 *  - #/admin/:code             -> Admin dashboard (requires admin session)
 */

export interface Route {
  name:
    | 'landing'
    | 'create'
    | 'join'
    | 'join-code'
    | 'login'
    | 'group'
    | 'admin-login'
    | 'admin'
  params?: Record<string, string>
  query?: Record<string, string>
}

export function parseHash(hash: string): Route {
  // Strip leading '#/' or '#'
  const raw = hash.replace(/^#\/?/, '')
  if (!raw) return { name: 'landing' }
  // Split path and query
  const [pathPart, queryPart] = raw.split('?')
  const parts = pathPart.split('/').filter(Boolean)
  const query: Record<string, string> = {}
  if (queryPart) {
    const sp = new URLSearchParams(queryPart)
    sp.forEach((v, k) => {
      if (v) query[k] = v
    })
  }
  if (parts[0] === 'create') return { name: 'create' }
  if (parts[0] === 'join' && parts.length === 1) return { name: 'join' }
  if (parts[0] === 'join' && parts.length === 2) {
    return { name: 'join-code', params: { code: parts[1] }, query }
  }
  if (parts[0] === 'login') return { name: 'login', query }
  if (parts[0] === 'group' && parts.length === 2) {
    return { name: 'group', params: { code: parts[1] }, query }
  }
  if (parts[0] === 'admin' && parts.length === 1) return { name: 'admin-login', query }
  if (parts[0] === 'admin' && parts.length === 2) {
    return { name: 'admin', params: { code: parts[1] }, query }
  }
  return { name: 'landing' }
}

export function navigate(path: string) {
  if (typeof window === 'undefined') return
  if (path.startsWith('#')) {
    window.location.hash = path
  } else {
    window.location.hash = `#${path}`
  }
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** Navigate back in history, falling back to a default route. */
export function goBack(fallback: string = '#/') {
  if (typeof window === 'undefined') return
  // If we have history, go back; otherwise navigate to fallback
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigate(fallback)
  }
}
