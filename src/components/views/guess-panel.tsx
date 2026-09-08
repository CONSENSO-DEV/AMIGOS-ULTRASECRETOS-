'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, Lock, Save, AlertTriangle, Eye, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface Participant {
  id: string
  alias: string
  avatar: string
}

interface GuessesData {
  ok: boolean
  reveal: boolean
  canModify: boolean
  participants: Participant[]
  self: Participant
  myGuesses: Record<string, string | null>
  answerKey?: Record<string, { alias: string; realName: string; avatar: string }>
}

export function GuessPanel({ groupCode }: { groupCode: string }) {
  const [data, setData] = useState<GuessesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guesses, setGuesses] = useState<Record<string, string | null>>({})
  const [dirty, setDirty] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/groups/${groupCode}/guesses`)
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? 'Error al cargar')
        return
      }
      setData(data)
      setGuesses({ ...data.myGuesses })
      setDirty({})
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [groupCode])

  const save = async (targetId: string) => {
    const guess = guesses[targetId] ?? null
    setSaving(targetId)
    try {
      const r = await fetch(`/api/groups/${groupCode}/guesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetParticipantId: targetId,
          guessedParticipantId: guess,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error ?? 'No se pudo guardar')
        return
      }
      setDirty((p) => ({ ...p, [targetId]: false }))
      toast.success('Respuesta guardada')
    } catch {
      toast.error('Error de red')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando adivinanzas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="size-12 mx-auto text-destructive mb-3" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={load} className="mt-3">
          Reintentar
        </Button>
      </div>
    )
  }

  if (!data) return null

  if (data.reveal && data.answerKey) {
    // Reveal mode - show personal results
    return <GuessResults groupCode={groupCode} data={data} guesses={guesses} />
  }

  if (!data.canModify) {
    return (
      <div className="text-center py-12">
        <Lock className="size-12 mx-auto text-muted-foreground mb-3" />
        <p className="font-bold text-lg mb-2">Las respuestas están bloqueadas</p>
        <p className="text-muted-foreground">
          Ya no se pueden modificar las respuestas. Espera la revelación.
        </p>
      </div>
    )
  }

  const answeredCount = Object.values(guesses).filter((v) => v).length
  const totalCount = data.participants.length

  return (
    <div className="space-y-4">
      <Card className="border-2 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Progreso</p>
              <p className="text-2xl font-bold">
                {answeredCount} / {totalCount}
              </p>
            </div>
            <div className="text-5xl">🕵️</div>
          </div>
          <div className="mt-3 bg-card rounded-full h-2 overflow-hidden border">
            <div
              className="bg-accent h-full transition-all"
              style={{ width: `${totalCount ? (answeredCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            🔒 Tus respuestas son privadas. Nadie más puede verlas hasta la revelación.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {data.participants.map((p) => {
          const isDirty = dirty[p.id]
          const guess = guesses[p.id]
          const isSaving = saving === p.id
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`border-2 ${guess ? 'border-accent/40' : 'border-border'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl shrink-0">{p.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base">{p.alias}</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        ¿Quién crees que es?
                      </p>
                      <div className="flex gap-2">
                        <Select
                          value={guess ?? '__none__'}
                          onValueChange={(v) => {
                            setGuesses((prev) => ({
                              ...prev,
                              [p.id]: v === '__none__' ? null : v,
                            }))
                            setDirty((prev) => ({ ...prev, [p.id]: true }))
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecciona un nombre..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— Sin respuesta —</SelectItem>
                            {data.participants
                              .filter((c) => c.id !== p.id && c.id !== data.self.id)
                              .map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.avatar} {c.alias}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant={isDirty ? 'default' : 'outline'}
                          disabled={!isDirty || isSaving}
                          onClick={() => save(p.id)}
                          className="shrink-0"
                          aria-label="Guardar respuesta"
                        >
                          {isSaving ? (
                            <Sparkles className="size-4 animate-pulse" />
                          ) : guess && !isDirty ? (
                            <Check className="size-4 text-green-500" />
                          ) : (
                            <Save className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function GuessResults({
  groupCode,
  data,
  guesses,
}: {
  groupCode: string
  data: GuessesData
  guesses: Record<string, string | null>
}) {
  return (
    <div className="space-y-3">
      <Card className="border-2 border-accent/40 bg-accent/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Eye className="size-6 text-accent" />
          <div>
            <p className="font-bold">Tus respuestas finales</p>
            <p className="text-xs text-muted-foreground">
              Estos son los detectives que enviaste. Mira cuántos acertaste.
            </p>
          </div>
        </CardContent>
      </Card>
      {data.participants.map((p) => {
        const guessed = guesses[p.id]
        const guessedParticipant = guessed ? data.participants.find((x) => x.id === guessed) : null
        const answer = data.answerKey?.[p.id]
        const correct = guessed && answer && guessed === p.id ? true : false
        // correct if guessedParticipant.id matches real identity
        // But our comparison logic at server compares realName of guessed participant to target's realName.
        // For UX, we compare guessedParticipantId with targetParticipantId (since they should be same person)
        const correctLocal = guessed === p.id
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className={`border-2 ${correctLocal ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl shrink-0">{p.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold">{p.alias}</p>
                      {answer && (
                        <span className="text-xs text-muted-foreground">
                          → era <strong>{answer.realName}</strong> {answer.avatar}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Tu respuesta:</span>{' '}
                      {guessedParticipant
                        ? `${guessedParticipant.avatar} ${guessedParticipant.alias}`
                        : '— sin respuesta —'}
                    </p>
                    <p className="text-sm font-bold mt-1">
                      Resultado:{' '}
                      {correctLocal ? (
                        <span className="text-green-600 dark:text-green-400">✅ Correcto</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">
                          ❌ {guessedParticipant ? `Era ${answer?.realName}` : 'Sin respuesta'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-3xl shrink-0">{correctLocal ? '✅' : '❌'}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
