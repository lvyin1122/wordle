export type GameStatus = 'playing' | 'won' | 'lost';

export type TileStatus = 'correct' | 'present' | 'absent';

export interface GameState {
  id: string;
  answer: string;
  guesses: string[];
  gameStatus: GameStatus;
  maxRounds: number;
  createdAt: Date;
}

export interface StartGameResponse {
  gameId: string;
  maxRounds: number;
}

export interface GuessRequest {
  guess: string;
}

export interface GuessResponse {
  evaluation: TileStatus[];
  gameStatus: GameStatus;
  answer?: string;
  error?: string;
}

export interface GameConfig {
  MAX_ROUNDS: number;
  WORDS: string[];
} 