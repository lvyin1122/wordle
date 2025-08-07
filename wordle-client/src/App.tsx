import React, { useState, useEffect, useCallback } from 'react';
import { GameStatus, KeyboardStatus } from './types';
import { startNewGame, submitGuess } from './api';
import GameBoard from './components/GameBoard';
import Keyboard from './components/Keyboard';
import GameStatusComponent from './components/GameStatus';

function App(): JSX.Element {
  const [gameId, setGameId] = useState<string>('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<string[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [message, setMessage] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [maxRounds, setMaxRounds] = useState<number>(6);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async (): Promise<void> => {
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

  const handleKeyPress = useCallback((key: string): void => {
    if (gameStatus !== 'playing' || isValidating || isLoading) return;

    if (key === 'ENTER') {
      submitGuessToServer();
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  }, [gameStatus, isValidating, isLoading, currentGuess.length]);

  const submitGuessToServer = async (): Promise<void> => {
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
    
    guesses.forEach((guess, guessIndex) => {
      const evaluation = evaluations[guessIndex];
      if (evaluation) {
        guess.split('').forEach((letter, letterIndex) => {
          const status = evaluation[letterIndex] as KeyboardStatus;
          
          // Only update if the new status is "better" than the current one
          // correct > present > absent
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
        onNewGame={initializeGame}
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
  );
}

export default App; 