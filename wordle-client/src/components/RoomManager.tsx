import React, { useState, useEffect } from 'react';

interface RoomManagerProps {
  onGameStart: (roomId: string, playerId: string, isHost: boolean) => void;
  onBack: () => void;
}

interface RoomInfo {
  roomId: string;
  status: string;
  players: Array<{
    id: string;
    name: string;
    isReady: boolean;
    isHost: boolean;
  }>;
  playerId: string;
  isHost: boolean;
}

const RoomManager: React.FC<RoomManagerProps> = ({ onGameStart, onBack }) => {
  const [mode, setMode] = useState<'create' | 'join' | 'waiting'>('create');
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const createRoom = async () => {
    if (!roomId || !playerName) {
      setError('Please enter both room ID and player name');
      return;
    }

    if (!/^\d{4}$/.test(roomId)) {
      setError('Room ID must be a 4-digit number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/multiplayer/room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerName })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      setRoomInfo(data);
      setMode('waiting');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!roomId || !playerName) {
      setError('Please enter both room ID and player name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/multiplayer/room/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerName })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room');
      }

      setRoomInfo(data);
      setMode('waiting');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const setReady = async (isReady: boolean) => {
    if (!roomInfo) return;

    try {
      const response = await fetch(`${API_BASE}/multiplayer/room/${roomInfo.roomId}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: roomInfo.playerId, isReady })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set ready status');
      }

      setRoomInfo(data);

      // If game is ready, start the game
      if (data.status === 'playing') {
        onGameStart(data.roomId, roomInfo.playerId, roomInfo.isHost);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to set ready status');
    }
  };

  // Poll for room updates when waiting
  useEffect(() => {
    if (mode !== 'waiting' || !roomInfo) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/multiplayer/room/${roomInfo.roomId}`);
        const data = await response.json();

        if (response.ok) {
          setRoomInfo(prev => ({ ...prev!, ...data }));

          // If game is ready, start the game
          if (data.status === 'playing') {
            onGameStart(data.roomId, roomInfo.playerId, roomInfo.isHost);
          }
        }
      } catch (error) {
        console.error('Failed to update room status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [mode, roomInfo, onGameStart]);

  if (mode === 'waiting' && roomInfo) {
    return (
      <div className="room-manager">
        <h2>Room {roomInfo.roomId}</h2>
        <div className="waiting-room">
          <div className="players-list">
            <h3>Players:</h3>
            {roomInfo.players.map(player => (
              <div key={player.id} className={`player ${player.isReady ? 'ready' : 'not-ready'}`}>
                <span className="player-name">{player.name}</span>
                <span className="player-status">
                  {player.isReady ? '✅ Ready' : '⏳ Waiting'}
                </span>
                {player.isHost && <span className="host-badge">👑 Host</span>}
              </div>
            ))}
          </div>
          
          <div className="room-actions">
            <button 
              className={`ready-btn ${roomInfo.players.find(p => p.id === roomInfo.playerId)?.isReady ? 'ready' : ''}`}
              onClick={() => setReady(!roomInfo.players.find(p => p.id === roomInfo.playerId)?.isReady)}
            >
              {roomInfo.players.find(p => p.id === roomInfo.playerId)?.isReady ? 'Not Ready' : 'Ready'}
            </button>
            <button className="back-btn" onClick={onBack}>
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-manager">
      <h2>Multiplayer</h2>
      
      <div className="room-options">
        <div className="option-buttons">
          <button 
            className={`option-btn ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
          >
            Create Room
          </button>
          <button 
            className={`option-btn ${mode === 'join' ? 'active' : ''}`}
            onClick={() => setMode('join')}
          >
            Join Room
          </button>
        </div>

        <div className="room-form">
          <div className="form-group">
            <label htmlFor="roomId">Room ID:</label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder={mode === 'create' ? 'Enter 4-digit room ID' : 'Enter room ID to join'}
              maxLength={4}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="playerName">Your Name:</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button 
              className="action-btn primary"
              onClick={mode === 'create' ? createRoom : joinRoom}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : mode === 'create' ? 'Create Room' : 'Join Room'}
            </button>
            <button className="action-btn secondary" onClick={onBack}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomManager; 