'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export interface ChatMessage {
  id: string
  content: string
  createdAt: string
  participant: { id: string; alias: string; avatar: string }
}

export interface ChatHooks {
  socket: Socket | null
  isConnected: boolean
  joinRoom: (groupCode: string, participant: { id: string; alias: string; avatar: string }) => void
  broadcastMessage: (groupCode: string, message: ChatMessage) => void
  broadcastDelete: (groupCode: string, messageId: string) => void
  onMessage: (cb: (m: ChatMessage) => void) => () => void
  onMessageDeleted: (cb: (msgId: string) => void) => () => void
  onParticipantJoined: (cb: (p: { id: string; alias: string; avatar: string }) => void) => () => void
  onGroupUpdated: (cb: () => void) => () => void
}

export function useChatSocket(): ChatHooks {
  // Create socket once (lazy initializer is allowed in useState).
  const [socket] = useState<Socket | null>(() => {
    if (typeof window === 'undefined') return null
    return io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })
  })
  const [isConnected, setIsConnected] = useState(false)
  const messageHandlers = useRef<Array<(m: ChatMessage) => void>>([])
  const messageDeletedHandlers = useRef<Array<(id: string) => void>>([])
  const participantJoinedHandlers = useRef<Array<(p: any) => void>>([])
  const groupUpdatedHandlers = useRef<Array<() => void>>([])

  useEffect(() => {
    if (!socket) return
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    const onMessage = (m: ChatMessage) => {
      messageHandlers.current.forEach((cb) => cb(m))
    }
    const onMessageDeleted = ({ messageId }: { messageId: string }) => {
      messageDeletedHandlers.current.forEach((cb) => cb(messageId))
    }
    const onParticipantJoined = (p: any) => {
      participantJoinedHandlers.current.forEach((cb) => cb(p))
    }
    const onGroupUpdated = () => {
      groupUpdatedHandlers.current.forEach((cb) => cb())
    }
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('message', onMessage)
    socket.on('message-deleted', onMessageDeleted)
    socket.on('participant-joined', onParticipantJoined)
    socket.on('group-updated', onGroupUpdated)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('message', onMessage)
      socket.off('message-deleted', onMessageDeleted)
      socket.off('participant-joined', onParticipantJoined)
      socket.off('group-updated', onGroupUpdated)
      socket.disconnect()
    }
  }, [socket])

  const joinRoom = useCallback(
    (groupCode: string, participant: { id: string; alias: string; avatar: string }) => {
      if (!socket) return
      socket.emit('room-join', { groupCode, ...participant })
    },
    [socket]
  )

  const broadcastMessage = useCallback(
    (groupCode: string, message: ChatMessage) => {
      if (!socket) return
      socket.emit('message-broadcast', { groupCode, message })
    },
    [socket]
  )

  const broadcastDelete = useCallback(
    (groupCode: string, messageId: string) => {
      if (!socket) return
      socket.emit('message-delete', { groupCode, messageId })
    },
    [socket]
  )

  const onMessage = useCallback((cb: (m: ChatMessage) => void) => {
    messageHandlers.current.push(cb)
    return () => {
      messageHandlers.current = messageHandlers.current.filter((h) => h !== cb)
    }
  }, [])

  const onMessageDeleted = useCallback((cb: (id: string) => void) => {
    messageDeletedHandlers.current.push(cb)
    return () => {
      messageDeletedHandlers.current = messageDeletedHandlers.current.filter((h) => h !== cb)
    }
  }, [])

  const onParticipantJoined = useCallback((cb: (p: any) => void) => {
    participantJoinedHandlers.current.push(cb)
    return () => {
      participantJoinedHandlers.current = participantJoinedHandlers.current.filter((h) => h !== cb)
    }
  }, [])

  const onGroupUpdated = useCallback((cb: () => void) => {
    groupUpdatedHandlers.current.push(cb)
    return () => {
      groupUpdatedHandlers.current = groupUpdatedHandlers.current.filter((h) => h !== cb)
    }
  }, [])

  return {
    socket,
    isConnected,
    joinRoom,
    broadcastMessage,
    broadcastDelete,
    onMessage,
    onMessageDeleted,
    onParticipantJoined,
    onGroupUpdated,
  }
}
