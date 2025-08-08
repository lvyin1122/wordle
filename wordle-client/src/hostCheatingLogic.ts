import { CandidateWord, GuessScore } from './types';

// Basic word list for host cheating mode
// In a real implementation, this would be much larger
export const WORD_LIST = [
  'HELLO', 'WORLD', 'QUITE', 'FANCY', 'FRESH', 'PANIC', 'CRAZY', 'BUGGY', 'SCARE'
];

// Evaluate a guess against a target word
export const evaluateGuess = (guess: string, target: string): string[] => {
  const result: string[] = new Array(5).fill('absent');
  const targetArray = target.split('');
  const guessArray = guess.split('');
  const usedPositions = new Set<number>();
  
  // First pass: mark correct letters
  for (let i = 0; i < 5; i++) {
    if (guessArray[i] === targetArray[i]) {
      result[i] = 'correct';
      usedPositions.add(i);
    }
  }
  
  // Count remaining letters in target
  const letterCount: Record<string, number> = {};
  for (let i = 0; i < 5; i++) {
    if (!usedPositions.has(i)) {
      const letter = targetArray[i];
      letterCount[letter] = (letterCount[letter] || 0) + 1;
    }
  }
  
  // Second pass: mark present letters
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    
    const letter = guessArray[i];
    if (letterCount[letter] && letterCount[letter] > 0) {
      result[i] = 'present';
      letterCount[letter]--;
    }
  }
  
  return result;
};

// Calculate score for a guess against a target word
export const calculateScore = (guess: string, target: string): GuessScore => {
  const evaluation = evaluateGuess(guess, target);
  let hits = 0;
  let presents = 0;
  
  for (const status of evaluation) {
    if (status === 'correct') {
      hits++;
    } else if (status === 'present') {
      presents++;
    }
  }
  
  // Score: more hits = higher score, then more presents = higher score
  const score = hits * 10 + presents;
  
  return {
    word: target,
    score,
    hits,
    presents
  };
};

// Check if a word matches all previous evaluations
export const wordMatchesHistory = (
  word: string, 
  guesses: string[], 
  evaluations: string[][]
): boolean => {
  for (let i = 0; i < guesses.length; i++) {
    const expectedEvaluation = evaluateGuess(guesses[i], word);
    const actualEvaluation = evaluations[i];
    
    // Compare evaluations
    for (let j = 0; j < 5; j++) {
      if (expectedEvaluation[j] !== actualEvaluation[j]) {
        return false;
      }
    }
  }
  return true;
};

// Initialize candidate words
export const initializeCandidates = (): CandidateWord[] => {
  return WORD_LIST.map(word => ({
    word,
    score: 0,
    hits: 0,
    presents: 0
  }));
};

// Update candidates based on a new guess and evaluation
export const updateCandidates = (
  candidates: CandidateWord[],
  guess: string,
  evaluation: string[]
): CandidateWord[] => {
  // Filter candidates that match the evaluation
  const matchingCandidates = candidates.filter(candidate => {
    const expectedEvaluation = evaluateGuess(guess, candidate.word);
    for (let i = 0; i < 5; i++) {
      if (expectedEvaluation[i] !== evaluation[i]) {
        return false;
      }
    }
    return true;
  });
  
  // Calculate scores for remaining candidates
  const scoredCandidates = matchingCandidates.map(candidate => {
    const score = calculateScore(guess, candidate.word);
    return {
      ...candidate,
      score: score.score,
      hits: score.hits,
      presents: score.presents
    };
  });
  
  // Find the minimum score
  const minScore = Math.min(...scoredCandidates.map(c => c.score));
  
  // Keep only candidates with the minimum score
  return scoredCandidates.filter(candidate => candidate.score === minScore);
};

// Select the final answer from candidates - FIXED LOGIC
export const selectAnswer = (candidates: CandidateWord[], guess: string): string => {
  if (candidates.length === 0) {
    // Fallback to a random word if no candidates
    return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  }
  
  // If only one candidate, use it
  if (candidates.length === 1) {
    return candidates[0].word;
  }
  
  // Find candidates that give NO feedback (all absent)
  const noFeedbackCandidates = candidates.filter(candidate => {
    const evaluation = evaluateGuess(guess, candidate.word);
    return evaluation.every(status => status === 'absent');
  });
  
  // If there are candidates that give no feedback, prefer those
  if (noFeedbackCandidates.length > 0) {
    // Among no-feedback candidates, prefer the one with most hits/presents for future rounds
    let bestCandidate = noFeedbackCandidates[0];
    for (const candidate of noFeedbackCandidates) {
      if (candidate.hits > bestCandidate.hits) {
        bestCandidate = candidate;
      } else if (candidate.hits === bestCandidate.hits && candidate.presents > bestCandidate.presents) {
        bestCandidate = candidate;
      }
    }
    return bestCandidate.word;
  }
  
  // If all candidates give some feedback, select the one with minimum feedback
  // Prefer fewer hits, then fewer presents
  let bestCandidate = candidates[0];
  let minScore = bestCandidate.score;
  
  for (const candidate of candidates) {
    if (candidate.score < minScore) {
      bestCandidate = candidate;
      minScore = candidate.score;
    }
  }
  
  // If multiple candidates have the same minimum score, pick the first one consistently
  // This ensures deterministic behavior
  const minScoreCandidates = candidates.filter(candidate => candidate.score === minScore);
  return minScoreCandidates[0].word;
};

// Get candidate info for display
export const getCandidateInfo = (candidates: CandidateWord[]): string => {
  if (candidates.length === 0) {
    return 'No candidates remaining';
  }
  
  if (candidates.length === 1) {
    return `1 candidate remaining`;
  }
  
  return `${candidates.length} candidates remaining`;
}; 