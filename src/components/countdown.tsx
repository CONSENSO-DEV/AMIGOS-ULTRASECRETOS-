'use client'

import { useEffect, useState } from 'react'
import { computeCountdown } from '@/lib/time'

export function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return computeCountdown(target, now)
}

export function CountdownDisplay({
  target,
  large = false,
}: {
  target: number
  large?: boolean
}) {
  const c = useCountdown(target)
  if (c.isPast) {
    return <span className="text-accent font-bold">¡Es la hora! 🎉</span>
  }
  const box = large ? 'px-3 py-2 min-w-[68px]' : 'px-2 py-1 min-w-[48px]'
  const num = large ? 'text-3xl' : 'text-lg'
  const lbl = large ? 'text-[10px]' : 'text-[9px]'
  return (
    <div className="flex gap-2 items-stretch">
      {[
        { label: 'días', value: c.days },
        { label: 'horas', value: c.hours },
        { label: 'min', value: c.minutes },
        { label: 'seg', value: c.seconds },
      ].map((it, i) => (
        <div
          key={i}
          className={`bg-card rounded-xl border border-border/60 shadow-sm flex flex-col items-center justify-center ${box}`}
        >
          <span className={`font-mono font-bold tabular-nums ${num} text-primary`}>
            {String(it.value).padStart(2, '0')}
          </span>
          <span className={`uppercase tracking-wide text-muted-foreground ${lbl}`}>
            {it.label}
          </span>
        </div>
      ))}
    </div>
  )
}
