import { TileStatus, GameStatus } from './types';

export const evaluateGuess = (guess: string, answer: string): TileStatus[] => {
  const result: TileStatus[] = [];
  const answerArray = answer.split('');
  const guessArray = guess.split('');
  
  const usedPositions = new Set<number>();
  
  for (let i = 0; i < 5; i++) {
    if (guessArray[i] === answerArray[i]) {
      result[i] = 'correct';
      usedPositions.add(i);
    }
  }
  
  const letterCount: Record<string, number> = {};
  
  for (let i = 0; i < 5; i++) {
    if (!usedPositions.has(i)) {
      const letter = answerArray[i];
      letterCount[letter] = (letterCount[letter] || 0) + 1;
    }
  }
  
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') {
      continue;
    }
    
    const letter = guessArray[i];
    
    if (letterCount[letter] && letterCount[letter] > 0) {
      result[i] = 'present';
      letterCount[letter]--;
    } else {
      result[i] = 'absent';
    }
  }
  
  return result;
};

export const isGameWon = (guess: string, answer: string): boolean => {
  return guess === answer;
};

export const isGameLost = (currentRound: number, maxRounds: number): boolean => {
  return currentRound >= maxRounds;
};

export const validateGuess = (guess: string): { isValid: boolean; error?: string } => {
  if (!guess || guess.length !== 5) {
    return { isValid: false, error: 'Guess must be exactly 5 letters long' };
  }
  
  if (!/^[A-Za-z]{5}$/.test(guess)) {
    return { isValid: false, error: 'Guess must contain only letters' };
  }
  
  return { isValid: true };
}; 