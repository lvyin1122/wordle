import React, { useState, useEffect } from 'react';
import { socketService, RoomInfo } from '../socketService';

interface RoomManagerProps {
  onGameStart: (roomId: string, playerId: string, isHost: boolean) => void;
  onBack: () => void;
}

const RoomManager: React.FC<RoomManagerProps> = ({ onGameStart, onBack }) => {
  const [mode, setMode] = useState<'create' | 'join' | 'waiting'>('create');
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playerId, setPlayerId] = useState('');

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

      // Use the server-generated player ID
      setPlayerId(data.playerId);
      setRoomInfo(data);
      setMode('waiting');
      
      // Join the socket room with server-generated player ID
      socketService.joinRoom(roomId, data.playerId, playerName);
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

      // Use the server-generated player ID
      setPlayerId(data.playerId);
      setRoomInfo(data);
      setMode('waiting');
      
      // Join the socket room with server-generated player ID
      socketService.joinRoom(roomId, data.playerId, playerName);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const setReady = (isReady: boolean) => {
    if (!roomInfo || !playerId) return;

    socketService.setReady(roomInfo.roomId, playerId, isReady);
  };

  const leaveRoom = () => {
    if (roomInfo && playerId) {
      socketService.leaveRoom(roomInfo.roomId, playerId);
    }
    onBack();
  };

  // Socket event listeners
  useEffect(() => {
    // Listen for room updates
    socketService.onRoomUpdated((updatedRoomInfo) => {
      setRoomInfo(updatedRoomInfo);
    });

    // Listen for game start
    socketService.onGameStart((data) => {
      const currentPlayer = roomInfo?.players.find(p => p.id === playerId);
      if (currentPlayer) {
        onGameStart(data.roomId, playerId, currentPlayer.isHost);
      }
    });

    // Listen for errors
    socketService.onError((error) => {
      setError(error.message);
    });

    // Listen for room deletion
    socketService.onRoomDeleted((data) => {
      setError('Room was deleted by the host');
      setTimeout(() => onBack(), 2000);
    });

    // Cleanup on unmount
    return () => {
      socketService.off('room-updated');
      socketService.off('game-start');
      socketService.off('error');
      socketService.off('room-deleted');
    };
  }, [roomInfo, playerId, onGameStart, onBack]);

  if (mode === 'waiting' && roomInfo) {
    const currentPlayer = roomInfo.players.find(p => p.id === playerId);
    
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
              className={`ready-btn ${currentPlayer?.isReady ? 'ready' : ''}`}
              onClick={() => setReady(!currentPlayer?.isReady)}
            >
              {currentPlayer?.isReady ? 'Not Ready' : 'Ready'}
            </button>
            <button className="back-btn" onClick={leaveRoom}>
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