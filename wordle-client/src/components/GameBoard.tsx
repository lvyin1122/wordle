import React from 'react';
import { evaluateGuess } from '../gameLogic';

interface GameBoardProps {
    guesses: string[];
    currentGuess: string;
    answer: string;
    maxRounds: number;
  }

const GameBoard: React.FC<GameBoardProps> = ({ guesses, currentGuess, answer, maxRounds }) => {
  const renderTile = (letter: string, index: number, rowIndex: number): JSX.Element => {
    let className = 'tile';
    
    if (letter) {
      className += ' filled';
      
      if (rowIndex < guesses.length) {
        const evaluation = evaluateGuess(guesses[rowIndex], answer);
        className += ` ${evaluation[index]}`;
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
    
    letters = letters.padEnd(5, '');
    
    return (
      <div key={rowIndex} className="row">
        {letters.split('').map((letter, index) => 
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