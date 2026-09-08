'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChatSocket, type ChatMessage } from '@/hooks/use-chat-socket'
import { Trash2, Send, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'

interface ChatProps {
  groupCode: string
  selfId: string
  selfAlias: string
  selfAvatar: string
  isAdmin: boolean
}

export function ChatPanel({ groupCode, selfId, selfAlias, selfAvatar, isAdmin }: ChatProps) {
  const {
    isConnected,
    joinRoom,
    broadcastMessage,
    broadcastDelete,
    onMessage,
    onMessageDeleted,
    onParticipantJoined,
  } = useChatSocket()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [newMessagesBadge, setNewMessagesBadge] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const initialized = useRef(false)

  // Initial fetch
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/groups/${groupCode}/messages`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.ok) {
          setMessages(data.messages)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [groupCode])

  // Join socket room
  useEffect(() => {
    if (!isConnected || initialized.current) return
    joinRoom(groupCode, { id: selfId, alias: selfAlias, avatar: selfAvatar })
    initialized.current = true
  }, [isConnected, groupCode, selfId, selfAlias, selfAvatar, joinRoom])

  // Subscribe to socket events
  useEffect(() => {
    const unsub1 = onMessage((m) => {
      setMessages((prev) => {
        // Avoid duplicates (in case we also sent it)
        if (prev.some((p) => p.id === m.id)) return prev
        return [...prev, m]
      })
      if (!atBottom) {
        setNewMessagesBadge(true)
      }
    })
    const unsub2 = onMessageDeleted((id) => {
      setMessages((prev) => prev.filter((m) => m.id !== id))
    })
    const unsub3 = onParticipantJoined(() => {
      // Optionally show a toast
      // toast.info('Nuevo participante en el grupo')
    })
    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [onMessage, onMessageDeleted, onParticipantJoined, atBottom])

  // Auto-scroll to bottom when messages change (if at bottom)
  useEffect(() => {
    if (atBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, atBottom])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setAtBottom(isAtBottom)
    if (isAtBottom) {
      setNewMessagesBadge(false)
    }
  }, [])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      setNewMessagesBadge(false)
    }
  }

  const send = async () => {
    const content = input.trim()
    if (!content) return
    setSending(true)
    setInput('')
    try {
      const r = await fetch(`/api/groups/${groupCode}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error ?? 'No se pudo enviar el mensaje')
        setInput(content)
        return
      }
      // Add locally and broadcast
      setMessages((prev) => {
        if (prev.some((p) => p.id === data.message.id)) return prev
        return [...prev, data.message]
      })
      broadcastMessage(groupCode, data.message)
    } catch {
      toast.error('Error de red')
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (msgId: string) => {
    const r = await fetch(`/api/groups/${groupCode}/messages?id=${msgId}`, {
      method: 'DELETE',
    })
    if (r.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
      broadcastDelete(groupCode, msgId)
      toast.success('Mensaje eliminado')
    } else {
      const data = await r.json().catch(() => ({}))
      toast.error(data.error ?? 'No se pudo eliminar')
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-220px)] min-h-[400px]">
      <Card className="flex-1 flex flex-col overflow-hidden border-2">
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <div className="px-4 py-3 border-b bg-card flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg shrink-0">💬</span>
              <h2 className="font-bold truncate">Chat grupal</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  isConnected
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                }`}
              >
                {isConnected ? 'En vivo' : 'Conectando...'}
              </span>
            </div>
          </div>

          <div className="flex-1 relative min-h-0">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="absolute inset-0 overflow-y-auto scroll-mystery p-4 space-y-3"
            >
              {loading ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Cargando mensajes...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <div className="text-4xl mb-2">💬</div>
                  Todavía nadie ha escrito en el chat.<br />
                  ¡Sé el primero en romper el hielo!
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      isMine={m.participant.id === selfId}
                      canDelete={m.participant.id === selfId || isAdmin}
                      onDelete={() => handleDelete(m.id)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {newMessagesBadge && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 animate-fade-in-up hover:bg-primary/90"
              >
                <ArrowDown className="size-3" />
                Mensajes nuevos
              </button>
            )}
          </div>

          <div className="p-3 border-t bg-card flex gap-2">
            <Input
              placeholder="Escribe un mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              maxLength={500}
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={send}
              disabled={sending || !input.trim()}
              size="icon"
              className="shrink-0"
              aria-label="Enviar"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="text-xs text-muted-foreground text-center mt-2">
        {input.length}/500 caracteres
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isMine,
  canDelete,
  onDelete,
}: {
  message: ChatMessage
  isMine: boolean
  canDelete: boolean
  onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className="text-2xl shrink-0 mt-1">{message.participant.avatar}</div>
      <div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
        <div className="text-xs text-muted-foreground mb-0.5 px-1">
          {message.participant.alias}
          <span className="ml-2 opacity-60">
            {new Date(message.createdAt).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div
          className={`group relative px-3 py-2 rounded-2xl break-words ${
            isMine
              ? 'bg-primary text-primary-foreground rounded-tr-md'
              : 'bg-secondary text-secondary-foreground rounded-tl-md'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          {canDelete && (
            <button
              onClick={() => {
                if (confirming) onDelete()
                else setConfirming(true)
                setTimeout(() => setConfirming(false), 2000)
              }}
              className={`absolute -top-2 -right-2 ${
                isMine ? 'bg-destructive text-white' : 'bg-destructive text-white'
              } rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity`}
              aria-label="Eliminar mensaje"
              title={confirming ? 'Click para confirmar' : 'Eliminar'}
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
