'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Home,
  MessageCircle,
  Eye,
  Users,
  Trophy,
  PartyPopper,
  LogOut,
  Settings,
  UserX,
} from 'lucide-react'
import { navigate, goBack } from '@/lib/router'
import { useFetch } from '@/hooks/use-fetch'
import { CountdownDisplay } from '@/components/countdown'
import { formatPresentationDate, getPresentationTimestamp } from '@/lib/time'
import { ChatPanel } from './chat-panel'
import { GuessPanel } from './guess-panel'
import { RankingPanel } from './ranking-panel'
import { RevealPanel } from './reveal-panel'
import { toast } from 'sonner'

type Tab = 'home' | 'chat' | 'guess' | 'participants' | 'ranking' | 'reveal' | 'admin'

interface MineData {
  ok: boolean
  status: string
  reveal: boolean
  self: { id: string; alias: string; avatar: string }
  score?: {
    correct: number
    total: number
    percentage: number
    rank: number | null
    totalRanked: number
  }
}

export function GroupDashboardView({ code }: { code: string }) {
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<Tab>('home')
  const [self, setSelf] = useState<{ id: string; alias: string; avatar: string } | null>(null)
  const [mineData, setMineData] = useState<MineData | null>(null)
  const [showSessionMenu, setShowSessionMenu] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.groupCode === code) {
          setAuthed(true)
          setSelf(data.participant)
          // Save to localStorage for use in ranking panel
          localStorage.setItem('us_self_id', data.participant.id)
        }
        setAuthChecked(true)
      })
      .catch(() => setAuthChecked(true))
  }, [code])

  const { data: groupData, refresh } = useFetch<any>(`/api/groups/${code}`)

  // Refresh /mine periodically to detect reveal status changes
  useEffect(() => {
    if (!authed) return
    const loadMine = () => {
      fetch(`/api/groups/${code}/mine`)
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) setMineData(d)
        })
        .catch(() => {})
    }
    loadMine()
    const id = setInterval(loadMine, 30000)
    return () => clearInterval(id)
  }, [authed, code])

  if (!authChecked) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </main>
    )
  }

  if (!authed) {
    return <UnauthenticatedView code={code} />
  }

  if (!self) return null

  const group = groupData?.group
  const participantCount = groupData?.participantCount ?? 0
  const status = mineData?.status ?? group?.status ?? 'REGISTRATION'
  const reveal = mineData?.reveal ?? false

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode; show: boolean }> = [
    { id: 'home', label: 'Inicio', icon: <Home className="size-4" />, show: true },
    { id: 'chat', label: 'Chat', icon: <MessageCircle className="size-4" />, show: true },
    { id: 'guess', label: 'Adivina', icon: <Eye className="size-4" />, show: true },
    { id: 'participants', label: 'Participantes', icon: <Users className="size-4" />, show: true },
    { id: 'ranking', label: 'Ranking', icon: <Trophy className="size-4" />, show: reveal },
    { id: 'reveal', label: 'Revelación', icon: <PartyPopper className="size-4" />, show: true },
    { id: 'admin', label: 'Admin', icon: <Settings className="size-4" />, show: true },
  ]

  return (
    <main className="flex-1 flex flex-col pb-32 md:pb-8">
      {/* Header */}
      <header className="px-4 py-4 border-b bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => goBack('#/')}
            className="flex items-center gap-2 min-w-0 text-left"
            aria-label="Volver"
          >
            <span className="text-2xl shrink-0">🕵️</span>
            <div className="min-w-0">
              <h1 className="font-extrabold text-base truncate">{group?.name ?? 'Amigos Ultrasecretos'}</h1>
              <p className="text-xs text-muted-foreground truncate">
                👥 {participantCount} · {statusBadge(status)}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSessionMenu(!showSessionMenu)}
              aria-label="Opciones de sesión"
            >
              <span className="text-lg mr-1">{self.avatar}</span>
              <span className="hidden sm:inline text-xs font-medium max-w-[80px] truncate">{self.alias}</span>
            </Button>
          </div>
        </div>

        {showSessionMenu && (
          <div className="max-w-3xl mx-auto mt-2 relative">
            <div className="absolute right-0 top-0 w-64 bg-card border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b bg-muted/30">
                <p className="text-xs text-muted-foreground">Conectado como</p>
                <p className="font-bold">{self.avatar} {self.alias}</p>
              </div>
              <button
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors flex items-center gap-2 border-b"
                onClick={() => {
                  setShowSessionMenu(false)
                  navigate(`#/login?code=${encodeURIComponent(code)}`)
                }}
              >
                <UserX className="size-4" />
                ¿No eres tú? Cambiar de participante
              </button>
              <button
                className="w-full text-left px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' })
                  localStorage.removeItem('us_self_id')
                  toast.success('Sesión cerrada')
                  navigate('#/')
                }}
              >
                <LogOut className="size-4" />
                🚪 Salir
              </button>
            </div>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowSessionMenu(false)}
            />
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'home' && group && (
                <HomeTab
                  group={group}
                  participantCount={participantCount}
                  status={status}
                  self={self!}
                  mineData={mineData}
                  onNavigate={setTab}
                />
              )}
              {tab === 'chat' && (
                <ChatPanel
                  groupCode={code}
                  selfId={self!.id}
                  selfAlias={self!.alias}
                  selfAvatar={self!.avatar}
                  isAdmin={false}
                />
              )}
              {tab === 'guess' && <GuessPanel groupCode={code} />}
              {tab === 'participants' && <ParticipantsTab code={code} />}
              {tab === 'ranking' && <RankingPanel groupCode={code} />}
              {tab === 'reveal' && group && (
                <RevealPanel
                  groupCode={code}
                  presentationDate={group.presentationDate}
                  presentationTime={group.presentationTime}
                  timezone={group.timezone}
                />
              )}
              {tab === 'admin' && <AdminLinkTab code={code} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card/95 backdrop-blur border-t z-40">
        <div className="flex overflow-x-auto scroll-mystery">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center justify-center px-3 py-2 min-w-[64px] flex-1 transition-colors ${
                  tab === t.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.icon}
                <span className="text-[10px] mt-0.5">{t.label}</span>
              </button>
            ))}
        </div>
      </nav>

      {/* Top tab nav (desktop) */}
      <nav className="hidden md:block border-b bg-card/40">
        <div className="max-w-3xl mx-auto px-4 py-2 flex gap-1 overflow-x-auto">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
        </div>
      </nav>
    </main>
  )
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    REGISTRATION: { label: '🟢 Abierto', color: 'text-green-600' },
    ACTIVE: { label: '🟢 Activo', color: 'text-green-600' },
    LOCKED: { label: '🔒 Cerrado', color: 'text-amber-600' },
    REVEAL: { label: '🎉 Revelación', color: 'text-accent' },
    FINISHED: { label: '🏁 Terminado', color: 'text-muted-foreground' },
  }
  return <span>{(map[status] ?? { label: status }).label}</span>
}

