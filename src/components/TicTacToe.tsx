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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 md:p-8 flex flex-col items-center justify-center">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center">
        Saiyan Tic Tac Toe
      </h1>

      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-2xl w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-medium shadow-lg">
            <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-300 animate-pulse' : 'bg-red-400'}`} />
            {connected ? 'Connected' : 'Disconnected'}
            {connected && socket?.id &&
              <span className="ml-2 text-sm opacity-75">ID: {socket.id.slice(0, 6)}...</span>
            }
          </div>
        </div>

        {!gameStarted ? (
          <div className="space-y-6">
            <button
              onClick={createRoom}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-lg 
                hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
              disabled={!connected}
            >
              Create New Room
            </button>
            <div className="space-y-4">
              <input
                type="text"
                value={roomId}
                placeholder="Enter Room ID"
                className="w-full px-4 py-3 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:outline-none transition-colors text-gray-700"
                onChange={(e) => setRoomId(e.target.value)}
              />
              <button
                onClick={() => joinRoom(roomId)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-lg 
                  hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                disabled={!connected}
              >
                Join Room
              </button>
            </div>
            {roomId && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-purple-700 font-medium flex items-center justify-center">
                  <span className="mr-2">🎮</span>
                  Room ID: {roomId}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-6 space-y-3">
              <p className="text-2xl font-bold text-gray-800">
                Player: <span className={`${player === 'X' ? 'text-blue-600' : 'text-red-600'}`}>{player}</span>
              </p>
              <div className={`text-xl font-medium px-4 py-2 rounded-lg ${isMyTurn
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
                }`}>
                {isMyTurn ? '🎯 Your turn' : "⌛ Opponent's turn"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto">
              {board.map((cell, index) => (
                <button
                  key={index}
                  className={`
                    h-24 rounded-xl font-bold text-5xl shadow-md
                    ${!cell ? 'bg-white hover:bg-gray-50' : 'bg-white'}
                    ${cell === 'X' ? 'text-blue-600' : 'text-red-600'}
                    transition-all duration-200 transform
                    ${isMyTurn && !cell && !gameOver ? 'hover:scale-105 hover:shadow-lg' : ''}
                    ${!isMyTurn || cell || gameOver ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                  `}
                  onClick={() => handleMove(index)}
                  disabled={!isMyTurn || !!cell || gameOver}
                >
                  {cell && <span className="animate-scaleIn">{cell}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameOver && winner && (
          <WinningModal
            winner={winner}
            onNewGame={resetGame}
            currentPlayer={player}
          />
        )}
      </div>
    </div>
  );
} 