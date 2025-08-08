import { MultiplayerRoom, Player, RoomStatus, GameState, CreateRoomRequest, JoinRoomRequest, PlayerReadyRequest } from './types';
import { getRandomWord, GAME_CONFIG } from './config';
import { evaluateGuess, isGameWon, isGameLost, executeAttack } from './gameLogic';
import { validateWord } from './wordValidation';

class MultiplayerService {
  private rooms: Map<string, MultiplayerRoom> = new Map();
  private players: Map<string, Player> = new Map();

  createRoom(roomId: string, playerName: string): { room: MultiplayerRoom; player: Player } {
    if (this.rooms.has(roomId)) {
      throw new Error('Room already exists');
    }

    const player: Player = {
      id: this.generatePlayerId(),
      name: playerName,
      isReady: false,
      isHost: true,
      coins: 0,
      discoveredPresent: new Set(),
      discoveredCorrect: new Set(),
      discoveredAbsent: new Set()
    };

    const room: MultiplayerRoom = {
      roomId,
      status: 'waiting',
      players: [player],
      createdAt: new Date(),
      maxPlayers: 2
    };

    this.rooms.set(roomId, room);
    this.players.set(player.id, player);

    return { room, player };
  }

  joinRoom(roomId: string, playerName: string): { room: MultiplayerRoom; player: Player } {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    if (room.status !== 'waiting') {
      throw new Error('Game already in progress');
    }

    const player: Player = {
      id: this.generatePlayerId(),
      name: playerName,
      isReady: false,
      isHost: false,
      coins: 0,
      discoveredPresent: new Set(),
      discoveredCorrect: new Set(),
      discoveredAbsent: new Set()
    };

    room.players.push(player);
    this.players.set(player.id, player);

    return { room, player };
  }

  setPlayerReady(roomId: string, playerId: string, isReady: boolean): MultiplayerRoom {
    console.log(`setPlayerReady called: roomId=${roomId}, playerId=${playerId}, isReady=${isReady}`);
    
    const room = this.rooms.get(roomId);
    if (!room) {
      console.log(`Room not found: ${roomId}`);
      throw new Error('Room not found');
    }

    console.log(`Room found:`, {
      roomId: room.roomId,
      status: room.status,
      players: room.players.map(p => ({ id: p.id, name: p.name, isReady: p.isReady }))
    });

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      console.log(`Player not found: ${playerId}`);
      console.log(`Available players:`, room.players.map(p => p.id));
      throw new Error('Player not found');
    }

    console.log(`Player found:`, { id: player.id, name: player.name, currentReady: player.isReady });
    player.isReady = isReady;
    console.log(`Player ready status updated to: ${player.isReady}`);

    // Check if all players are ready
    const allReady = room.players.every(p => p.isReady);
    console.log(`All players ready: ${allReady}, player count: ${room.players.length}, max players: ${room.maxPlayers}`);
    
    if (allReady && room.players.length === room.maxPlayers) {
      console.log(`Starting multiplayer game for room ${roomId}`);
      this.startMultiplayerGame(room);
    }

