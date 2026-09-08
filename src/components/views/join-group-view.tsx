'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Users, Calendar, AlertTriangle, PartyPopper, KeyRound, Eye, EyeOff, Lock } from 'lucide-react'
import { navigate, goBack } from '@/lib/router'
import { useFetch } from '@/hooks/use-fetch'
import { formatPresentationDate } from '@/lib/time'

export function JoinView() {
  const [code, setCode] = useState('')
  return (
    <main className="flex-1 flex flex-col px-4 py-8 md:py-12">
      <div className="max-w-lg w-full mx-auto">
        <button
          onClick={() => goBack('#/')}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="size-4 mr-1" /> Volver
        </button>

        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-2">
          Unirme a un grupo 🎭
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Introduce el código del grupo que te compartieron.
        </p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-2">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código del grupo</Label>
                <Input
                  id="code"
                  placeholder="Ej: CONSENSO2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg tracking-wider"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && code.trim()) {
                      navigate(`#/join/${code.trim()}`)
                    }
                  }}
                />
              </div>
              <Button
                className="w-full h-12 rounded-xl font-bold"
                disabled={code.trim().length < 3}
                onClick={() => navigate(`#/join/${code.trim()}`)}
              >
                Continuar →
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                ¿Tienes el enlace? Ábrelo directamente y saldrá esta pantalla.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}

