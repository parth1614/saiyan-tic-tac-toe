"use client"
import { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import WinningModal from './WinningModal'

let socket: Socket

export default function TicTacToe() {
  const [connected, setConnected] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [board, setBoard] = useState(Array(9).fill(null))
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [player, setPlayer] = useState<'X' | 'O' | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<'X' | 'O' | null>(null)

  // Function to check for a winner
  const calculateWinner = (squares: Array<'X' | 'O' | null>): 'X' | 'O' | null => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  // Reset game function
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setGameOver(false);
    setWinner(null);
    setGameStarted(false);
    setIsMyTurn(false);

    // Only emit if socket exists and is connected
    if (socket && socket.connected) {
      try {
        socket.emit('leaveRoom', roomId);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }
  };

  useEffect(() => {
    let mounted = true;  // Add mounted flag for cleanup

    const initSocket = async () => {
      try {
        await fetch('/api/socket')

        if (!mounted) return;  // Don't initialize if component unmounted

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
          if (Array.isArray(newBoard)) {
            setBoard(newBoard)
            setIsMyTurn(true)

            // Check for winner after opponent's move
            const gameWinner = calculateWinner(newBoard);
            if (gameWinner) {
              setWinner(gameWinner);
              setGameOver(true);
            }
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
      } catch (error) {
        console.error('Socket initialization error:', error);
        if (mounted) {
          setConnected(false);
        }
      }
    }

    initSocket()

    return () => {
      mounted = false;  // Set mounted to false on cleanup
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
    if (!gameStarted || !isMyTurn || board[index] || gameOver) {
      return;
    }

    if (!socket?.connected) {
      console.error('Socket not connected!');
      return;
    }

    const newBoard = [...board];
    newBoard[index] = player;
    setBoard(newBoard);
    setIsMyTurn(false);

    // Check for winner after move
    const gameWinner = calculateWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setGameOver(true);
    }

    const moveData = { roomId, index, player, board: newBoard }
    socket.emit('move', moveData, (error: any) => {
      if (error) {
        console.error('Move error:', error);
        setBoard(board);
        setIsMyTurn(true);
      }
    });
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

      {gameOver && winner && (
        <WinningModal
          winner={winner}
          onNewGame={resetGame}
        />
      )}
    </div>
  )
} 