    return room;
  }

  private startMultiplayerGame(room: MultiplayerRoom): void {
    const answer = getRandomWord();
    
    const gameState: GameState = {
      id: this.generateGameId(),
      answer,
      guesses: [],
      gameStatus: 'playing',
      maxRounds: GAME_CONFIG.MAX_ROUNDS,
      createdAt: new Date()
    };

    room.gameState = gameState;
    room.status = 'playing';

    // Initialize individual game states for each player
    room.players.forEach(player => {
      player.gameState = {
        id: this.generateGameId(),
        answer,
        guesses: [],
        gameStatus: 'playing',
        maxRounds: GAME_CONFIG.MAX_ROUNDS,
        createdAt: new Date()
      };
    });
  }

  getRoom(roomId: string): MultiplayerRoom | undefined {
    return this.rooms.get(roomId);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  async submitMultiplayerGuess(roomId: string, playerId: string, guess: string): Promise<{
    evaluation: string[];
    gameStatus: string;
    answer?: string;
    error?: string;
    winner?: string;
    coinsEarned?: number;
    newPresent?: string[];
    newCorrect?: string[];
    newAbsent?: string[];
  }> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.gameState) {
      throw new Error('Player or game state not found');
    }

    // Check if game is already over
    if (room.status === 'finished') {
      throw new Error('Game is already finished');
    }

    // Validate the guess
    const validationResult = await validateWord(guess, GAME_CONFIG.WORDS, true);
    if (!validationResult.isValid) {
      throw new Error(validationResult.error || 'Invalid word');
    }

    // Add guess to player's game state
    player.gameState.guesses.push(guess);

    // Initialize coin tracking if not exists
    if (player.coins === undefined) {
      player.coins = 0;
    }
    if (player.discoveredPresent === undefined) {
      player.discoveredPresent = new Set();
    }
    if (player.discoveredCorrect === undefined) {
      player.discoveredCorrect = new Set();
    }
    if (player.discoveredAbsent === undefined) {
      player.discoveredAbsent = new Set();
    }

    // Evaluate the guess with coin tracking
    const { evaluation, coinResult } = evaluateGuess(
      guess, 
      player.gameState.answer, 
      player.discoveredPresent, 
      player.discoveredCorrect,
      player.discoveredAbsent
    );

    // Update player's discovered characters and coins
    coinResult.newPresent.forEach(char => player.discoveredPresent!.add(char));
    coinResult.newCorrect.forEach(char => player.discoveredCorrect!.add(char));
    coinResult.newAbsent.forEach(char => player.discoveredAbsent!.add(char));
    player.coins += coinResult.coinsEarned;

    // Check if this player won
    if (isGameWon(guess, player.gameState.answer)) {
      player.gameState.gameStatus = 'won';
      room.status = 'finished';
      
      // Mark other players as lost
      room.players.forEach(p => {
        if (p.id !== playerId && p.gameState) {
          p.gameState.gameStatus = 'lost';
        }
      });

      return {
        evaluation: evaluation.map(status => status),
        gameStatus: 'won',
        answer: player.gameState.answer,
        winner: player.name,
        coinsEarned: coinResult.coinsEarned,
        newPresent: coinResult.newPresent,
        newCorrect: coinResult.newCorrect,
        newAbsent: coinResult.newAbsent
      };
    }

    // Check if this player lost (max rounds reached)
    if (isGameLost(player.gameState.guesses.length, GAME_CONFIG.MAX_ROUNDS)) {
      player.gameState.gameStatus = 'lost';
      
      // Check if all players have lost
      const allPlayersLost = room.players.every(p => 
        p.gameState && p.gameState.gameStatus === 'lost'
      );
      
      if (allPlayersLost) {
        room.status = 'finished';
      }

      return {
        evaluation: evaluation.map(status => status),
        gameStatus: 'lost',
        answer: player.gameState.answer,
        coinsEarned: coinResult.coinsEarned,
        newPresent: coinResult.newPresent,
        newCorrect: coinResult.newCorrect,
        newAbsent: coinResult.newAbsent
      };
    }

    // Game continues
    return {
      evaluation: evaluation.map(status => status),
      gameStatus: 'playing',
      coinsEarned: coinResult.coinsEarned,
      newPresent: coinResult.newPresent,
      newCorrect: coinResult.newCorrect,
      newAbsent: coinResult.newAbsent
    };
  }

  leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    room.players = room.players.filter(p => p.id !== playerId);
    this.players.delete(playerId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
    } else if (room.players.length === 1) {
      room.status = 'waiting';
      room.players[0].isHost = true;
    }
  }

  submitAttack(roomId: string, attackerId: string, targetId: string, attackType: 'punch' | 'bomb'): {
    success: boolean;
    eliminatedCharacter?: string;
    eliminatedType?: 'present' | 'correct' | 'absent';
    error?: string;
  } {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const attacker = room.players.find(p => p.id === attackerId);
    const target = room.players.find(p => p.id === targetId);

    if (!attacker || !target) {
      throw new Error('Player not found');
    }

    // Check if game is in progress
    if (room.status !== 'playing') {
      throw new Error('Game is not in progress');
    }

    // Check if attacker has enough coins
    const cost = attackType === 'punch' ? 1 : 2;
    if (!attacker.coins || attacker.coins < cost) {
      throw new Error('Not enough coins for attack');
    }

    // Initialize target's discovered sets if not exists
    if (target.discoveredPresent === undefined) {
      target.discoveredPresent = new Set();
    }
    if (target.discoveredCorrect === undefined) {
      target.discoveredCorrect = new Set();
    }
    if (target.discoveredAbsent === undefined) {
      target.discoveredAbsent = new Set();
    }

    // Execute the attack
    const attackResult = executeAttack(attackType, target.discoveredPresent, target.discoveredCorrect, target.discoveredAbsent);

    if (attackResult.success) {
      // Deduct coins from attacker
      attacker.coins -= cost;

      // Remove the eliminated character from target
      if (attackResult.eliminatedType === 'present') {
        target.discoveredPresent!.delete(attackResult.eliminatedCharacter!);
      } else if (attackResult.eliminatedType === 'absent') {
        target.discoveredAbsent!.delete(attackResult.eliminatedCharacter!);
      }
    }

    return attackResult;
  }

  private generatePlayerId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateGameId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  cleanupOldRooms(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.createdAt < oneHourAgo || room.status === 'finished') {
        this.rooms.delete(roomId);
        // Clean up players in this room
        room.players.forEach(player => {
          this.players.delete(player.id);
        });
      }
    }
  }
}

export const multiplayerService = new MultiplayerService(); 