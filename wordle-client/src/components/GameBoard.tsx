import React from 'react';
import { GameBoardProps } from '../types';

const GameBoard: React.FC<GameBoardProps> = ({ 
  guesses, 
  evaluations, 
  currentGuess, 
  maxRounds,
  discoveredPresent = new Set(),
  discoveredCorrect = new Set(),
  discoveredAbsent = new Set()
}) => {

  console.log(discoveredPresent);
  console.log(evaluations);
  const renderTile = (letter: string, index: number, rowIndex: number): JSX.Element => {
    let className = 'tile';
    
    if (letter) {
      className += ' filled';
      
      // Only apply special colors to completed guesses (not the current input line)
      if (rowIndex < guesses.length) {
        // Use server evaluation data to color the tiles for completed guesses
        if (evaluations[rowIndex]) {
          const evaluation = evaluations[rowIndex][index];
          if (evaluation) {
            // Check if we should use elimination logic (for multiplayer mode)
            const useEliminationLogic = discoveredPresent.size > 0 || discoveredCorrect.size > 0 || discoveredAbsent.size > 0;
            
            if (useEliminationLogic) {
              // Check if the character has been eliminated
              let isEliminated = false;
              if (evaluation === 'present') {
                isEliminated = !discoveredPresent.has(letter);
              } else if (evaluation === 'correct') {
                isEliminated = !discoveredCorrect.has(letter);
              } else if (evaluation === 'absent') {
                isEliminated = !discoveredAbsent.has(letter);
              }
              
              // Only apply evaluation color if character hasn't been eliminated
              if (!isEliminated) {
                className += ` ${evaluation}`;
              }
            } else {
              // For host cheating mode, just apply the evaluation color directly
              className += ` ${evaluation}`;
            }
          }
        }
        
        // If no evaluation color was applied and we're using elimination logic, check discovered sets
        const useEliminationLogic = discoveredPresent.size > 0 || discoveredCorrect.size > 0 || discoveredAbsent.size > 0;
        if (useEliminationLogic && !className.includes('correct') && !className.includes('present') && !className.includes('absent')) {
          if (discoveredPresent.has(letter)) {
            className += ' present';
          } else if (discoveredCorrect.has(letter)) {
            // If a correct character appears in wrong position, show as present
            className += ' present';
          } else if (discoveredAbsent.has(letter)) {
            className += ' absent';
          }
        }
      }
      // For the current input line (rowIndex === guesses.length), no special colors are applied
    }
    
    return (
      <div key={index} className={className}>
        {letter}
      </div>
    );
  };

  const renderRow = (rowIndex: number): JSX.Element => {
    let letters = '';
    
    if (rowIndex < guesses.length) {
      letters = guesses[rowIndex];
    } else if (rowIndex === guesses.length) {
      letters = currentGuess;
    }
    
    const paddedLetters = letters.padEnd(5, '');
    
    return (
      <div key={rowIndex} className="row">
        {paddedLetters.split('').map((letter, index) => 
          renderTile(letter, index, rowIndex)
        )}
      </div>
    );
  };

  return (
    <div className="game-board">
      {Array.from({ length: maxRounds }, (_, index) => renderRow(index))}
    </div>
  );
};

export default GameBoard; 