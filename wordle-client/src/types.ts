// Game state types
export type GameStatus = 'playing' | 'won' | 'lost';

export type TileStatus = 'correct' | 'present' | 'absent';

export type KeyboardStatus = 'correct' | 'present' | 'absent';

// Attack types
export type AttackType = 'punch' | 'bomb';

// Player state with coins
export interface PlayerState {
  id: string;
  name: string;
  coins: number;
  discoveredPresent: Set<string>;
  discoveredCorrect: Set<string>;
  discoveredAbsent: Set<string>;
}

// Attack result
export interface AttackResult {
  attackerId: string;
  targetId: string;
  attackType: AttackType;
  success: boolean;
  eliminatedCharacter?: string;
  eliminatedType?: 'present' | 'absent';
}

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
  coins?: number;
  discoveredPresent?: Set<string>;
  discoveredCorrect?: Set<string>;
}

// Component props interfaces
export interface GameBoardProps {
  guesses: string[];
  evaluations: string[][];
  currentGuess: string;
  maxRounds: number;
  discoveredPresent?: Set<string>;
  discoveredCorrect?: Set<string>;
  discoveredAbsent?: Set<string>;
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

// Attack system props
export interface AttackSystemProps {
  coins: number;
  players: PlayerState[];
  currentPlayerId: string;
  onAttack: (targetId: string, attackType: AttackType) => void;
  disabled: boolean;
}

// Keyboard state type
export type KeyboardState = Record<string, KeyboardStatus>; 