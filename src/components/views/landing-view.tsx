'use client'

import { motion } from 'framer-motion'
import { MysteryLogo } from '@/components/mystery-logo'
import { Button } from '@/components/ui/button'
import { Sparkles, Users, MessageCircle, Trophy, Eye, Lock } from 'lucide-react'
import { navigate } from '@/lib/router'
import { useState } from 'react'

export function LandingView() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 relative overflow-hidden">
        {/* Floating decorative emojis */}
        <FloatingEmoji emoji="🎭" className="top-10 left-[10%] text-5xl opacity-20" delay={0} />
        <FloatingEmoji emoji="🔍" className="top-20 right-[10%] text-4xl opacity-20" delay={0.5} />
        <FloatingEmoji emoji="🔐" className="bottom-32 left-[15%] text-5xl opacity-15" delay={1} />
        <FloatingEmoji emoji="🎁" className="bottom-40 right-[15%] text-4xl opacity-15" delay={1.5} />
        <FloatingEmoji emoji="🎉" className="top-1/3 right-[5%] text-3xl opacity-15" delay={2} />
        <FloatingEmoji emoji="🕵️" className="bottom-10 right-[20%] text-4xl opacity-20" delay={2.5} />

        <div className="max-w-2xl w-full text-center z-10">
          <MysteryLogo size="xl" />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground mt-6 mb-10 font-medium"
          >
            ¿Crees saber quién se esconde detrás de cada alias?
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
          >
            <Button
              size="lg"
              className="text-base px-8 h-14 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-shadow"
              onClick={() => navigate('#/create')}
            >
              <Sparkles className="size-5 mr-2" />
              Crear grupo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-14 rounded-2xl font-bold border-2"
              onClick={() => navigate('#/join')}
            >
              <Users className="size-5 mr-2" />
              Unirme a un grupo
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-sm text-muted-foreground italic"
          >
            Sin cuentas. Sin contraseñas. Solo secretos.
          </motion.p>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12 md:py-16 bg-card/40 border-t border-border/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="🎭"
              title="1. Elige tu alias"
              desc="Entra al grupo con un código y elige un alias secreto. Nadie sabrá quién eres."
            />
            <FeatureCard
              icon="💬"
              title="2. Chatea en grupo"
              desc="Envía mensajes con tu alias. Conversa, sospecha y confunde al resto."
            />
            <FeatureCard
              icon="🕵️"
              title="3. Adivina quién es quién"
              desc="Intenta descubrir la identidad real detrás de cada alias antes de la revelación."
            />
            <FeatureCard
              icon="🏆"
              title="4. Compite por el ranking"
              desc="Por cada acierto ganas un punto. ¿Serás el mejor detective?"
            />
            <FeatureCard
              icon="🎉"
              title="5. La gran revelación"
              desc="Llega la fecha y las identidades se revelan con estilo, confeti y sorpresas."
            />
            <FeatureCard
              icon="🔐"
              title="6. Totalmente privado"
              desc="Sin cuentas. Sin correos. Solo códigos secretos. Tu nombre real está siempre protegido."
            />
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-3">
              ¿Quieres probar la app sin crear un grupo?
            </p>
            <DemoButton />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function FloatingEmoji({
  emoji,
  className,
  delay,
}: {
  emoji: string
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: [0, -12, 0] }}
      transition={{
        opacity: { delay: delay ?? 0, duration: 1 },
        y: { repeat: Infinity, duration: 4, ease: 'easeInOut', delay: delay ?? 0 },
      }}
      className={`absolute hidden md:block pointer-events-none ${className ?? ''}`}
      aria-hidden
    >
      {emoji}
    </motion.div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-base mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  )
}

function DemoButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const createDemo = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/seed/demo', { method: 'POST' })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? 'No se pudo crear el demo')
        return
      }
      setResult(data)
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <Button
        variant="secondary"
        onClick={createDemo}
        disabled={loading}
        className="h-12 px-6 rounded-xl font-semibold"
      >
        {loading ? 'Creando demo...' : '🎮 Crear grupo demo'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && (
        <DemoCreatedCard
          group={result.group}
          adminToken={result.adminToken}
          participants={result.participants}
        />
      )}
    </div>
  )
}

function DemoCreatedCard({
  group,
  adminToken,
  participants,
}: {
  group: any
  adminToken: string
  participants: any[]
}) {
  const [copied, setCopied] = useState<string>('')
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(''), 1500)
    })
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-5 border-2 border-accent/40 bg-accent/5 rounded-2xl text-left max-w-md"
    >
      <p className="font-bold text-base mb-2 text-center">
        🎉 ¡Grupo demo creado!
      </p>
      <div className="space-y-2 text-sm">
        <Row label="Grupo" value={group.name} />
        <Row label="Código" value={group.code} />
        <Row label="Admin" value={adminToken} mono />
        <div className="border-t border-border/60 pt-2 mt-2">
          <p className="text-xs text-muted-foreground mb-2">
            Participantes (entrar con su contraseña):
          </p>
          {participants.map((p: any, i: number) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-xs py-1 border-b last:border-b-0 border-border/40"
            >
              <span>
                {p.avatar} <strong>{p.alias}</strong> <span className="text-muted-foreground">({p.realName})</span>
              </span>
              <button
                onClick={() => copy(p.password, `${p.alias}-pw`)}
                className="font-mono px-2 py-1 bg-card rounded border hover:border-accent transition-colors"
              >
                {copied === `${p.alias}-pw` ? '¡Copiado!' : p.password}
              </button>
            </div>
          ))}
        </div>
        <Button
          className="w-full mt-3"
          onClick={() => navigate(`#/login?code=${encodeURIComponent(group.code)}`)}
        >
          Entrar al demo →
        </Button>
      </div>
    </motion.div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
        className={`font-medium hover:text-accent transition-colors ${mono ? 'font-mono' : ''}`}
      >
        {copied ? '¡Copiado!' : value}
      </button>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/30 py-6 mt-auto">
      <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Lock className="size-3" />
          <span>Hecho con misterio 🕵️ — Sin cuentas, solo secretos.</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#/" className="hover:text-foreground">Inicio</a>
          <span>·</span>
          <a href="#/create" className="hover:text-foreground">Crear grupo</a>
          <span>·</span>
          <a href="#/login" className="hover:text-foreground">Recuperar acceso</a>
          <span>·</span>
          <a href="#/admin" className="hover:text-foreground">Admin</a>
        </div>
      </div>
    </footer>
  )
}
