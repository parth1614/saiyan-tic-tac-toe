"use client"
import { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'

let socket: Socket

export default function TicTacToe() {
  const [connected, setConnected] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [board, setBoard] = useState(Array(9).fill(null))
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [player, setPlayer] = useState<'X' | 'O' | null>(null)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    const initSocket = async () => {
      await fetch('/api/socket')

      socket = io({
        path: '/api/socketio'
      })

      socket.on('connect', () => {
        console.log('Connected to socket with ID:', socket.id)
        setConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('Disconnected from socket')
        setConnected(false)
      })

      socket.on('roomCreated', (id) => {
        console.log('Room created:', id)
        setRoomId(id)
        setPlayer('X')
      })

      socket.on('gameStart', ({ players, currentBoard }) => {
        console.log('Game starting with players:', players, 'Initial board:', currentBoard)
        setGameStarted(true)

        // Find player index in the players array
        const playerIndex = players.indexOf(socket.id)
        console.log('Player index:', playerIndex, 'Socket ID:', socket.id)

        // Player at index 0 is X, player at index 2 is O
        if (playerIndex === 0) {
          setPlayer('X')
          setIsMyTurn(true)  // X goes first
        } else if (playerIndex === 2) {
          setPlayer('O')
          setIsMyTurn(false)
        } else {
          console.error('Unexpected player index:', playerIndex)
        }

        if (currentBoard) {
          console.log('Setting initial board state:', currentBoard)
          setBoard(currentBoard)
        }
      })

      socket.on('updateBoard', (newBoard) => {
        console.log('Received board update:', newBoard)
        if (Array.isArray(newBoard)) {  // Verify we received a valid board
          setBoard(newBoard)
          setIsMyTurn(true)
        } else {
          console.error('Received invalid board update:', newBoard)
        }
      })

      socket.on('playerDisconnected', () => {
        alert('Other player disconnected')
        setGameStarted(false)
        setBoard(Array(9).fill(null))
      })

      socket.on('error', (message) => {
        alert(message)
      })
    }

    initSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const createRoom = () => {
    if (!connected) {
      alert('Not connected to server')
      return
    }
    socket.emit('createRoom')
  }

  const joinRoom = (id: string) => {
    if (!connected) {
      alert('Not connected to server')
      return
    }
    if (!id.trim()) {
      alert('Please enter a room ID')
      return
    }
    console.log('Attempting to join room:', id)
    socket.emit('joinRoom', id)
  }

  const handleMove = (index: number) => {
    console.log("Move attempt:", {
      gameStarted,
      isMyTurn,
      currentBoard: board,
      cellValue: board[index],
      roomId,
      player,
      socketConnected: socket?.connected,
      moveIndex: index
    })

    if (!gameStarted || !isMyTurn || board[index]) {
      console.log('Move blocked:', {
        gameStarted,
        isMyTurn,
        cellOccupied: board[index] !== null
      })
      return
    }

    if (!socket?.connected) {
      console.error('Socket not connected!');
      return;
    }

    const newBoard = [...board];
    newBoard[index] = player;
    setBoard(newBoard);
    setIsMyTurn(false);

    const moveData = { roomId, index, player, board: newBoard }
    console.log('Emitting move:', moveData)

    try {
      socket.emit('move', moveData, (error: any) => {
        if (error) {
          console.error('Move error:', error);
          setBoard(board);
          setIsMyTurn(true);
        } else {
          console.log('Move successfully registered by server');
        }
      });
    } catch (err) {
      console.error('Error emitting move:', err);
      setBoard(board);
      setIsMyTurn(true);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-4">
        Status: {connected ? 'Connected' : 'Disconnected'}
        {connected && socket?.id && ` (ID: ${socket.id})`}
      </div>

      {!gameStarted ? (
        <div className="space-y-4">
          <button
            onClick={createRoom}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={!connected}
          >
            Create Room
          </button>
          <div>
            <input
              type="text"
              value={roomId}
              placeholder="Room ID"
              className="border p-2 mr-2"
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button
              onClick={() => joinRoom(roomId)}
              className="bg-green-500 text-white px-4 py-2 rounded"
              disabled={!connected}
            >
              Join Room
            </button>
          </div>
          {roomId && <p>Room ID: {roomId}</p>}
        </div>
      ) : (
        <div>
          <p>You are player: {player}</p>
          <p>{isMyTurn ? 'Your turn' : "Opponent's turn"}</p>
          <div className="grid grid-cols-3 gap-2 w-64 mt-4">
            {board.map((cell, index) => (
              <button
                key={index}
                className={`h-20 bg-gray-200 text-4xl font-bold ${cell === 'X' ? 'text-blue-600' : 'text-red-600'
                  }`}
                onClick={() => handleMove(index)}
              >
                {cell}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 