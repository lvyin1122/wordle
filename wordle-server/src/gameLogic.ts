import { TileStatus, GameStatus } from './types';

export interface CoinEarningResult {
  coinsEarned: number;
  newPresent: string[];
  newCorrect: string[];
  newAbsent: string[];
}

export const evaluateGuess = (guess: string, answer: string, discoveredPresent: Set<string> = new Set(), discoveredCorrect: Set<string> = new Set(), discoveredAbsent: Set<string> = new Set()): { evaluation: TileStatus[]; coinResult: CoinEarningResult } => {
  const result: TileStatus[] = [];
  const answerArray = answer.split('');
  const guessArray = guess.split('');
  
  const usedPositions = new Set<number>();
  const newPresent: string[] = [];
  const newCorrect: string[] = [];
  const newAbsent: string[] = [];
  
  for (let i = 0; i < 5; i++) {
    if (guessArray[i] === answerArray[i]) {
      result[i] = 'correct';
      usedPositions.add(i);
      
      // Check if this is a newly discovered correct character
      if (!discoveredCorrect.has(guessArray[i])) {
        newCorrect.push(guessArray[i]);
      }
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
      
      // Check if this is a newly discovered present character
      if (!discoveredPresent.has(letter) && !discoveredCorrect.has(letter)) {
        newPresent.push(letter);
      }
    } else {
      result[i] = 'absent';
      
      // Check if this is a newly discovered absent character
      if (!discoveredAbsent.has(letter) && !discoveredPresent.has(letter) && !discoveredCorrect.has(letter)) {
        newAbsent.push(letter);
      }
    }
  }
  
  // Calculate coins earned: only for newly discovered characters
  const coinsEarned = newPresent.length + (newCorrect.length * 2);
  
  return {
    evaluation: result,
    coinResult: {
      coinsEarned,
      newPresent,
      newCorrect,
      newAbsent
    }
  };
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

export const executeAttack = (
  attackType: 'punch' | 'bomb',
  targetDiscoveredPresent: Set<string>,
  targetDiscoveredCorrect: Set<string>,
  targetDiscoveredAbsent: Set<string>
): { success: boolean; eliminatedCharacter?: string; eliminatedType?: 'present' | 'absent' } => {
  
  if (attackType === 'punch') {
    // Punch eliminates a random absent character
    const absentChars = Array.from(targetDiscoveredAbsent);
    if (absentChars.length === 0) {
      return { success: false };
    }
    
    const randomIndex = Math.floor(Math.random() * absentChars.length);
    const eliminatedChar = absentChars[randomIndex];
    
    return {
      success: true,
      eliminatedCharacter: eliminatedChar,
      eliminatedType: 'absent'
    };
  } else {
    // Bomb eliminates a random present character that is NOT correct
    const presentChars = Array.from(targetDiscoveredPresent);
    const presentButNotCorrect = presentChars.filter(char => !targetDiscoveredCorrect.has(char));
    
    if (presentButNotCorrect.length === 0) {
      return { success: false };
    }
    
    const randomIndex = Math.floor(Math.random() * presentButNotCorrect.length);
    const eliminatedChar = presentButNotCorrect[randomIndex];
    
    return {
      success: true,
      eliminatedCharacter: eliminatedChar,
      eliminatedType: 'present'
    };
  }
}; 