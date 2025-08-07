import React, { useState, useEffect } from 'react';
import { GAME_CONFIG, getRandomWord } from './config';
import { evaluateGuess, isGameWon, isGameLost, getKeyboardState } from './gameLogic';
import { validateWord } from './wordValidation';
import { GameStatus } from './types';
import GameBoard from './components/GameBoard';
import Keyboard from './components/Keyboard';
import GameStatusComponent from './components/GameStatus';

function App(): JSX.Element {
  const [answer, setAnswer] = useState<string>('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [message, setMessage] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const randomWord = await getRandomWord();
      setAnswer(randomWord);
      setGuesses([]);
      setCurrentGuess('');
      setGameStatus('playing');
      setMessage('');
    } catch (error) {
      console.error('Failed to start new game:', error);
      setMessage('Error starting game. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (key: string): void => {
    if (gameStatus !== 'playing' || isValidating || isLoading) return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const submitGuess = async (): Promise<void> => {
    if (currentGuess.length !== 5) {
      setMessage('Word must be 5 letters long');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    setIsValidating(true);
    
    try {
      const validationResult = await validateWord(currentGuess, GAME_CONFIG.WORDS, true);
      
      if (!validationResult.isValid) {
        setMessage(validationResult.error || 'Not a valid word');
        setTimeout(() => setMessage(''), 2000);
        setIsValidating(false);
        return;
      }

      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      setCurrentGuess('');

      if (isGameWon(currentGuess, answer)) {
        setGameStatus('won');
        setMessage('Congratulations! You won!');
      } else if (isGameLost(newGuesses.length, GAME_CONFIG.MAX_ROUNDS)) {
        setGameStatus('lost');
        setMessage(`Game over! The word was ${answer}`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setMessage('Error validating word. Please try again.');
      setTimeout(() => setMessage(''), 2000);
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
  }, [currentGuess, gameStatus, isValidating, isLoading]);

  const keyboardState = getKeyboardState(guesses, answer);

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
        currentGuess={currentGuess}
        answer={answer}
        maxRounds={GAME_CONFIG.MAX_ROUNDS}
      />
      
      <GameStatusComponent 
        status={gameStatus}
        message={message}
        answer={answer}
        onNewGame={startNewGame}
      />
      
      {isValidating && (
        <div className="validating-message">
          Validating word...
        </div>
      )}
      
      <Keyboard 
        onKeyPress={handleKeyPress}
        keyboardState={keyboardState}
        disabled={gameStatus !== 'playing' || isValidating}
      />
    </div>
  );
}

export default App; 