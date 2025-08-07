export type GameStatus = 'playing' | 'won' | 'lost';

export type TileStatus = 'correct' | 'present' | 'absent';

export type KeyboardStatus = 'correct' | 'present' | 'absent';

export interface GameConfig {
  MAX_ROUNDS: number;
  WORDS: string[];
}

export interface GameState {
  answer: string;
  guesses: string[];
  currentGuess: string;
  gameStatus: GameStatus;
  message: string;
}

export interface KeyboardProps {
  onKeyPress: (key: string) => void;
  keyboardState: Record<string, KeyboardStatus>;
  disabled: boolean;
}

export type KeyboardState = Record<string, KeyboardStatus>; 