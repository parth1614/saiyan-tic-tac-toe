import React from 'react';

const WinningModal = ({ winner, onNewGame, currentPlayer }) => {
  const isWinner = winner === currentPlayer;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm transform transition-all animate-fadeIn">
        <div className="text-center space-y-6">
          <div className={`text-6xl mb-4 ${isWinner ? 'animate-bounce' : ''}`}>
            {isWinner ? '🎉' : '😔'}
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${isWinner ? 'text-green-600' : 'text-blue-600'}`}>
            {isWinner ? 'Congratulations!' : 'Good Game!'}
          </h2>
          <p className="text-xl text-gray-600 font-medium">
            {isWinner ? "You've Won!" : "You've Lost!"}
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