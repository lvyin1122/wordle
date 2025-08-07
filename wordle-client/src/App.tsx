import React, { useState, useEffect, useCallback } from 'react';
import { GameStatus, KeyboardStatus } from './types';
import { startNewGame, submitGuess } from './api';
import GameModeSelector from './components/GameModeSelector';
import RoomManager from './components/RoomManager';
import GameBoard from './components/GameBoard';
import Keyboard from './components/Keyboard';
import GameStatusComponent from './components/GameStatus';

type AppMode = 'mode-select' | 'single-player' | 'multiplayer-setup' | 'multiplayer-game';

function App(): JSX.Element {
  // App state
  const [mode, setMode] = useState<AppMode>('mode-select');
  
  // Single player state
  const [gameId, setGameId] = useState<string>('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<string[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [message, setMessage] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [maxRounds, setMaxRounds] = useState<number>(6);

  // Multiplayer state
  const [roomId, setRoomId] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);

  const initializeSinglePlayer = async (): Promise<void> => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const { gameId: newGameId, maxRounds: rounds } = await startNewGame();
      setGameId(newGameId);
      setMaxRounds(rounds);
      setGuesses([]);
      setEvaluations([]);
      setCurrentGuess('');
      setGameStatus('playing');
    } catch (error) {
      console.error('Failed to start game:', error);
      setMessage('Error starting game. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSelect = (gameMode: 'single' | 'multiplayer') => {
    if (gameMode === 'single') {
      setMode('single-player');
      initializeSinglePlayer();
    } else {
      setMode('multiplayer-setup');
    }
  };

  const handleMultiplayerGameStart = (roomId: string, playerId: string, isHost: boolean) => {
    setRoomId(roomId);
    setPlayerId(playerId);
    setIsHost(isHost);
    setMode('multiplayer-game');
    // Initialize multiplayer game state
    setGuesses([]);
    setEvaluations([]);
    setCurrentGuess('');
    setGameStatus('playing');
    setMessage('');
  };

  const handleBackToModeSelect = () => {
    setMode('mode-select');
    // Reset all state
    setGameId('');
    setGuesses([]);
    setEvaluations([]);
    setCurrentGuess('');
    setGameStatus('playing');
    setMessage('');
    setRoomId('');
    setPlayerId('');
    setIsHost(false);
  };

  const handleKeyPress = useCallback((key: string): void => {
    if (gameStatus !== 'playing' || isValidating || isLoading) return;

    if (key === 'ENTER') {
      if (mode === 'single-player') {
        submitSinglePlayerGuess();
      } else if (mode === 'multiplayer-game') {
        submitMultiplayerGuess();
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  }, [gameStatus, isValidating, isLoading, currentGuess.length, mode]);

  const submitSinglePlayerGuess = async (): Promise<void> => {
    if (!gameId || currentGuess.length !== 5) {
      setMessage('Word must be 5 letters long');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    setIsValidating(true);
    setMessage('');
    
    try {
      const result = await submitGuess(gameId, currentGuess);
      
      setGuesses(prev => [...prev, currentGuess]);
      setEvaluations(prev => [...prev, result.evaluation]);
      setCurrentGuess('');
      setGameStatus(result.gameStatus as GameStatus);
      
      if (result.gameStatus === 'won') {
        setMessage('Congratulations! You won!');
      } else if (result.gameStatus === 'lost') {
        setMessage(`Game over! The word was ${result.answer}`);
      }
    } catch (error) {
      console.error('Error submitting guess:', error);
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Error submitting guess');
      }
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsValidating(false);
    }
  };

  const submitMultiplayerGuess = async (): Promise<void> => {
    if (!roomId || !playerId || currentGuess.length !== 5) {
      setMessage('Word must be 5 letters long');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    setIsValidating(true);
    setMessage('');
    
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE}/multiplayer/room/${roomId}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, guess: currentGuess })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit guess');
      }
      
      setGuesses(prev => [...prev, currentGuess]);
      setEvaluations(prev => [...prev, result.evaluation]);
      setCurrentGuess('');
      setGameStatus(result.gameStatus as GameStatus);
      
      if (result.gameStatus === 'won') {
        setMessage('Congratulations! You won!');
      } else if (result.gameStatus === 'lost') {
        setMessage(`Game over! The word was ${result.answer}`);
      }
    } catch (error) {
      console.error('Error submitting multiplayer guess:', error);
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Error submitting guess');
      }
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = event.key?.toUpperCase() || '';
      
      if (key === 'ENTER') {
        handleKeyPress('ENTER');
      } else if (key === 'BACKSPACE') {
        handleKeyPress('BACKSPACE');
      } else if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  // Calculate keyboard state based on evaluations
  const getKeyboardState = (): Record<string, KeyboardStatus> => {
    const keyboardState: Record<string, KeyboardStatus> = {};
    
    guesses.forEach((guess, guessIndex) => {
      const evaluation = evaluations[guessIndex];
      if (evaluation) {
        guess.split('').forEach((letter, letterIndex) => {
          const status = evaluation[letterIndex] as KeyboardStatus;
          
          if (!keyboardState[letter] || 
              (status === 'correct') ||
              (status === 'present' && keyboardState[letter] === 'absent')) {
            keyboardState[letter] = status;
          }
        });
      }
    });
    
    return keyboardState;
  };

  // Render different components based on mode
  if (mode === 'mode-select') {
    return <GameModeSelector onModeSelect={handleModeSelect} />;
  }

  if (mode === 'multiplayer-setup') {
    return (
      <RoomManager 
        onGameStart={handleMultiplayerGameStart}
        onBack={handleBackToModeSelect}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="game-container">
        <h1 className="game-title">WORDLE</h1>
        <div className="loading-message">
          Loading game...
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <h1 className="game-title">WORDLE</h1>
      
      {mode === 'multiplayer-game' && (
        <div className="multiplayer-info">
          <div className="room-info">Room: {roomId}</div>
          <div className="player-info">{isHost ? '👑 Host' : 'Player'}</div>
        </div>
      )}
      
      <GameBoard 
        guesses={guesses}
        evaluations={evaluations}
        currentGuess={currentGuess}
        maxRounds={maxRounds}
      />
      
      <GameStatusComponent 
        status={gameStatus}
        message={message}
        answer=""
        onNewGame={mode === 'single-player' ? initializeSinglePlayer : handleBackToModeSelect}
      />
      
      {isValidating && (
        <div className="validating-message">
          Validating word...
        </div>
      )}
      
      <Keyboard 
        onKeyPress={handleKeyPress}
        keyboardState={getKeyboardState()}
        disabled={gameStatus !== 'playing' || isValidating}
      />

      <button className="back-to-menu-btn" onClick={handleBackToModeSelect}>
        Back to Menu
      </button>
    </div>
  );
}

export default App; 