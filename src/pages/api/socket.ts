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

interface RoomData {
  players: string[];
  board: Array<string | null> | Array<Array<string | null>>;
  gameMode: 'saiyan' | 'super-saiyan' | 'super-saiyan-god';
  activeBoard: number | null;
  wonBoards: Array<string | null> | null;
  creator: string;
}

interface MoveData {
  roomId: string;
  index: number;
  player: 'X' | 'O';
  board: Array<string | null>;
}

interface UltimateMoveData {
  roomId: string;
  mainIndex: number;
  subIndex: number;
  player: 'X' | 'O';
  mainBoard: Array<Array<string | null>>;
  wonBoards: Array<string | null>;
  activeBoard: number | null;
}

const rooms: Map<string, RoomData> = new Map()

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
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket'],
    pingTimeout: 60000
  })
  res.socket.server.io = io

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id)

    socket.on('createRoom', ({ gameMode }) => {
      const roomId = Math.random().toString(36).substring(7)
      console.log(`Creating room ${roomId} for player ${socket.id} with mode ${gameMode}`)

      // Initialize board based on game mode
      const board = gameMode === 'super-saiyan-god'
        ? Array(9).fill(null).map(() => Array(9).fill(null)) // 9x9 grid for ultimate mode
        : Array(9).fill(null) // Regular 3x3 grid for other modes

      rooms.set(roomId, {
        players: [socket.id],
        board: board,
        gameMode: gameMode,
        activeBoard: null, // For ultimate mode: tracks which sub-board is active
        wonBoards: gameMode === 'super-saiyan-god' ? Array(9).fill(null) : null, // Tracks won sub-boards
        creator: socket.id
      })
      socket.join(roomId)
      io.to(socket.id).emit('roomCreated', roomId)
    })

    socket.on('joinRoom', (roomId: string) => {
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

    socket.on('move', (moveData: MoveData, callback: (error: string | null) => void) => {
      const { roomId, board } = moveData
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

    // Add handler for ultimate mode moves
    socket.on('ultimateMove', (moveData: UltimateMoveData, callback: (error: string | null) => void) => {
      const { roomId, mainBoard, wonBoards, activeBoard } = moveData
      const room = rooms.get(roomId)

      if (!room) {
        callback('Room not found')
        return
      }

      // Update room's board state
      room.board = mainBoard
      room.wonBoards = wonBoards
      room.activeBoard = activeBoard

      // Broadcast move to other player
      socket.to(roomId).emit('updateUltimateBoard', {
        mainBoard,
        wonBoards,
        activeBoard
      })
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