export type GameStatus = 'playing' | 'won' | 'lost';

export type TileStatus = 'correct' | 'present' | 'absent';

export type KeyboardStatus = 'correct' | 'present' | 'absent';

export type GameMode = 'single' | 'multiplayer';

export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'finished';

// Attack types
export type AttackType = 'punch' | 'bomb';

export interface GameState {
  id: string;
  answer: string;
  guesses: string[];
  gameStatus: GameStatus;
  maxRounds: number;
  createdAt: Date;
  coins?: number;
  discoveredPresent?: Set<string>;
  discoveredCorrect?: Set<string>;
  discoveredAbsent?: Set<string>;
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
  coins?: number;
  discoveredPresent?: Set<string>;
  discoveredCorrect?: Set<string>;
  discoveredAbsent?: Set<string>;
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
  coinsEarned?: number;
  newPresent?: string[];
  newCorrect?: string[];
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

// Attack request
export interface AttackRequest {
  attackerId: string;
  targetId: string;
  attackType: AttackType;
}

export interface GameConfig {
  MAX_ROUNDS: number;
  WORDS: string[];
} 