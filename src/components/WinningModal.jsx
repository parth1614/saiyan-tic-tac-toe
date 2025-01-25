import React from 'react';

const WinningModal = ({ winner, onNewGame, currentPlayer }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">
          {winner === currentPlayer ? 'You Won!' : 'You Lost!'}
        </h2>
        <p className="mb-6">Game Over!</p>
        <button
          onClick={onNewGame}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Start New Game
        </button>
      </div>
    </div>
  );
};

export default WinningModal; 