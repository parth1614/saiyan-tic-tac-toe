import React from 'react';

const WinningModal = ({ winner, onNewGame, currentPlayer, gameMode }) => {
  // In Super Saiyan mode, the winner is actually the loser
  const isWinner = gameMode === 'super-saiyan'
    ? winner !== currentPlayer  // If you made the opponent win, you're the winner!
    : winner === currentPlayer; // Normal mode: if you got three in a row, you win

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm transform transition-all animate-fadeIn">
        <div className="text-center space-y-6">
          <div className={`text-6xl mb-4 ${isWinner ? 'animate-bounce' : ''}`}>
            {isWinner ? '🎉' : '😔'}
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${gameMode === 'super-saiyan'
              ? 'bg-gradient-to-r from-yellow-400 to-red-500'
              : 'bg-gradient-to-r from-blue-400 to-indigo-500'
            } text-white font-medium shadow-lg mb-4`}>
            <span className="mr-2">{gameMode === 'super-saiyan' ? '⚡' : '🎮'}</span>
            {gameMode === 'super-saiyan' ? 'Super Saiyan Mode' : 'Saiyan Mode'}
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${isWinner ? 'text-green-600' : 'text-blue-600'}`}>
            {isWinner ? 'Congratulations!' : 'Good Game!'}
          </h2>
          <p className="text-xl text-gray-600 font-medium">
            {gameMode === 'super-saiyan' ? (
              isWinner ?
                "You successfully made your opponent win!" :
                "Your opponent made you win!"
            ) : (
              isWinner ? "You've Won!" : "You've Lost!"
            )}
          </p>
          <button
            onClick={onNewGame}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transform transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinningModal; 