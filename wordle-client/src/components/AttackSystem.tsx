import React, { useState } from 'react';
import { AttackType, PlayerState } from '../types';

interface AttackSystemProps {
  coins: number;
  players: PlayerState[];
  currentPlayerId: string;
  onAttack: (targetId: string, attackType: AttackType) => void;
  disabled: boolean;
}

const AttackSystem: React.FC<AttackSystemProps> = ({
  coins,
  players,
  currentPlayerId,
  onAttack,
  disabled
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedAttack, setSelectedAttack] = useState<AttackType | ''>('');

  const otherPlayers = players.filter(player => player.id !== currentPlayerId);

  const handleAttack = () => {
    if (selectedTarget && selectedAttack) {
      onAttack(selectedTarget, selectedAttack as AttackType);
      setSelectedTarget('');
      setSelectedAttack('');
    }
  };

  const canAffordAttack = (attackType: AttackType) => {
    const cost = attackType === 'punch' ? 1 : 2;
    return coins >= cost;
  };

  if (otherPlayers.length === 0) {
    return (
      <div className="attack-system">
        <div className="attack-header">
          <h3>⚔️ Attack System</h3>
          <div className="coin-display">
            <span className="coin-icon">🪙</span>
            <span className="coin-count">{coins}</span>
          </div>
        </div>
        <div className="attack-info">
          <div className="info-item">
            <em>Waiting for other players to join...</em>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="attack-system">
      <div className="attack-header">
        <h3>⚔️ Attack System</h3>
        <div className="coin-display">
          <span className="coin-icon">🪙</span>
          <span className="coin-count">{coins}</span>
        </div>
      </div>

      <div className="attack-controls">
        <div className="target-selection">
          <label>Select Target:</label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            disabled={disabled}
          >
            <option value="">Choose a player...</option>
            {otherPlayers.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} (🪙{player.coins})
              </option>
            ))}
          </select>
        </div>

        <div className="attack-selection">
          <label>Select Attack:</label>
          <div className="attack-buttons">
            <button
              className={`attack-btn punch ${selectedAttack === 'punch' ? 'selected' : ''} ${!canAffordAttack('punch') ? 'disabled' : ''}`}
              onClick={() => setSelectedAttack('punch')}
              disabled={disabled || !canAffordAttack('punch')}
            >
              👊 Punch (1🪙)
            </button>
            <button
              className={`attack-btn bomb ${selectedAttack === 'bomb' ? 'selected' : ''} ${!canAffordAttack('bomb') ? 'disabled' : ''}`}
              onClick={() => setSelectedAttack('bomb')}
              disabled={disabled || !canAffordAttack('bomb')}
            >
              💣 Bomb (2🪙)
            </button>
          </div>
        </div>

        <button
          className="execute-attack-btn"
          onClick={handleAttack}
          disabled={disabled || !selectedTarget || !selectedAttack}
        >
          Launch Attack!
        </button>
      </div>

      <div className="attack-info">
        <div className="info-item">
          <strong>👊 Punch (1 coin):</strong> Randomly eliminates a discovered absent character from target
        </div>
        <div className="info-item">
          <strong>💣 Bomb (2 coins):</strong> Randomly eliminates a discovered present character (but not correct) from target
        </div>
        <div className="info-item">
          <em>Note: Correct characters cannot be eliminated</em>
        </div>
      </div>
    </div>
  );
};

export default AttackSystem; 