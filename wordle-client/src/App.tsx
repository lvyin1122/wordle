import React, { useState, useEffect, useCallback } from 'react';
import { GameStatus, KeyboardStatus, PlayerState, AttackType } from './types';
import { startNewGame, submitGuess } from './api';
import { socketService, GuessResult, AttackResult } from './socketService';
import GameModeSelector from './components/GameModeSelector';
import RoomManager from './components/RoomManager';
import GameBoard from './components/GameBoard';
import Keyboard from './components/Keyboard';
import GameStatusComponent from './components/GameStatus';
import AttackSystem from './components/AttackSystem';

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
  
  // Coin system state
  const [coins, setCoins] = useState<number>(0);
  const [discoveredPresent, setDiscoveredPresent] = useState<Set<string>>(new Set());
  const [discoveredCorrect, setDiscoveredCorrect] = useState<Set<string>>(new Set());
  const [discoveredAbsent, setDiscoveredAbsent] = useState<Set<string>>(new Set());
  const [players, setPlayers] = useState<PlayerState[]>([]);

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
    setCoins(0);
    setDiscoveredPresent(new Set());
    setDiscoveredCorrect(new Set());
    setDiscoveredAbsent(new Set());
    setPlayers([]);
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
    setCoins(0);
    setDiscoveredPresent(new Set());
    setDiscoveredCorrect(new Set());
    setDiscoveredAbsent(new Set());
    setPlayers([]);
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

  const submitMultiplayerGuess = (): void => {
    if (!roomId || !playerId || currentGuess.length !== 5) {
      setMessage('Word must be 5 letters long');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    // Prevent guesses if game is already over
    if (gameStatus !== 'playing') {
      setMessage('Game is already over');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    setIsValidating(true);
    setMessage('');
    
    // Submit guess via Socket.IO
    socketService.submitGuess(roomId, playerId, currentGuess);
  };

  const handleAttack = (targetId: string, attackType: AttackType): void => {
    if (!roomId || !playerId) {
      setMessage('Not connected to game');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    const cost = attackType === 'punch' ? 1 : 2;
    if (coins < cost) {
      setMessage(`Not enough coins for ${attackType} attack`);
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    // Deduct coins immediately
    setCoins(prev => prev - cost);
    
    // Submit attack via Socket.IO
    socketService.submitAttack(roomId, playerId, targetId, attackType);
  };

  const restartMultiplayerGame = (): void => {
    // Reset game state but keep room connection
    setGuesses([]);
    setEvaluations([]);
    setCurrentGuess('');
    setGameStatus('playing');
    setMessage('');
    setCoins(0);
    setDiscoveredPresent(new Set());
    setDiscoveredCorrect(new Set());
    setDiscoveredAbsent(new Set());
    
    // Request new game from server
    socketService.restartGame(roomId, playerId);
  };

  // Socket event listeners for multiplayer
  useEffect(() => {
    if (mode === 'multiplayer-game') {
      // Listen for guess results
      socketService.onGuessResult((result: GuessResult) => {
        setGuesses(prev => [...prev, currentGuess]);
        setEvaluations(prev => [...prev, result.evaluation]);
        setCurrentGuess('');
        setGameStatus(result.gameStatus as GameStatus);
        
        // Handle coin earning
        const coinsEarned = result.coinsEarned;
        if (typeof coinsEarned === 'number' && coinsEarned > 0) {
          setCoins(prev => prev + coinsEarned);
          setMessage(`🎉 +${coinsEarned} coins earned!`);
          setTimeout(() => setMessage(''), 2000);
        }
        
        // Update discovered characters
        if (result.newPresent) {
          setDiscoveredPresent(prev => {
            const newSet = new Set(prev);
            result.newPresent!.forEach(char => newSet.add(char));
            return newSet;
          });
        }
        
        if (result.newCorrect) {
          setDiscoveredCorrect(prev => {
            const newSet = new Set(prev);
            result.newCorrect!.forEach(char => newSet.add(char));
            return newSet;
          });
        }
        
        if (result.newAbsent) {
          setDiscoveredAbsent(prev => {
            const newSet = new Set(prev);
            result.newAbsent!.forEach(char => newSet.add(char));
            return newSet;
          });
        }
        
        if (result.gameStatus === 'won') {
          setMessage(`🎉 Congratulations! You won! The word was ${result.answer}`);
        } else if (result.gameStatus === 'lost') {
          setMessage(`Game over! The word was ${result.answer}`);
        }
        
        setIsValidating(false);
      });

      // Listen for game over events
      socketService.onGameOver((data) => {
        if (data.winner) {
          const isWinner = data.players.find(p => p.id === playerId)?.gameStatus === 'won';
          if (isWinner) {
            setMessage(`🏆 You won! The word was ${data.players.find(p => p.id === playerId)?.answer}`);
          } else {
            setMessage(`😔 ${data.winner} won! The word was ${data.players.find(p => p.id === playerId)?.answer}`);
          }
        } else {
          setMessage(`Game over! The word was ${data.players.find(p => p.id === playerId)?.answer}`);
        }
        setGameStatus('lost');
      });

      // Listen for errors
      socketService.onError((error) => {
        setMessage(error.message);
        setTimeout(() => setMessage(''), 3000);
        setIsValidating(false);
      });

      // Listen for room updates to populate players list
      socketService.onRoomUpdated((roomInfo) => {
        const playerStates: PlayerState[] = roomInfo.players.map(player => ({
          id: player.id,
          name: player.name,
          coins: player.coins || 0,
          discoveredPresent: new Set(player.discoveredPresent || []),
          discoveredCorrect: new Set(player.discoveredCorrect || []),
          discoveredAbsent: new Set(player.discoveredAbsent || [])
        }));
        setPlayers(playerStates);
        
        // Update current player's coin count if available
        const currentPlayer = playerStates.find(p => p.id === playerId);
        if (currentPlayer) {
          setCoins(currentPlayer.coins);
        }
      });

      // Listen for attack results
      socketService.onAttackResult((result: AttackResult) => {
        if (result.attackerId === playerId) {
          if (result.success) {
            setMessage(`💥 Attack successful! Eliminated ${result.eliminatedCharacter} (${result.eliminatedType}) from ${players.find(p => p.id === result.targetId)?.name}`);
          } else {
            setMessage(`💥 Attack failed - no ${result.attackType === 'punch' ? 'absent' : 'present (but not correct)'} characters to eliminate`);
          }
        } else if (result.targetId === playerId) {
          if (result.success) {
            setMessage(`💥 You were attacked! Lost one character`);
            // Update local state to reflect the attack
            if (result.eliminatedType === 'present') {
              setDiscoveredPresent(prev => {
                const newSet = new Set(prev);
                newSet.delete(result.eliminatedCharacter!);
                return newSet;
              });
            } else if (result.eliminatedType === 'absent') {
              setDiscoveredAbsent(prev => {
                const newSet = new Set(prev);
                newSet.delete(result.eliminatedCharacter!);
                return newSet;
              });
            }
          }
        }
        setTimeout(() => setMessage(''), 3000);
      });

      // Listen for game restart
      socketService.onGameRestarted(() => {
        setMessage('🎮 New game started!');
        setTimeout(() => setMessage(''), 2000);
      });

      // Cleanup on unmount
      return () => {
        socketService.off('guess-result');
        socketService.off('game-over');
        socketService.off('error');
      };
    }
  }, [mode, currentGuess, playerId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toUpperCase();
      
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
    
    // Process evaluations first to get the most accurate state
    guesses.forEach((guess, guessIndex) => {
      const evaluation = evaluations[guessIndex];
      if (evaluation) {
        guess.split('').forEach((letter, letterIndex) => {
          const status = evaluation[letterIndex] as KeyboardStatus;
          
          // Check if the character has been eliminated
          let isEliminated = false;
          if (status === 'present') {
            isEliminated = !discoveredPresent.has(letter);
          } else if (status === 'correct') {
            isEliminated = !discoveredCorrect.has(letter);
          } else if (status === 'absent') {
            isEliminated = !discoveredAbsent.has(letter);
          }
          
          // Only set keyboard state if the character hasn't been eliminated
          if (!isEliminated) {
            if (!keyboardState[letter] || 
                (status === 'correct') ||
                (status === 'present' && keyboardState[letter] === 'absent')) {
              keyboardState[letter] = status;
            }
          }
        });
      }
    });
    
    // Then add any remaining discovered characters that weren't in evaluations
    discoveredPresent.forEach(letter => {
      if (!keyboardState[letter]) {
        keyboardState[letter] = 'present';
      }
    });
    
    discoveredCorrect.forEach(letter => {
      if (!keyboardState[letter]) {
        keyboardState[letter] = 'correct';
      }
    });
    
    discoveredAbsent.forEach(letter => {
      if (!keyboardState[letter]) {
        keyboardState[letter] = 'absent';
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
          <div className="player-info">
            {isHost ? '👑 Host' : 'Player'} • 🪙 {coins} coins
          </div>
        </div>
      )}
      
      <div className="game-layout">
        <div className="game-main">
          <GameBoard 
            guesses={guesses}
            evaluations={evaluations}
            currentGuess={currentGuess}
            maxRounds={maxRounds}
            discoveredPresent={discoveredPresent}
            discoveredCorrect={discoveredCorrect}
            discoveredAbsent={discoveredAbsent}
          />
          
          <GameStatusComponent 
            status={gameStatus}
            message={message}
            answer=""
            onNewGame={mode === 'single-player' ? initializeSinglePlayer : handleBackToModeSelect}
            onRestartGame={mode === 'multiplayer-game' ? restartMultiplayerGame : undefined}
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
        </div>
        
        {mode === 'multiplayer-game' && (
          <div className="game-sidebar">
            <AttackSystem
              coins={coins}
              players={players}
              currentPlayerId={playerId}
              onAttack={handleAttack}
              disabled={isValidating}
            />
          </div>
        )}
      </div>

      {/* Debug info */}
      {mode === 'multiplayer-game' && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Debug: Mode={mode}, GameStatus={gameStatus}, Players={players.length}, Coins={coins}
        </div>
      )}

      <button className="back-to-menu-btn" onClick={handleBackToModeSelect}>
        Back to Menu
      </button>
    </div>
  );
}

export default App; 