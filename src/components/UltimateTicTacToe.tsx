import { useState } from 'react';

interface Props {
  isMyTurn: boolean;
  onMove: (mainIndex: number, subIndex: number) => void;
  mainBoard: Array<Array<string | null>>;
  activeBoard: number | null;
  wonBoards: Array<string | null>;
}

export default function UltimateTicTacToe({ isMyTurn, onMove, mainBoard, activeBoard, wonBoards }: Props) {
  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Main game board */}
      <div className="grid grid-cols-3 gap-6 bg-gray-100 p-6 rounded-xl">
        {mainBoard.map((subBoard, mainIndex) => (
          <div
            key={mainIndex}
            className={`
              relative bg-white rounded-lg shadow-md transition-all duration-200
              ${activeBoard === mainIndex ? 'ring-4 ring-blue-400 transform scale-102' : ''}
              ${wonBoards[mainIndex] ? 'opacity-90' : ''}
              ${activeBoard !== null && activeBoard !== mainIndex ? 'opacity-50' : ''}
              p-4 md:p-5
            `}
          >
            {/* Sub-board header showing position */}
            <div className="absolute -top-3 left-3 bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full">
              Board {mainIndex + 1}
            </div>

            {/* Winner overlay */}
            {wonBoards[mainIndex] && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg backdrop-blur-sm">
                <span className={`text-6xl font-bold ${wonBoards[mainIndex] === 'X' ? 'text-blue-400' : 'text-red-400'} animate-scale-in drop-shadow-lg`}>
                  {wonBoards[mainIndex]}
                </span>
              </div>
            )}

            {/* Sub-board grid */}
            <div className="grid grid-cols-3 gap-2">
              {subBoard.map((cell, subIndex) => (
                <button
                  key={subIndex}
                  onClick={() => onMove(mainIndex, subIndex)}
                  disabled={!isMyTurn || wonBoards[mainIndex] !== null ||
                    (activeBoard !== null && activeBoard !== mainIndex)}
                  className={`
                    w-16 h-16 md:w-20 md:h-20 rounded-md font-bold text-2xl md:text-3xl
                    flex items-center justify-center
                    ${!cell ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white'}
                    ${cell === 'X' ? 'text-blue-500' : 'text-red-500'}
                    transition-all duration-200
                    ${isMyTurn && !cell && !wonBoards[mainIndex] &&
                      (activeBoard === null || activeBoard === mainIndex)
                      ? 'hover:scale-105 hover:shadow-md hover:bg-blue-50'
                      : 'cursor-not-allowed'}
                    border border-gray-200
                  `}
                >
                  {cell && (
                    <span className="transform transition-all duration-200 animate-pop">
                      {cell}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Game instructions */}
      <div className="mt-6 text-center space-y-2 bg-white/80 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700">
          {activeBoard === null ? (
            "🎯 You can play in any available board"
          ) : (
            `🎯 You must play in board ${activeBoard + 1}`
          )}
        </p>
        <div className="flex justify-center space-x-6 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
            <span className="font-medium">Active Board</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <span className="font-medium">Inactive Board</span>
          </div>
        </div>
      </div>
    </div>
  );
} 