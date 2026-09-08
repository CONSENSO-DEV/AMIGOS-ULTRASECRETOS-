'use client'

import { useEffect, useState } from 'react'

interface ConfettiPiece {
  id: number
  left: number
  color: string
  delay: number
  duration: number
  rotation: number
}

const COLORS = [
  '#9333ea', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#ec4899', '#8b5cf6', '#f97316', '#14b8a6', '#eab308',
]

export function Confetti({ count = 60, durationMs = 4000 }: { count?: number; durationMs?: number }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>(() => {
    // Initialize on first render (state initializer is allowed).
    const arr: ConfettiPiece[] = []
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * (durationMs / 1000 / 2),
        duration: durationMs / 1000 + Math.random() * 2,
        rotation: Math.random() * 720,
      })
    }
    return arr
  })
  const [show, setShow] = useState(true)
  useEffect(() => {
    const hideTimer = setTimeout(() => setShow(false), durationMs + 1500)
    return () => clearTimeout(hideTimer)
  }, [durationMs])
  if (!show) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}vw`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  )
}