export function JoinGroupView({ code }: { code: string }) {
  const { data, loading, error } = useFetch<any>(`/api/groups/${code}`)
  const [alias, setAlias] = useState('')
  const [realName, setRealName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<any>(null)
  const [sessionCheck, setSessionCheck] = useState<'checking' | 'no-session' | 'has-session'>('checking')

  const group = data?.group

  // Check if user already has a session for THIS group → auto-redirect
  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.authenticated && d.groupCode === code) {
          setSessionCheck('has-session')
          navigate(`#/group/${code}`)
        } else {
          setSessionCheck('no-session')
        }
      })
      .catch(() => {
        if (!cancelled) setSessionCheck('no-session')
      })
    return () => {
      cancelled = true
    }
  }, [code])

  const submit = async () => {
    setSubmitError(null)
    if (alias.trim().length < 2) {
      setSubmitError('El alias debe tener al menos 2 caracteres')
      return
    }
    if (realName.trim().length < 2) {
      setSubmitError('Tu nombre real es obligatorio')
      return
    }
    if (password.length < 4) {
      setSubmitError('La contraseña debe tener al menos 4 caracteres')
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch(`/api/groups/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias: alias.trim(),
          realName: realName.trim(),
          password,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setSubmitError(data.error ?? 'No se pudo unir')
        return
      }
      setSuccess(data)
    } catch {
      setSubmitError('Error de red')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return <JoinedSuccess group={group} participant={success.participant} code={code} />
  }

  if (loading || sessionCheck === 'checking') {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <p className="text-muted-foreground">Cargando...</p>
      </main>
    )
  }

  if (sessionCheck === 'has-session') {
    return null
  }

  if (error || !group) {
    return (
      <main className="flex-1 flex flex-col px-4 py-8">
        <div className="max-w-lg w-full mx-auto">
          <button
            onClick={() => goBack('#/')}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ChevronLeft className="size-4 mr-1" /> Volver
          </button>
          <Card className="border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="size-12 mx-auto text-destructive mb-3" />
              <h2 className="text-xl font-bold mb-2">Grupo no encontrado</h2>
              <p className="text-muted-foreground text-sm mb-4">
                {error ?? 'No existe un grupo con ese código.'}
              </p>
              <Button onClick={() => navigate('#/join')} variant="outline">
                Probar con otro código
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-8 md:py-12">
      <div className="max-w-lg w-full mx-auto">
        <button
          onClick={() => goBack('#/')}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="size-4 mr-1" /> Volver
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🕵️</div>
            <h1 className="text-2xl font-bold">Únete a Amigos Ultrasecretos</h1>
          </div>

          <Card className="border-2 mb-4">
            <CardContent className="p-5">
              <h2 className="font-extrabold text-xl text-center">🎭 {group.name}</h2>
              {group.description && (
                <p className="text-muted-foreground text-center text-sm mt-1">
                  {group.description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <InfoCard icon={<Users className="size-5" />} label="Participantes" value={`${data.participantCount}`} />
                <InfoCard
                  icon={<Calendar className="size-5" />}
                  label="Presentación"
                  value={formatPresentationDate(group.presentationDate, group.presentationTime, group.timezone)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Crea tu identidad secreta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alias">Tu alias *</Label>
                <Input
                  id="alias"
                  placeholder="El Zorro, La Rana, El Fantasma..."
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  maxLength={24}
                />
                <p className="text-xs text-muted-foreground">
                  Así te verán los demás. No podrá cambiarse después.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="realName">Tu nombre real *</Label>
                <Input
                  id="realName"
                  placeholder="Tu nombre real (privado)"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  🔒 Privado. Solo se usará para validar las adivinanzas y la revelación. Nadie más lo verá.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Crea tu contraseña personal</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tu contraseña (privada)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={100}
                    className="pr-10"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !submitting) submit()
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  🔒 La usaremos para reconocerte cuando entres desde otro dispositivo. No la compartas con nadie.
                </p>
              </div>

              {submitError && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2 border border-destructive/30">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <Button
                className="w-full h-12 rounded-xl font-bold"
                disabled={submitting}
                onClick={submit}
              >
                {submitting ? 'Uniéndose...' : '🎭 Unirme al grupo'}
              </Button>

              <div className="pt-3 border-t border-border/60">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  ¿Ya tienes una identidad en este grupo?
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`#/login?code=${encodeURIComponent(code)}`)}
                >
                  <KeyRound className="size-4 mr-2" />
                  Recuperar mi acceso
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border rounded-xl p-3 flex items-start gap-3">
      <div className="text-primary mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="font-semibold text-sm truncate">{value}</p>
      </div>
    </div>
  )
}

function JoinedSuccess({ group, participant, code }: { group: any; participant: any; code: string }) {
  return (
    <main className="flex-1 flex flex-col px-4 py-8 md:py-12">
      <div className="max-w-lg w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-7xl mb-3"
            >
              {participant.avatar}
            </motion.div>
            <h1 className="text-3xl font-extrabold">
              ¡Ya estás dentro!
            </h1>
            <p className="text-muted-foreground mt-2">
              Has entrado al grupo <strong>{group?.name}</strong>.
            </p>
            <p className="font-bold mt-1 text-lg">
              {participant.avatar} {participant.alias}
            </p>
          </div>

          <Card className="border-2 border-accent/40 bg-accent/5 mb-6">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="size-5 text-accent shrink-0" />
                <p className="font-bold">Tu acceso está guardado en este dispositivo</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Has creado tu alias <strong>{participant.alias}</strong> y una contraseña personal.
                No te la volveremos a preguntar mientras mantengas este dispositivo.
              </p>
              <div className="bg-card/80 border border-border/60 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="font-bold text-foreground mb-1">⚠️ Para recuperar tu acceso</p>
                Si entras desde otro dispositivo, usa <strong>"Recuperar mi acceso"</strong> con tu
                alias y la contraseña que acabas de crear. Guárdala en un lugar seguro: no la
                almacenamos en texto plano y no podemos enviártela si la olvidas.
              </div>
              <p className="text-xs text-muted-foreground italic text-center">
                💡 Las próximas veces que abras el enlace, entrarás automáticamente.
              </p>
            </CardContent>
          </Card>

          <Button
            className="w-full h-12 rounded-xl font-bold text-base"
            onClick={() => navigate(`#/group/${code}`)}
          >
            <PartyPopper className="size-4 mr-2" />
        Entrar al grupo →
          </Button>
        </motion.div>
      </div>
    </main>
  )
}
