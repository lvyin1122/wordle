import React from 'react';
import { GameBoardProps } from '../types';

const GameBoard: React.FC<GameBoardProps> = ({ guesses, evaluations, currentGuess, maxRounds }) => {
  const renderTile = (letter: string, index: number, rowIndex: number): JSX.Element => {
    let className = 'tile';
    
    if (letter) {
      className += ' filled';
      
      // Use server evaluation data to color the tiles
      if (rowIndex < evaluations.length && evaluations[rowIndex]) {
        const evaluation = evaluations[rowIndex][index];
        if (evaluation) {
          className += ` ${evaluation}`;
        }
      }
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