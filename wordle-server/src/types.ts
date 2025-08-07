export type GameStatus = 'playing' | 'won' | 'lost';

export type TileStatus = 'correct' | 'present' | 'absent';

export type KeyboardStatus = 'correct' | 'present' | 'absent';

export type GameMode = 'single' | 'multiplayer';

export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'finished';

export interface GameState {
  id: string;
  answer: string;
  guesses: string[];
  gameStatus: GameStatus;
  maxRounds: number;
  createdAt: Date;
}

export interface MultiplayerRoom {
  roomId: string;
  status: RoomStatus;
  players: Player[];
  gameState?: GameState;
  createdAt: Date;
  maxPlayers: number;
}

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  gameState?: GameState;
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

export interface GameStatusResponse {
  gameStatus: GameStatus;
  guesses: string[];
  maxRounds: number;
  answer?: string;
}

// Multiplayer API types
export interface CreateRoomRequest {
  roomId: string;
  playerName: string;
}

export interface JoinRoomRequest {
  roomId: string;
  playerName: string;
}

export interface RoomResponse {
  roomId: string;
  status: RoomStatus;
  players: Player[];
  gameId?: string;
  maxRounds?: number;
}

export interface PlayerReadyRequest {
  playerId: string;
  isReady: boolean;
}

export interface GameConfig {
  MAX_ROUNDS: number;
  WORDS: string[];
} 