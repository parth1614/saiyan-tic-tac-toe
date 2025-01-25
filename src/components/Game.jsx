import WinningModal from './WinningModal';

function Game() {
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setGameOver(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {gameOver && (
        <WinningModal
          winner={calculateWinner(board)}
          onNewGame={resetGame}
        />
      )}
    </div>
  );
}

export default Game; 