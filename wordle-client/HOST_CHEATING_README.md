# Host Cheating Mode

This document describes the implementation of the "Host Cheating" mode for the Wordle game, inspired by [Absurdle](https://absurdle.online/).

## Overview

In Host Cheating mode, the game doesn't have a predetermined answer at the start. Instead, the host (computer) maintains a list of candidate words and adapts the answer based on the player's guesses to make the game as challenging as possible.

## How It Works

### Initial State
- The game starts with a list of all possible 5-letter words as candidates
- No answer is selected initially

### After Each Guess
1. **Word Validation**: The guess must be a valid word from the candidate list
2. **Answer Selection**: The host selects an answer from the current candidates that will give the player the "worst" possible feedback
3. **Scoring System**: 
   - More "hits" (correct letters in correct positions) = higher score
   - If hits are equal, more "presents" (correct letters in wrong positions) = higher score
4. **Candidate Filtering**: Only candidates with the lowest score are kept
5. **Feedback**: The player receives the evaluation for their guess against the selected answer

### Answer Selection Strategy
- Among remaining candidates, prefer words with:
  1. More hits (correct letters in correct positions)
  2. If hits are equal, more presents (correct letters in wrong positions)
- This ensures the player gets the most challenging feedback possible

## Implementation Details

### Files Modified/Created

1. **`src/types.ts`**
   - Added `GameMode` type with `'host-cheating'` option
   - Added `CandidateWord`, `GuessScore`, and `HostCheatingGameState` interfaces

2. **`src/hostCheatingLogic.ts`** (new file)
   - Contains all the logic for candidate management and scoring
   - Functions for evaluating guesses, calculating scores, and updating candidates
   - Word list with common 5-letter words

3. **`src/components/GameModeSelector.tsx`**
   - Added third button for Host Cheating mode
   - Updated to handle the new game mode

4. **`src/components/CandidateInfo.tsx`** (new file)
   - Displays information about remaining candidates
   - Shows candidate count and details when game ends

5. **`src/App.tsx`**
   - Added host cheating state management
   - Implemented `submitHostCheatingGuess()` function
   - Added rendering logic for host cheating mode

6. **`src/index.css`**
   - Added styles for host cheating UI elements
   - Purple theme for host cheating mode

### Key Functions

- `initializeCandidates()`: Creates initial list of all possible words
- `calculateScore(guess, target)`: Calculates score based on hits and presents
- `updateCandidates(candidates, guess, evaluation)`: Filters candidates based on new guess
- `selectAnswer(candidates)`: Chooses the most challenging answer from candidates
- `evaluateGuess(guess, target)`: Standard Wordle evaluation logic

## Game Flow

1. Player selects "Host Cheating" mode
2. Game initializes with all possible words as candidates
3. Player makes a guess
4. System validates the guess is in the word list
5. System selects the most challenging answer from current candidates
6. System evaluates the guess against the selected answer
7. System filters candidates to only those matching the evaluation
8. System recalculates scores for remaining candidates
9. System keeps only candidates with the lowest score
10. Player receives feedback and continues or game ends

## Example

**Initial State**: 1000+ candidate words

**Player guesses "STARE"**
- System selects "WORLD" as answer (gives 0 hits, 1 present)
- Evaluation: [absent, absent, present, absent, absent]
- Candidates filtered to words matching this pattern
- Remaining candidates: ~200 words

**Player guesses "BLIND"**
- System selects "CHART" as answer (gives 0 hits, 2 presents)
- Evaluation: [absent, present, absent, present, absent]
- Candidates filtered further
- Remaining candidates: ~50 words

This continues until the player either wins or runs out of attempts.

## Technical Notes

- **Client-side only**: No server communication required
- **Deterministic**: Same guesses will always produce the same results
- **Challenging**: Designed to be as difficult as possible while remaining fair
- **Transparent**: Player can see candidate count and final answer

## Future Enhancements

- Larger word list for more variety
- Difficulty settings (easier/harder cheating strategies)
- Statistics tracking
- Share results functionality 