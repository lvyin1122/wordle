import React from 'react';
import { KeyboardStatus } from '../types';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  keyboardState: Record<string, KeyboardStatus>;
  disabled: boolean;
}

const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, keyboardState, disabled }) => {
  const keyRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  const handleKeyClick = (key: string): void => {
    if (!disabled) {
      onKeyPress(key);
    }
  };

  const renderKey = (key: string): JSX.Element => {
    let className = 'key';
    
    if (key === 'ENTER' || key === 'BACKSPACE') {
      className += ' wide';
    }
    
    if (keyboardState[key]) {
      className += ` ${keyboardState[key]}`;
    }
    
    let displayText = key;
    if (key === 'BACKSPACE') {
      displayText = '⌫';
    }
    
    return (
      <button
        key={key}
        className={className}
        onClick={() => handleKeyClick(key)}
        disabled={disabled}
      >
        {displayText}
      </button>
    );
  };

  return (
    <div className="keyboard">
      {keyRows.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map(renderKey)}
        </div>
      ))}
    </div>
  );
};

export default Keyboard; 