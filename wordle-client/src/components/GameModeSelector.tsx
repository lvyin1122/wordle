import React from 'react';
import { GameMode } from '../types';

interface GameModeSelectorProps {
  onModeSelect: (mode: GameMode) => void;
}

const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onModeSelect }) => {
  return (
    <div className="game-mode-selector">
      <h1 className="game-title">WORDLE</h1>
      <div className="mode-selection">
        <h2>Choose Game Mode</h2>
        <div className="mode-buttons">
          <button 
            className="mode-btn single-player"
            onClick={() => onModeSelect('single')}
          >
            <div className="mode-icon">🎮</div>
            <div className="mode-title">Single Player</div>
            <div className="mode-description">Play against the computer</div>
          </button>
          
          <button 
            className="mode-btn multiplayer"
            onClick={() => onModeSelect('multiplayer')}
          >
            <div className="mode-icon">👥</div>
            <div className="mode-title">Multiplayer</div>
            <div className="mode-description">Play against a friend</div>
          </button>

          <button 
            className="mode-btn host-cheating"
            onClick={() => onModeSelect('host-cheating')}
          >
            <div className="mode-icon">🎭</div>
            <div className="mode-title">Host Cheating</div>
            <div className="mode-description">The host adapts to your guesses</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameModeSelector; 