function UnauthenticatedView({ code }: { code: string }) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-2xl font-extrabold mb-2">Acceso requerido</h1>
        <p className="text-muted-foreground mb-6">
          Para entrar a este grupo necesitas tu alias y código personal.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => navigate(`#/login?code=${encodeURIComponent(code)}`)}
            className="h-12"
          >
            Recuperar mi acceso
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`#/join/${code}`)}
            className="h-12"
          >
            Unirme por primera vez
          </Button>
        </div>
      </div>
    </main>
  )
}

function HomeTab({
  group,
  participantCount,
  status,
  self,
  mineData,
  onNavigate,
}: {
  group: any
  participantCount: number
  status: string
  self: { id: string; alias: string; avatar: string }
  mineData: MineData | null
  onNavigate: (t: Tab) => void
}) {
  const target = getPresentationTimestamp(group.presentationDate, group.presentationTime, group.timezone)
  const reveal = mineData?.reveal ?? false

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <Card className="border-2 bg-gradient-to-br from-primary/10 to-accent/5">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="text-5xl shrink-0">{self.avatar}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Tu alias</p>
            <p className="font-extrabold text-xl truncate">{self.alias}</p>
          </div>
        </CardContent>
      </Card>

      {/* Countdown */}
      {!reveal ? (
        <Card className="border-2">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
              ⏳ Cuenta regresiva
            </p>
            <CountdownDisplay target={target} large />
            <p className="text-xs text-muted-foreground mt-3">
              Presentación: {formatPresentationDate(group.presentationDate, group.presentationTime, group.timezone)}
            </p>
          </CardContent>
        </Card>
      ) : mineData?.score ? (
        <Card className="border-2 border-accent/40 bg-accent/5">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
              🎯 Mis resultados
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold">
                  {mineData.score.correct} <span className="text-muted-foreground text-lg">/ {mineData.score.total}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {mineData.score.percentage}% de aciertos
                </p>
              </div>
              {mineData.score.rank && (
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-accent">#{mineData.score.rank}</p>
                  <p className="text-xs text-muted-foreground">
                    de {mineData.score.totalRanked}
                  </p>
                </div>
              )}
            </div>
            <Button
              className="w-full mt-3"
              variant="outline"
              onClick={() => onNavigate('guess')}
            >
              Ver mis predicciones
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <QuickAction icon={<MessageCircle className="size-5" />} label="Chatear" onClick={() => onNavigate('chat')} />
        <QuickAction icon={<Eye className="size-5" />} label="Adivinar" onClick={() => onNavigate('guess')} />
        <QuickAction icon={<Users className="size-5" />} label="Participantes" onClick={() => onNavigate('participants')} />
        <QuickAction
          icon={<PartyPopper className="size-5" />}
          label="Revelación"
          onClick={() => onNavigate('reveal')}
          highlight={reveal}
        />
      </div>

      {/* Rules */}
      <Card className="border-2">
        <CardContent className="p-5">
          <p className="font-bold mb-3 flex items-center gap-2">
            🕵️ ¿Cómo funciona?
          </p>
          <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
            <li>Elige tu alias secreto.</li>
            <li>Guarda tu código personal.</li>
            <li>Participa en el chat.</li>
            <li>Intenta descubrir quién es cada alias.</li>
            <li>Guarda tus predicciones.</li>
            <li>Espera hasta la fecha de presentación.</li>
            <li>Descubre las identidades.</li>
            <li>Comprueba cuántos acertaste.</li>
            <li>Compite por ser el mejor detective.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickAction({
  icon,
  label,
  onClick,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-card border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:shadow-md hover:border-primary ${
        highlight ? 'border-accent/40 bg-accent/5' : ''
      }`}
    >
      <div className="text-primary">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

function ParticipantsTab({ code }: { code: string }) {
  const { data, loading } = useFetch<any>(`/api/groups/${code}/participants`)
  if (loading || !data) return <p className="text-muted-foreground">Cargando participantes...</p>
  const participants = data.participants ?? []
  if (participants.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <Users className="size-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No hay participantes todavía.</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-2">
      <h2 className="font-extrabold text-lg mb-3 flex items-center gap-2">
        <Users className="size-5" /> Participantes ({participants.length})
      </h2>
      {participants.map((p: any, i: number) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Card className="border-2">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="text-3xl shrink-0">{p.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{p.alias}</p>
                <p className="text-xs text-muted-foreground">
                  Se unió: {new Date(p.joinedAt).toLocaleDateString('es-CO')}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

function AdminLinkTab({ code }: { code: string }) {
  return (
    <Card className="border-2">
      <CardContent className="p-6 text-center space-y-3">
        <div className="text-5xl">⚙️</div>
        <h2 className="font-extrabold text-xl">Panel de administración</h2>
        <p className="text-muted-foreground text-sm">
          Si eres el organizador del grupo, puedes administrar participantes, configuración y revelación desde el panel de administración.
        </p>
        <Button onClick={() => navigate(`#/admin/${code}`)} className="w-full">
          Ir al panel de administración →
        </Button>
      </CardContent>
    </Card>
  )
}
