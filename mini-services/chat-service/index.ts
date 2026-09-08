import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// In-memory registry of connected sockets.
// Each socket, on `room-join` with payload { groupCode, participantId, alias, avatar },
// joins a Socket.IO room named `group:<groupCode>` so we can broadcast messages
// only to sockets in that group.
//
// We DO NOT validate the participantId against the DB here - the messages
// themselves are written to the DB via the authenticated REST API; the socket
// is only used as a notification channel. We trust that the client only sends
// `message-broadcast` events after successfully POSTing to the API (which is
// authenticated).

interface RoomMember {
  socketId: string
  groupCode: string
  participantId: string
  alias: string
  avatar: string
}

const members = new Map<string, RoomMember>()

io.on('connection', (socket: Socket) => {
  console.log(`[chat-service] socket connected: ${socket.id}`)

  socket.on(
    'room-join',
    (payload: { groupCode: string; participantId: string; alias: string; avatar: string }) => {
      if (!payload?.groupCode) return
      const roomName = `group:${payload.groupCode}`
      socket.join(roomName)
      members.set(socket.id, {
        socketId: socket.id,
        groupCode: payload.groupCode,
        participantId: payload.participantId,
        alias: payload.alias,
        avatar: payload.avatar,
      })
      console.log(
        `[chat-service] ${payload.alias} joined room ${roomName} (socket ${socket.id})`
      )
    }
  )

  socket.on(
    'message-broadcast',
    (payload: {
      groupCode: string
      message: {
        id: string
        content: string
        createdAt: string
        participant: { id: string; alias: string; avatar: string }
      }
    }) => {
      if (!payload?.groupCode || !payload?.message) return
      const roomName = `group:${payload.groupCode}`
      io.to(roomName).emit('message', payload.message)
    }
  )

  socket.on(
    'message-delete',
    (payload: { groupCode: string; messageId: string }) => {
      if (!payload?.groupCode || !payload?.messageId) return
      const roomName = `group:${payload.groupCode}`
      io.to(roomName).emit('message-deleted', { messageId: payload.messageId })
    }
  )

  socket.on(
    'participant-joined',
    (payload: { groupCode: string; participant: { id: string; alias: string; avatar: string } }) => {
      if (!payload?.groupCode) return
      const roomName = `group:${payload.groupCode}`
      io.to(roomName).emit('participant-joined', payload.participant)
    }
  )

  socket.on(
    'group-updated',
    (payload: { groupCode: string }) => {
      if (!payload?.groupCode) return
      const roomName = `group:${payload.groupCode}`
      io.to(roomName).emit('group-updated')
    }
  )

  socket.on('disconnect', () => {
    const m = members.get(socket.id)
    if (m) {
      console.log(`[chat-service] ${m.alias} left room group:${m.groupCode}`)
      members.delete(socket.id)
    } else {
      console.log(`[chat-service] socket disconnected: ${socket.id}`)
    }
  })

  socket.on('error', (err: any) => {
    console.error(`[chat-service] socket error (${socket.id}):`, err)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[chat-service] WebSocket server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('[chat-service] SIGTERM received, shutting down...')
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  console.log('[chat-service] SIGINT received, shutting down...')
  httpServer.close(() => process.exit(0))
})
