'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Sparkles, Copy, Check, AlertTriangle, PartyPopper } from 'lucide-react'
import { navigate } from '@/lib/router'
import { toast } from 'sonner'

interface CreatedGroup {
  group: {
    id: string
    name: string
    code: string
    description: string | null
    presentationDate: string
    presentationTime: string
    timezone: string
    status: string
    createdAt: string
  }
  adminToken: string
  participant: {
    id: string
    alias: string
    avatar: string
    personalCode: string
  }
}

export function CreateGroupView() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedGroup | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [organizerName, setOrganizerName] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name || name.length < 3) {
      setError('El nombre del grupo debe tener al menos 3 caracteres')
      return
    }
    if (!date || !time) {
      setError('Fecha y hora son obligatorias')
      return
    }
    if (!organizerName || organizerName.length < 2) {
      setError('Tu nombre es obligatorio')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          presentationDate: date,
          presentationTime: time,
          organizerName: organizerName.trim(),
          timezone: 'America/Bogota',
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? 'No se pudo crear el grupo')
        return
      }
      setCreated(data)
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  if (created) {
    return <CreatedGroupView created={created} />
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-8 md:py-12">
      <div className="max-w-lg w-full mx-auto">
        <button
          onClick={() => navigate('#/')}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="size-4 mr-1" /> Volver
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-2">
            Crear tu grupo 🎭
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Organiza un juego de Amigos Ultrasecretos en minutos.
          </p>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-accent" />
                Datos del grupo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del grupo *</Label>
                  <Input
                    id="name"
                    placeholder="Amigos Ultrasecretos 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha de presentación *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Descripción (opcional)</Label>
                  <Textarea
                    id="desc"
                    placeholder="Una breve descripción del grupo, motivo, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizer">Tu nombre (organizador/a) *</Label>
                  <Input
                    id="organizer"
                    placeholder="¿Quién eres?"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    maxLength={60}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Serás el primer participante y administrador del grupo.
                  </p>
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
                  className="w-full h-12 text-base font-bold rounded-xl"
                >
                  {loading ? 'Creando...' : '🎉 Crear grupo'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}

function CreatedGroupView({ created }: { created: CreatedGroup }) {
  const { group, adminToken, participant } = created
  const [copied, setCopied] = useState<string>('')
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      toast.success('Copiado al portapapeles')
      setTimeout(() => setCopied(''), 1500)
    })
  }
  const shareLink = `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}#/join/${group.code}`

  const share = async () => {
    const text = `🕵️ Te invito a Amigos Ultrasecretos. Únete al grupo usando este enlace y elige tu alias secreto: ${shareLink}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Amigos Ultrasecretos',
          text,
          url: shareLink,
        })
      } catch {
        // user dismissed
      }
    } else {
      copy(shareLink, 'share-link')
    }
  }

  const enter = () => {
    navigate(`#/group/${group.code}`)
  }

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
              className="text-6xl mb-3"
            >
              <PartyPopper className="size-16 mx-auto text-accent" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              ¡Grupo creado!
            </h1>
            <p className="text-muted-foreground mt-2">
              Comparte el enlace con tus amigos.
            </p>
          </div>

          <Card className="border-2 mb-4">
            <CardContent className="p-5 space-y-4">
              <Section title="Nombre del grupo" value={group.name} />
              <Section
                title="Código del grupo"
                value={group.code}
                mono
                onCopy={() => copy(group.code, 'code')}
                copied={copied === 'code'}
              />
              <Section
                title="Enlace para compartir"
                value={shareLink}
                mono
                small
                onCopy={() => copy(shareLink, 'link')}
                copied={copied === 'link'}
              />
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/40 bg-accent/5 mb-4">
            <CardContent className="p-5 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tu alias</p>
                <p className="text-lg font-bold">
                  {participant.avatar} {participant.alias}
                </p>
              </div>
              <Section
                title="Tu código personal"
                value={participant.personalCode}
                mono
                warning="Este código es privado. Guárdalo porque lo necesitarás para volver a entrar."
                onCopy={() => copy(participant.personalCode, 'personal')}
                copied={copied === 'personal'}
              />
            </CardContent>
          </Card>

          <Card className="border-2 border-destructive/40 bg-destructive/5 mb-6">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                <p className="font-bold">Código de administrador</p>
              </div>
              <Section
                title=""
                value={adminToken}
                mono
                warning="Guarda este código en un lugar seguro. Lo necesitarás para administrar el grupo. No lo compartas con los participantes."
                onCopy={() => copy(adminToken, 'admin')}
                copied={copied === 'admin'}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl"
              onClick={share}
            >
              📤 Compartir
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl font-bold"
              onClick={enter}
            >
              Entrar al grupo →
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

function Section({
  title,
  value,
  mono,
  small,
  warning,
  onCopy,
  copied,
}: {
  title: string
  value: string
  mono?: boolean
  small?: boolean
  warning?: string
  onCopy?: () => void
  copied?: boolean
}) {
  return (
    <div>
      {title && (
        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{title}</p>
      )}
      <div className="flex items-center gap-2">
        <code
          className={`flex-1 bg-card border rounded-lg px-3 py-2 ${mono ? 'font-mono' : ''} ${small ? 'text-xs break-all' : 'text-base font-semibold'}`}
        >
          {value}
        </code>
        {onCopy && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCopy}
            className="shrink-0"
            aria-label="Copiar"
          >
            {copied ? (
              <Check className="size-4 text-green-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        )}
      </div>
      {warning && (
        <p className="text-xs text-muted-foreground mt-2 italic">{warning}</p>
      )}
    </div>
  )
}
