import React from 'react';
import { GameStatus } from '../types';

interface GameStatusProps {
    status: GameStatus;
    message: string;
    answer: string;
    onNewGame: () => void;
    onRestartGame?: () => void;
  }

const GameStatusComponent: React.FC<GameStatusProps> = ({ status, message, answer, onNewGame, onRestartGame }) => {
  if (status === 'playing' && !message) {
    return null;
  }

  const handlePlayAgain = () => {
    if (onRestartGame) {
      onRestartGame();
    } else {
      onNewGame();
    }
  };

  return (
    <div className="game-status-container">
      {message && (
        <div className={`game-status ${status}`}>
          {message}
        </div>
      )}
      
      {(status === 'won' || status === 'lost') && (
        <button className="new-game-btn" onClick={handlePlayAgain}>
          Play Again
        </button>
      )}
    </div>
  );
};

export default GameStatusComponent; 