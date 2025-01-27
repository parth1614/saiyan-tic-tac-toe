"use client"
import { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import WinningModal from './WinningModal'
import UltimateTicTacToe from './UltimateTicTacToe'

let socket: Socket

// Remove unused MoveCallback interface
// interface MoveCallback {
//   (error: string | null): void;
// }

// Keep these interfaces since they're used in socket.emit() calls
interface MoveData {
  roomId: string;
  index: number;
  player: 'X' | 'O';
  board: Array<string | null>;
  gameMode: 'saiyan' | 'super-saiyan' | 'super-saiyan-god';
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

// Update GameStartData to remove unused properties
interface GameStartData {
  players: string[];
  currentBoard: Array<string | null> | Array<Array<string | null>>;
  mode: 'saiyan' | 'super-saiyan' | 'super-saiyan-god';
}

interface UltimateBoardUpdate {
  mainBoard: Array<Array<string | null>>;
  wonBoards: Array<string | null>;
  activeBoard: number | null;
}

export default function TicTacToe() {
  const [connected, setConnected] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [board, setBoard] = useState(Array(9).fill(null))
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [player, setPlayer] = useState<'X' | 'O' | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<'X' | 'O' | null>(null)
  const [gameMode, setGameMode] = useState<'saiyan' | 'super-saiyan' | 'super-saiyan-god' | null>(null)
  const [mainBoard, setMainBoard] = useState<Array<Array<string | null>>>(
    Array(9).fill(null).map(() => Array(9).fill(null)))
  const [activeBoard, setActiveBoard] = useState<number | null>(null)
  const [wonBoards, setWonBoards] = useState<Array<string | null>>(Array(9).fill(null))

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
    if (gameMode === 'super-saiyan-god') {
      setMainBoard(Array(9).fill(null).map(() => Array(9).fill(null)))
      setWonBoards(Array(9).fill(null))
      setActiveBoard(null)
    } else {
      setBoard(Array(9).fill(null))
    }
    setGameOver(false)
    setWinner(null)
    setGameStarted(false)
    setIsMyTurn(false)

    // Only emit if socket exists and is connected
    if (socket && socket.connected) {
      try {
        socket.emit('leaveRoom', roomId)
      } catch (error) {
        console.error('Error leaving room:', error)
      }
    }
  }

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

        socket.on('gameStart', ({ players, currentBoard, mode }: GameStartData) => {
          console.log('Game starting:', { players, currentBoard, mode });
          setGameStarted(true);
          setGameMode(mode);

          if (mode === 'super-saiyan-god') {
            setMainBoard(Array(9).fill(null).map(() => Array(9).fill(null)));
            setWonBoards(Array(9).fill(null));
            setActiveBoard(null);
          } else {
            setBoard(Array(9).fill(null));
          }

          const playerIndex = players.indexOf(socket.id || '');
          if (playerIndex === 0) {
            setPlayer('X');
            setIsMyTurn(true);
          } else {
            setPlayer('O');
            setIsMyTurn(false);
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

        socket.on('updateUltimateBoard', ({ mainBoard, wonBoards, activeBoard }: UltimateBoardUpdate) => {
          setMainBoard(mainBoard);
          setWonBoards(wonBoards);
          setActiveBoard(activeBoard);
          setIsMyTurn(true);
        });
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
      socket.off('updateUltimateBoard');
    }
  }, [])

  useEffect(() => {
    console.log('gameMode changed:', gameMode);
  }, [gameMode]);

  const createRoom = () => {
    if (!connected) {
      alert('Not connected to server')
      return
    }
    if (!gameMode) {
      alert('Please select a game mode first')
      return
    }
    socket.emit('createRoom', { gameMode })
  }

  const joinRoom = (id: string) => {
    if (!connected) {
      alert('Not connected to server')
      return
    }
    if (!gameMode) {
      alert('Please select a game mode first')
      return
    }
    if (!id.trim()) {
      alert('Please enter a room ID')
      return
    }
    console.log('Attempting to join room:', id)
    socket.emit('joinRoom', id, gameMode)
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

    const moveData: MoveData = {
      roomId,
      index,
      player: player as 'X' | 'O',
      board: newBoard,
      gameMode: gameMode as 'saiyan' | 'super-saiyan' | 'super-saiyan-god'
    };
    socket.emit('move', moveData, (error: string | null) => {
      if (error) {
        console.error('Move error:', error);
        setBoard(board);
        setIsMyTurn(true);
      }
    });
  }

  const handleUltimateMove = (mainIndex: number, subIndex: number) => {
    if (!isMyTurn || gameOver) return;

    // Check if the move is valid (correct board and empty cell)
    if (activeBoard !== null && activeBoard !== mainIndex) return;
    if (wonBoards[mainIndex] !== null) return;
    if (mainBoard[mainIndex][subIndex] !== null) return;

    // Create new board state
    const newMainBoard = mainBoard.map(subBoard => [...subBoard]);
    newMainBoard[mainIndex][subIndex] = player;
    setMainBoard(newMainBoard);

    // Check if the sub-board is won
    const subBoardArray = newMainBoard[mainIndex];
    const subBoardWinner = calculateWinner(subBoardArray as ('X' | 'O' | null)[]);

    // Check if the sub-board is full (tie)
    const isSubBoardFull = !subBoardArray.includes(null);

    const newWonBoards = [...wonBoards];
    if (subBoardWinner || isSubBoardFull) {
      newWonBoards[mainIndex] = subBoardWinner; // null for tie, 'X' or 'O' for win
      setWonBoards(newWonBoards);

      // Check if the main board is won
      const mainBoardWinner = calculateWinner(newWonBoards as ('X' | 'O' | null)[]);
      if (mainBoardWinner) {
        setWinner(mainBoardWinner);
        setGameOver(true);
      } else if (!newWonBoards.includes(null)) {
        // Check for main board tie
        setGameOver(true);
      }
    }

    // Determine next active board
    let nextActiveBoard: number | null = subIndex;
    if (newWonBoards[subIndex] !== null || !newMainBoard[subIndex].includes(null)) {
      // If the target board is won or full, allow play on any available board
      nextActiveBoard = null;
    }
    setActiveBoard(nextActiveBoard);

    // Update turn and emit move
    setIsMyTurn(false);

    const moveData: UltimateMoveData = {
      roomId,
      mainIndex,
      subIndex,
      player: player as 'X' | 'O',
      mainBoard: newMainBoard,
      wonBoards: newWonBoards,
      activeBoard: nextActiveBoard
    };
    socket.emit('ultimateMove', moveData, (error: string | null) => {
      if (error) {
        console.error('Move error:', error);
        setMainBoard(mainBoard);
        setWonBoards(wonBoards);
        setActiveBoard(activeBoard);
        setIsMyTurn(true);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 md:p-8 flex flex-col items-center justify-center">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center">
        {gameMode === 'super-saiyan' ? 'Super Saiyan' : gameMode === 'super-saiyan-god' ? 'Super Saiyan God Mode' : 'Saiyan'} Tic Tac Toe
      </h1>

      <div className={`bg-white/90 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-2xl w-full 
        ${gameMode === 'super-saiyan-god' ? 'max-w-6xl' : 'max-w-md'}`}>
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
            {/* Game Mode Selection */}
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Game Mode</h2>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setGameMode('saiyan')}
                  className={`
                    p-4 rounded-lg text-left transition-all duration-300
                    ${gameMode === 'saiyan'
                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 hover:bg-blue-100 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] text-gray-700'
                    }
                  `}
                >
                  <div className="font-bold text-lg mb-1">Saiyan Mode</div>
                  <div className="text-sm opacity-90">Classic rules - Get three in a row to win!</div>
                </button>

                <button
                  onClick={() => setGameMode('super-saiyan')}
                  className={`
                    p-4 rounded-lg text-left transition-all duration-300
                    ${gameMode === 'super-saiyan'
                      ? 'bg-yellow-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 hover:bg-yellow-100 hover:shadow-[0_0_15px_rgba(252,211,77,0.5)] text-gray-700'
                    }
                  `}
                >
                  <div className="font-bold text-lg mb-1">Super Saiyan Mode</div>
                  <div className="text-sm opacity-90">Reverse rules - Make your opponent win to claim victory!</div>
                </button>

                <button
                  onClick={() => setGameMode('super-saiyan-god')}
                  className={`
                    p-4 rounded-lg text-left transition-all duration-300
                    ${gameMode === 'super-saiyan-god'
                      ? 'bg-red-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 hover:bg-red-100 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] text-gray-700'
                    }
                  `}
                >
                  <div className="font-bold text-lg mb-1">Super Saiyan God Mode</div>
                  <div className="text-sm opacity-90">Ultimate 9x9 strategic battle - Win sub-boards to claim victory!</div>
                </button>
              </div>
            </div>

            <button
              onClick={createRoom}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-lg 
                hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
              disabled={!connected || !gameMode}
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
                disabled={!connected || !gameMode}
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
              <div className={`inline-flex items-center px-4 py-2 rounded-full ${gameMode === 'super-saiyan-god'
                ? 'bg-gradient-to-r from-red-400 to-orange-500'
                : gameMode === 'super-saiyan'
                  ? 'bg-gradient-to-r from-yellow-400 to-red-500'
                  : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                } text-white font-medium shadow-lg mb-4`}>
                <span className="mr-2">
                  {gameMode === 'super-saiyan-god' ? '🔥' : gameMode === 'super-saiyan' ? '⚡' : '🎮'}
                </span>
                {gameMode === 'super-saiyan-god'
                  ? 'Super Saiyan God Mode'
                  : gameMode === 'super-saiyan'
                    ? 'Super Saiyan Mode'
                    : 'Saiyan Mode'}
              </div>

              <p className="text-2xl font-bold text-gray-800">
                Player: <span className={`${player === 'X' ? 'text-blue-600' : 'text-red-600'}`}>{player}</span>
              </p>

              <div className={`text-xl font-medium px-4 py-2 rounded-lg ${isMyTurn ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                {isMyTurn ? '🎯 Your turn' : "⌛ Opponent's turn"}
              </div>

              {gameMode === 'super-saiyan-god' && (
                <p className="text-sm text-red-600 font-medium mt-2">
                  Win sub-boards to claim the main board! Your next move must be in the highlighted sub-board.
                </p>
              )}
            </div>

            {gameMode === 'super-saiyan-god' ? (
              <UltimateTicTacToe
                isMyTurn={isMyTurn}
                onMove={handleUltimateMove}
                mainBoard={mainBoard}
                activeBoard={activeBoard}
                wonBoards={wonBoards}
              />
            ) : (
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto">
                {board.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => handleMove(index)}
                    disabled={!isMyTurn || !!cell || gameOver}
                    className={`
                      h-24 rounded-xl font-bold text-5xl shadow-md
                      ${!cell ? 'bg-white hover:bg-gray-50' : 'bg-white'}
                      ${cell === 'X' ? 'text-blue-600' : 'text-red-600'}
                      transition-all duration-200 transform
                      ${isMyTurn && !cell && !gameOver ? 'hover:scale-105 hover:shadow-lg' : ''}
                      ${!isMyTurn || cell || gameOver ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                    `}
                  >
                    {cell && <span className="animate-scaleIn">{cell}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {gameOver && winner && (
          <WinningModal
            winner={winner}
            onNewGame={resetGame}
            currentPlayer={player}
            gameMode={gameMode}
          />
        )}
      </div>
    </div>
  );
} 