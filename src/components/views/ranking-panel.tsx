'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Lock, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface RankRow {
  participantId: string
  alias: string
  avatar: string
  correct: number
  total: number
  percentage: number
  rank: number
}

export function RankingPanel({ groupCode }: { groupCode: string }) {
  const [rows, setRows] = useState<RankRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/groups/${groupCode}/ranking`)
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? 'Error al cargar ranking')
        return
      }
      setRows(data.ranking ?? [])
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [groupCode])

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Calculando ranking...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Lock className="size-12 mx-auto text-muted-foreground mb-3" />
        <p className="font-bold text-lg mb-2">Ranking no disponible</p>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="size-4 mr-2" />
          Reintentar
        </Button>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="size-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Aún no hay datos de ranking.</p>
      </div>
    )
  }

  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
  // Get current participantId from the mine response
  const mineId = typeof window !== 'undefined' ? localStorage.getItem('us_self_id') : null

  return (
    <div className="space-y-3">
      <Card className="border-2 bg-gradient-to-br from-accent/10 to-primary/5">
        <CardContent className="p-5 text-center">
          <Trophy className="size-10 mx-auto text-accent mb-2" />
          <h2 className="text-2xl font-extrabold">Detectives</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Ranking de los mejores detectives del grupo.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.map((r, idx) => {
          const isMine = r.participantId === mineId
          return (
            <motion.div
              key={r.participantId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={isMine ? 'ring-2 ring-accent rounded-2xl' : ''}
            >
              <Card
                className={`border-2 ${
                  r.rank === 1
                    ? 'border-accent/40 bg-accent/5'
                    : r.rank <= 3
                      ? 'border-accent/20'
                      : ''
                }`}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="text-2xl shrink-0 w-10 text-center font-bold">
                    {medals[r.rank] ?? (
                      <span className="text-muted-foreground text-base">#{r.rank}</span>
                    )}
                  </div>
                  <div className="text-3xl shrink-0">{r.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold truncate">{r.alias}</p>
                      {isMine && (
                        <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-medium">
                          Tú
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.correct} / {r.total} aciertos · {r.percentage}%
                    </p>
                    <div className="mt-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-accent h-full transition-all"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-extrabold text-accent">{r.percentage}%</p>
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
