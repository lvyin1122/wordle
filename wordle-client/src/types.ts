// Game state types
export type GameStatus = 'playing' | 'won' | 'lost';

export type TileStatus = 'correct' | 'present' | 'absent';

export type KeyboardStatus = 'correct' | 'present' | 'absent';

// Game configuration interface
export interface GameConfig {
  MAX_ROUNDS: number;
  WORDS: string[];
}

// Game state interface
export interface GameState {
  answer: string;
  guesses: string[];
  currentGuess: string;
  gameStatus: GameStatus;
  message: string;
}

// Component props interfaces
export interface GameBoardProps {
  guesses: string[];
  evaluations: string[][];
  currentGuess: string;
  maxRounds: number;
}

export interface KeyboardProps {
  onKeyPress: (key: string) => void;
  keyboardState: Record<string, KeyboardStatus>;
  disabled: boolean;
}

export interface GameStatusProps {
  status: GameStatus;
  message: string;
  answer: string;
  onNewGame: () => void;
}

// Keyboard state type
export type KeyboardState = Record<string, KeyboardStatus>; 