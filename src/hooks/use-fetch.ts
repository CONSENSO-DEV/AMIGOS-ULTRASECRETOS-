'use client'

import { useEffect, useState, useCallback } from 'react'

export interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useFetch<T>(url: string | null, opts?: RequestInit): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [state, setState] = useState<{ loading: boolean; error: string | null; counter: number }>(
    { loading: false, error: null, counter: 0 }
  )

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, counter: s.counter + 1 }))
  }, [])

  useEffect(() => {
    if (!url) return
    let cancelled = false
    // Set loading via async callback to avoid synchronous setState in effect body
    Promise.resolve().then(() => {
      if (!cancelled) {
        setState({ loading: true, error: null, counter: state.counter })
      }
    })
    fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(opts?.headers ?? {}),
      },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (cancelled) return
        if (!r.ok) {
          setState({ loading: false, error: data.error ?? `HTTP ${r.status}`, counter: state.counter })
          setData(null)
        } else {
          setData(data)
          setState({ loading: false, error: null, counter: state.counter })
        }
      })
      .catch((e) => {
        if (cancelled) return
        setState({ loading: false, error: e?.message ?? 'Error de red', counter: state.counter })
        setData(null)
      })
    return () => {
      cancelled = true
    }
  }, [url, state.counter])

  return { data, loading: state.loading, error: state.error, refresh }
}
