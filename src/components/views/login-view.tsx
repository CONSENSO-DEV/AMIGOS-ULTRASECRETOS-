'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, KeyRound, AlertTriangle, LogIn } from 'lucide-react'
import { navigate, goBack } from '@/lib/router'
import { toast } from 'sonner'

export function LoginView({ presetCode = '' }: { presetCode?: string }) {
  const [groupCode, setGroupCode] = useState(presetCode)
  const [alias, setAlias] = useState('')
  const [personalCode, setPersonalCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!groupCode.trim() || !alias.trim() || !personalCode.trim()) {
      setError('Completa todos los campos')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupCode: groupCode.trim(),
          alias: alias.trim(),
          personalCode: personalCode.trim().toUpperCase(),
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? 'No se pudo iniciar sesión')
        return
      }
      toast.success(`¡Bienvenido de nuevo, ${data.participant.alias}! ${data.participant.avatar}`)
      navigate(`#/group/${data.groupCode}`)
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🔐</div>
            <h1 className="text-3xl font-extrabold">Recuperar mi acceso</h1>
            <p className="text-muted-foreground mt-2">
              {presetCode
                ? 'Usa tu alias y código personal para recuperar tu identidad.'
                : 'Usa tu código personal para volver a entrar.'}
            </p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-5 text-accent" />
                Tus credenciales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                {presetCode ? (
                  <div className="bg-muted/40 border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Grupo
                      </p>
                      <p className="font-mono font-bold">{presetCode}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`#/join/${presetCode}`)}
                    >
                      Cambiar grupo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="groupCode">Código del grupo</Label>
                    <Input
                      id="groupCode"
                      placeholder="Ej: CONSENSO2026"
                      value={groupCode}
                      onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="alias">Mi alias</Label>
                  <Input
                    id="alias"
                    placeholder="El Zorro"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personalCode">Código personal</Label>
                  <Input
                    id="personalCode"
                    placeholder="XXXX-XXXX"
                    value={personalCode}
                    onChange={(e) => setPersonalCode(e.target.value.toUpperCase())}
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
                  <LogIn className="size-4 mr-2" />
                  {loading ? 'Validando...' : 'Entrar'}
                </Button>
                <p className="text-xs text-muted-foreground text-center italic">
                  Por seguridad, no revelamos cuál de los datos es incorrecto.
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}
