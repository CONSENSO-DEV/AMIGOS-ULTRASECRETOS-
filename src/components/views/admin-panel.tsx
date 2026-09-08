'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChevronLeft,
  Users,
  MessageCircle,
  Settings,
  Share2,
  Lock,
  Unlock,
  Eye,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  LogOut,
  EyeOff,
} from 'lucide-react'
import { navigate, goBack } from '@/lib/router'
import { toast } from 'sonner'
import { useFetch } from '@/hooks/use-fetch'
import { formatPresentationDate } from '@/lib/time'

export function AdminLoginView({ presetCode = '' }: { presetCode?: string }) {
  const [groupCode, setGroupCode] = useState(presetCode)
  const [adminToken, setAdminToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!groupCode.trim() || !adminToken.trim()) {
      setError('Completa todos los campos')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupCode: groupCode.trim(), adminToken: adminToken.trim() }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? 'Error')
        return
      }
      toast.success('Sesión de administrador iniciada')
      navigate(`#/admin/${data.groupCode}`)
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
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

        <div className="text-center mb-6">
          <div className="text-5xl mb-2">⚙️</div>
          <h1 className="text-3xl font-extrabold">Panel de administración</h1>
          <p className="text-muted-foreground mt-2">
            Accede con tu código de administrador.
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ag">Código del grupo</Label>
                <Input
                  id="ag"
                  placeholder="Ej: CONSENSO2026"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  className="font-mono"
                  disabled={!!presetCode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="at">Código de administrador</Label>
                <Input
                  id="at"
                  placeholder="ADMIN-XXXXXX"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </div>
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2 border border-destructive/30">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export function AdminDashboardView({ code }: { code: string }) {
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<'overview' | 'participants' | 'settings' | 'share'>('overview')

  useEffect(() => {
    fetch('/api/auth/admin/me')
      .then((r) => r.json())
      .then((data) => {
        setAuthed(!!data.authenticated && data.groupCode === code)
        setAuthChecked(true)
      })
      .catch(() => {
        setAuthChecked(true)
      })
  }, [code])

  if (!authChecked) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Verificando acceso...</p>
      </div>
    )
  }
  if (!authed) {
    // Redirect to admin login with preset code
    navigate(`#/admin?code=${encodeURIComponent(code)}`)
    return null
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-8 md:py-12">
      <div className="max-w-3xl w-full mx-auto">
        <button
          onClick={() => goBack('#/')}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="size-4 mr-1" /> Volver
        </button>

        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              ⚙️ Panel de administración
            </h1>
            <p className="text-muted-foreground text-sm">Código: {code}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Only clear the admin cookie. Participant session (if any) is preserved.
              document.cookie = 'us_admin_session=; max-age=0; path=/'
              navigate('#/')
            }}
          >
            <LogOut className="size-4 mr-2" />
            Salir
          </Button>
        </div>

        {/* Banner: privacy reminder */}
        <div className="bg-muted/40 border border-border rounded-lg p-3 mb-6 flex items-start gap-2 text-xs text-muted-foreground">
          <EyeOff className="size-4 shrink-0 mt-0.5" />
          <span>
            <strong>Privacidad:</strong> como administrador solo puedes gestionar aspectos técnicos.
            Los nombres reales y las respuestas de los participantes se mantienen privados hasta la revelación.
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>
            <Settings className="size-4 mr-1" /> Resumen
          </TabBtn>
          <TabBtn active={tab === 'participants'} onClick={() => setTab('participants')}>
            <Users className="size-4 mr-1" /> Participantes
          </TabBtn>
          <TabBtn active={tab === 'settings'} onClick={() => setTab('settings')}>
            <Settings className="size-4 mr-1" /> Configuración
          </TabBtn>
          <TabBtn active={tab === 'share'} onClick={() => setTab('share')}>
            <Share2 className="size-4 mr-1" /> Compartir
          </TabBtn>
        </div>

        {tab === 'overview' && <OverviewTab code={code} />}
        {tab === 'participants' && <ParticipantsTab code={code} />}
        {tab === 'settings' && <SettingsTab code={code} />}
        {tab === 'share' && <ShareTab code={code} />}
      </div>
    </main>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className="rounded-full"
    >
      {children}
    </Button>
  )
}

function OverviewTab({ code }: { code: string }) {
  const { data, loading, refresh } = useFetch<any>(`/api/groups/${code}/admin`)
  if (loading || !data) return <p className="text-muted-foreground">Cargando...</p>
  const { group, participantCount, messageCount } = data
  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardContent className="p-5">
          <h2 className="font-bold text-lg mb-3">{group.name}</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Estado" value={group.status} />
            <Info label="Participantes" value={`${participantCount}`} />
            <Info label="Mensajes" value={`${messageCount}`} />
            <Info
              label="Presentación"
              value={formatPresentationDate(group.presentationDate, group.presentationTime, group.timezone)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Participar también en el juego */}
      <Card className="border-2 border-accent/40 bg-accent/5">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-3xl shrink-0">🎭</div>
          <div className="flex-1">
            <p className="font-bold">¿Quieres jugar también?</p>
            <p className="text-sm text-muted-foreground">
              Regístrate como participante con tu propio alias. Tu identidad de administrador y de participante serán independientes.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`#/join/${code}`)}
          >
            <MessageCircle className="size-4 mr-2" />
            Participar también
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-16 justify-start"
          onClick={async () => {
            const r = await fetch(`/api/groups/${code}/admin?action=lock-registration`, { method: 'PUT' })
            const d = await r.json()
            if (r.ok) {
              toast.success('Inscripciones cerradas')
              refresh()
            } else {
              toast.error(d.error ?? 'Error')
            }
          }}
        >
          <Lock className="size-5 mr-3" /> Cerrar inscripciones
        </Button>
        <Button
          variant="outline"
          className="h-16 justify-start"
          onClick={async () => {
            const r = await fetch(`/api/groups/${code}/admin?action=open-registration`, { method: 'PUT' })
            const d = await r.json()
            if (r.ok) {
              toast.success('Inscripciones abiertas')
              refresh()
            } else {
              toast.error(d.error ?? 'Error')
            }
          }}
        >
          <Unlock className="size-5 mr-3" /> Abrir inscripciones
        </Button>
        <Button
          variant="outline"
          className="h-16 justify-start border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={async () => {
            if (!confirm('¿Iniciar la revelación manualmente? Esta acción no se puede deshacer.')) return
            const r = await fetch(`/api/groups/${code}/admin?action=force-reveal`, { method: 'PUT' })
            const d = await r.json()
            if (r.ok) {
              toast.success('¡Revelación iniciada! 🎉')
              refresh()
            } else {
              toast.error(d.error ?? 'Error')
            }
          }}
        >
          <Eye className="size-5 mr-3" /> Iniciar revelación
        </Button>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}

