'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, Sparkles, ChevronRight, RotateCcw } from 'lucide-react'
import { CountdownDisplay } from '@/components/countdown'
import { Confetti } from '@/components/confetti'
import { getPresentationTimestamp } from '@/lib/time'

interface RevealEntry {
  participant: { id: string; alias: string; avatar: string }
  realName: string
}

export function RevealPanel({
  groupCode,
  presentationDate,
  presentationTime,
  timezone,
}: {
  groupCode: string
  presentationDate: string
  presentationTime: string
  timezone: string
}) {
  const [entries, setEntries] = useState<RevealEntry[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revealAvailable, setRevealAvailable] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/groups/${groupCode}/reveal`)
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? 'Error')
        return
      }
      if (data.reveal) {
        setEntries(data.entries ?? [])
        setRevealAvailable(true)
      } else {
        setRevealAvailable(false)
      }
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Poll every 15s in case the reveal time just passed
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [groupCode])

  const target = getPresentationTimestamp(presentationDate, presentationTime, timezone)

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cargando revelación...</p>
      </div>
    )
  }

  if (!revealAvailable) {
    return (
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
          className="text-7xl mb-4"
        >
          🔒
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-extrabold mb-2">
          Identidades Ultrasecretas
        </h2>
        <p className="text-muted-foreground mb-6">
          Las identidades serán reveladas el{' '}
          <strong>{presentationDate}</strong> a las{' '}
          <strong>{presentationTime}</strong>.
        </p>
        <div className="flex justify-center">
          <CountdownDisplay target={target} large />
        </div>
        <p className="text-xs text-muted-foreground mt-4 italic">
          ¿No puedes esperar? El administrador puede iniciar la revelación manualmente.
        </p>
      </div>
    )
  }

  if (!entries) return null

  if (showAll || entries.length === 0) {
    return (
      <div>
        <Confetti key={confettiKey} count={80} durationMs={5000} />
        <AllRevealView entries={entries} />
        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowAll(false)
              setCurrentIndex(0)
              setRevealed(new Set())
              setConfettiKey((k) => k + 1)
            }}
          >
            <RotateCcw className="size-4 mr-2" />
            Ver de nuevo
          </Button>
        </div>
      </div>
    )
  }

  const current = entries[currentIndex]
  const isRevealed = revealed.has(currentIndex)

  return (
    <div className="text-center py-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentIndex}-${isRevealed}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-2 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="text-8xl mb-4"
              >
                {current.participant.avatar}
              </motion.div>
              <p className="text-2xl font-extrabold uppercase tracking-wide">
                {current.participant.alias}
              </p>
              <p className="text-muted-foreground mt-2 mb-6">era...</p>

              {!isRevealed ? (
                <Button
                  size="lg"
                  className="h-14 px-8 text-base font-bold glow-pulse rounded-2xl"
                  onClick={() => {
                    setRevealed((s) => new Set([...s, currentIndex]))
                    setConfettiKey((k) => k + 1)
                  }}
                >
                  <Sparkles className="size-5 mr-2" />
                  ¡Revelar!
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <Confetti key={confettiKey} count={50} durationMs={3000} />
                  <h3 className="text-4xl md:text-5xl font-extrabold text-accent">
                    {current.realName} 🎉
                  </h3>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2 mt-4">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {entries.length}
        </span>
        <div className="flex gap-2">
          {currentIndex < entries.length - 1 ? (
            <Button
              onClick={() => {
                if (!isRevealed) {
                  // Reveal first if not yet
                  setRevealed((s) => new Set([...s, currentIndex]))
                  setTimeout(() => {
                    setCurrentIndex((i) => i + 1)
                  }, 800)
                } else {
                  setCurrentIndex((i) => i + 1)
                }
              }}
              className="font-bold"
            >
              Revelar siguiente
              <ChevronRight className="size-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                setShowAll(true)
                setConfettiKey((k) => k + 1)
              }}
              className="font-bold"
            >
              Ver todas las identidades
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setShowAll(true)
              setConfettiKey((k) => k + 1)
            }}
          >
            Revelar todo
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
        {entries.map((e, i) => (
          <button
            key={e.participant.id}
            onClick={() => setCurrentIndex(i)}
            className={`text-2xl p-1 rounded-lg transition-all ${
              i === currentIndex
                ? 'bg-accent/20 scale-125'
                : revealed.has(i)
                  ? 'opacity-100'
                  : 'opacity-40 grayscale'
            }`}
            title={revealed.has(i) ? `${e.participant.alias} → ${e.realName}` : e.participant.alias}
          >
            {e.participant.avatar}
          </button>
        ))}
      </div>
    </div>
  )
}

function AllRevealView({ entries }: { entries: RevealEntry[] }) {
  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-3xl font-extrabold">🎉 ¡Todas las identidades!</h2>
        <p className="text-muted-foreground">
          Estos son los verdaderos responsables.
        </p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entries.map((e, i) => (
          <motion.div
            key={e.participant.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="border-2 border-accent/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="text-4xl shrink-0">{e.participant.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base">{e.participant.alias}</p>
                  <p className="text-xs text-muted-foreground">era...</p>
                  <p className="text-lg font-extrabold text-accent">{e.realName}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
