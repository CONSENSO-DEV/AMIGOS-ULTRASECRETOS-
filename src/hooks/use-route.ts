'use client'

import { useEffect, useState } from 'react'
import { parseHash, navigate as navigateFn, type Route } from '@/lib/router'

export function useHashRoute(): [Route, (path: string) => void] {
  const [route, setRoute] = useState<Route>(() => {
    if (typeof window === 'undefined') return { name: 'landing' }
    return parseHash(window.location.hash)
  })

  useEffect(() => {
    const handler = () => {
      setRoute(parseHash(window.location.hash))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('hashchange', handler)
    // Also handle the case where the hash is set programmatically
    if (!window.location.hash) {
      window.location.hash = '#/'
    }
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  return [route, navigateFn]
}
