import { TileStatus, KeyboardState } from './types';

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
  
  const answerLetterCount: Record<string, number> = {};
  
  for (let i = 0; i < 5; i++) {
    if (!usedPositions.has(i)) {
      const letter = answerArray[i];
      answerLetterCount[letter] = (answerLetterCount[letter] || 0) + 1;
    }
  }
  
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') {
      continue;
    }
    
    const letter = guessArray[i];
    
    if (answerLetterCount[letter] && answerLetterCount[letter] > 0) {
      result[i] = 'present';
      answerLetterCount[letter]--;
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

export const getKeyboardState = (guesses: string[], answer: string): KeyboardState => {
  const keyboardState: KeyboardState = {};
  
  guesses.forEach(guess => {
    const evaluation = evaluateGuess(guess, answer);
    
    guess.split('').forEach((letter, index) => {
      const status = evaluation[index];
      
      if (!keyboardState[letter] || 
          (status === 'correct') ||
          (status === 'present' && keyboardState[letter] === 'absent')) {
        keyboardState[letter] = status;
      }
    });
  });
  
  return keyboardState;
}; 