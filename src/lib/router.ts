/**
 * Lightweight client-side router using hash fragments.
 * Because the dev sandbox only allows the `/` route, we use hash routing
 * (#/create, #/group/ULTRA-XXXX, etc.) to simulate multiple pages while
 * staying on a single Next.js route.
 *
 * Routes:
 *  - #/                       -> Landing
 *  - #/create                  -> Create group
 *  - #/join                    -> Join group (entry by code)
 *  - #/join/:code              -> Join specific group (alias picker)
 *  - #/login                   -> Recover access
 *  - #/group/:code             -> Dashboard (requires session)
 *  - #/admin/login             -> Admin login
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
}

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '')
  if (!clean) return { name: 'landing' }
  const parts = clean.split('/').filter(Boolean)
  if (parts[0] === 'create') return { name: 'create' }
  if (parts[0] === 'join' && parts.length === 1) return { name: 'join' }
  if (parts[0] === 'join' && parts.length === 2) return { name: 'join-code', params: { code: parts[1] } }
  if (parts[0] === 'login') return { name: 'login' }
  if (parts[0] === 'group' && parts.length === 2) return { name: 'group', params: { code: parts[1] } }
  if (parts[0] === 'admin' && parts.length === 1) return { name: 'admin-login' }
  if (parts[0] === 'admin' && parts.length === 2) return { name: 'admin', params: { code: parts[1] } }
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

export function useHashRoute(): [Route, (path: string) => void] {
  // SSR-safe: returns landing on first render
  const getRoute = (): Route => {
    if (typeof window === 'undefined') return { name: 'landing' }
    return parseHash(window.location.hash)
  }
  // We need to use React state. Use a dummy state to trigger re-render.
  // The component using this hook will re-render on hashchange.
  return [getRoute(), navigate]
}