function ParticipantsTab({ code }: { code: string }) {
  const { data, loading, refresh } = useFetch<any>(`/api/groups/${code}/admin`)
  if (loading || !data) return <p className="text-muted-foreground">Cargando...</p>
  const participants = data.participants ?? []
  if (participants.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <Users className="size-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No hay participantes todavía.</p>
          <p className="text-xs text-muted-foreground mt-1">Comparte el enlace para que se unan.</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-2">
      {/* Privacy banner */}
      <div className="bg-muted/40 border rounded-lg p-2 flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <EyeOff className="size-3 shrink-0" />
        <span>Solo se muestran los alias. Los nombres reales se mantienen privados hasta la revelación.</span>
      </div>
      {participants.map((p: any) => (
        <Card key={p.id} className="border-2">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="text-3xl shrink-0">{p.avatar}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold">{p.alias}</p>
              <p className="text-xs text-muted-foreground">
                Unido: {new Date(p.joinedAt).toLocaleString('es-CO')}
              </p>
              {!p.active && (
                <span className="text-xs text-destructive">Inactivo</span>
              )}
            </div>
            {p.active ? (
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  if (!confirm(`¿Expulsar a ${p.alias}?`)) return
                  const r = await fetch(
                    `/api/groups/${code}/admin?participantId=${p.id}`,
                    { method: 'DELETE' }
                  )
                  if (r.ok) {
                    toast.success('Participante expulsado')
                    refresh()
                  } else {
                    toast.error('Error')
                  }
                }}
              >
                Expulsar
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Inactivo</span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SettingsTab({ code }: { code: string }) {
  const { data, loading, refresh } = useFetch<any>(`/api/groups/${code}/admin`)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data?.group) {
      setName(data.group.name)
      setDescription(data.group.description ?? '')
      setDate(data.group.presentationDate)
      setTime(data.group.presentationTime)
    }
  }, [data])

  if (loading || !data) return <p className="text-muted-foreground">Cargando...</p>

  const save = async () => {
    setSaving(true)
    try {
      const r = await fetch(`/api/groups/${code}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          presentationDate: date,
          presentationTime: time,
        }),
      })
      if (r.ok) {
        toast.success('Configuración guardada')
        refresh()
      } else {
        toast.error('Error al guardar')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Configuración del grupo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="n">Nombre</Label>
          <Input id="n" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="d">Descripción</Label>
          <Textarea
            id="d"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pd">Fecha</Label>
            <Input id="pd" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pt">Hora</Label>
            <Input id="pt" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </CardContent>
    </Card>
  )
}

function ShareTab({ code }: { code: string }) {
  const { data, loading } = useFetch<any>(`/api/groups/${code}/admin`)
  const [copied, setCopied] = useState<string>('')
  if (loading || !data) return <p className="text-muted-foreground">Cargando...</p>
  const link = `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}#/join/${code}`
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      toast.success('Copiado')
      setTimeout(() => setCopied(''), 1500)
    })
  }
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Amigos Ultrasecretos',
          text: `🕵️ Te invito a Amigos Ultrasecretos. Únete al grupo usando este enlace y elige tu alias secreto.`,
          url: link,
        })
      } catch {}
    } else {
      copy(link, 'link')
    }
  }
  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardContent className="p-5 space-y-3">
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Código del grupo</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 bg-card border rounded-lg px-3 py-2 font-mono font-bold">
                {code}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copy(code, 'code')}
              >
                {copied === 'code' ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Enlace de invitación</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 bg-card border rounded-lg px-3 py-2 font-mono text-xs break-all">
                {link}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copy(link, 'link')}
              >
                {copied === 'link' ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
          <Button onClick={share} className="w-full">
            <Share2 className="size-4 mr-2" /> Compartir
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="size-4 text-destructive" /> Regenerar código de invitación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Genera un nuevo código. El enlace anterior dejará de funcionar.
          </p>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={async () => {
              if (!confirm('¿Regenerar el código? Los enlaces anteriores dejarán de funcionar.')) return
              const r = await fetch(`/api/groups/${code}/admin?action=regenerate-code`, { method: 'PUT' })
              const d = await r.json()
              if (r.ok) {
                toast.success('Código regenerado')
                navigate(`#/admin/${d.group.code}`)
              } else {
                toast.error(d.error ?? 'Error')
              }
            }}
          >
            Regenerar código
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
