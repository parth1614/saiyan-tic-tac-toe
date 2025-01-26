import { Server } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import type { Socket as NetSocket } from 'net'
import type { NextApiRequest, NextApiResponse } from 'next'

interface SocketServer extends HTTPServer {
  io?: Server | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

const rooms = new Map()

export default function SocketHandler(_: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket.server.io) {
    console.log('Socket is already running')
    res.end()
    return
  }

  console.log('Setting up socket')
  const io = new Server(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
  })
  res.socket.server.io = io

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id)

    socket.on('createRoom', ({ gameMode }) => {
      const roomId = Math.random().toString(36).substring(7)
      console.log(`Creating room ${roomId} for player ${socket.id} with mode ${gameMode}`)
      rooms.set(roomId, {
        players: [socket.id],
        board: Array(9).fill(null),
        gameMode: gameMode
      })
      socket.join(roomId)
      io.to(socket.id).emit('roomCreated', roomId)
    })

    socket.on('joinRoom', (roomId, gameMode) => {
      console.log(`Join attempt - Room: ${roomId}, Player: ${socket.id}`)
      const room = rooms.get(roomId)

      if (!room) {
        socket.emit('error', 'Room not found')
        return
      }

      if (room.players.length > 2) {
        socket.emit('error', 'Room is full')
        return
      }

      room.players.push(socket.id)
      socket.join(roomId)

      // Emit game start with current board state and game mode
      io.to(roomId).emit('gameStart', {
        players: room.players,
        currentBoard: room.board,
        mode: room.gameMode
      })
    })

    socket.on('move', (moveData, callback) => {
      const { roomId, index, player, board } = moveData
      const room = rooms.get(roomId)

      if (!room) {
        callback('Room not found')
        return
      }

      // Update room's board
      room.board = board

      // Broadcast move to all other players in the room
      socket.to(roomId).emit('updateBoard', board)
      callback(null)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
      // Optional: Implement room cleanup logic
    })
  })

  console.log('Socket is set up')
  res.end()
}