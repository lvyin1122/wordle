import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { multiplayerService } from './multiplayerService';
import { Player, MultiplayerRoom } from './types';

export interface SocketData {
  roomId?: string;
  playerId?: string;
  playerName?: string;
}

export class SocketService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join room
      socket.on('join-room', (data: { roomId: string; playerId: string; playerName: string }) => {
        this.handleJoinRoom(socket, data);
      });

      // Set player ready
      socket.on('set-ready', (data: { roomId: string; playerId: string; isReady: boolean }) => {
        this.handleSetReady(socket, data);
      });

      // Submit guess
      socket.on('submit-guess', async (data: { roomId: string; playerId: string; guess: string }) => {
        await this.handleSubmitGuess(socket, data);
      });

      // Leave room
      socket.on('leave-room', (data: { roomId: string; playerId: string }) => {
        this.handleLeaveRoom(socket, data);
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinRoom(socket: any, data: { roomId: string; playerId: string; playerName: string }): void {
    const { roomId, playerId, playerName } = data;
    
    // Join the socket room
    socket.join(roomId);
    
    // Store room data in socket
    socket.data.roomId = roomId;
    socket.data.playerId = playerId;
    socket.data.playerName = playerName;

    // Get current room state and emit to all players in the room
    const room = multiplayerService.getRoom(roomId);
    if (room) {
      this.io.to(roomId).emit('room-updated', {
        roomId: room.roomId,
        status: room.status,
        players: room.players,
        gameId: room.gameState?.id,
        maxRounds: room.gameState?.maxRounds
      });
    }

    console.log(`Player ${playerName} joined room ${roomId}`);
  }

  private handleSetReady(socket: any, data: { roomId: string; playerId: string; isReady: boolean }): void {
    const { roomId, playerId, isReady } = data;
    
    console.log(`Setting ready status: roomId=${roomId}, playerId=${playerId}, isReady=${isReady}`);
    
    try {
      const room = multiplayerService.setPlayerReady(roomId, playerId, isReady);
      
      console.log(`Room after setReady:`, {
        roomId: room.roomId,
        status: room.status,
        players: room.players.map(p => ({ id: p.id, name: p.name, isReady: p.isReady }))
      });
      
      // Emit updated room state to all players
      this.io.to(roomId).emit('room-updated', {
        roomId: room.roomId,
        status: room.status,
        players: room.players,
        gameId: room.gameState?.id,
        maxRounds: room.gameState?.maxRounds
      });

      // If game is ready to start, emit game-start event
      if (room.status === 'playing') {
        console.log(`Game starting for room ${roomId}`);
        this.io.to(roomId).emit('game-start', {
          roomId: room.roomId,
          maxRounds: room.gameState?.maxRounds
        });
      }

      console.log(`Player ${playerId} set ready: ${isReady} in room ${roomId}`);
    } catch (error) {
      console.error(`Error setting ready status:`, error);
      socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to set ready status' });
    }
  }

  private async handleSubmitGuess(socket: any, data: { roomId: string; playerId: string; guess: string }): Promise<void> {
    const { roomId, playerId, guess } = data;
    
    try {
      const result = await multiplayerService.submitMultiplayerGuess(roomId, playerId, guess);
      
      // Emit guess result to the specific player
      socket.emit('guess-result', {
        evaluation: result.evaluation,
        gameStatus: result.gameStatus,
        answer: result.answer
      });

      // If game is over, notify all players in the room
      if (result.gameStatus !== 'playing') {
        const room = multiplayerService.getRoom(roomId);
        if (room) {
          this.io.to(roomId).emit('game-over', {
            roomId: room.roomId,
            players: room.players.map(player => ({
              id: player.id,
              name: player.name,
              gameStatus: player.gameState?.gameStatus,
              answer: player.gameState?.answer
            }))
          });
        }
      }

      console.log(`Player ${playerId} submitted guess in room ${roomId}`);
    } catch (error) {
      socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to submit guess' });
    }
  }

  private handleLeaveRoom(socket: any, data: { roomId: string; playerId: string }): void {
    const { roomId, playerId } = data;
    
    try {
      multiplayerService.leaveRoom(roomId, playerId);
      
      // Leave the socket room
      socket.leave(roomId);
      
      // Clear socket data
      socket.data.roomId = undefined;
      socket.data.playerId = undefined;
      socket.data.playerName = undefined;

      // Get updated room state and emit to remaining players
      const room = multiplayerService.getRoom(roomId);
      if (room) {
        this.io.to(roomId).emit('room-updated', {
          roomId: room.roomId,
          status: room.status,
          players: room.players,
          gameId: room.gameState?.id,
          maxRounds: room.gameState?.maxRounds
        });
      } else {
        // Room was deleted, notify remaining players
        this.io.to(roomId).emit('room-deleted', { roomId });
      }

      console.log(`Player ${playerId} left room ${roomId}`);
    } catch (error) {
      socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to leave room' });
    }
  }

  private handleDisconnect(socket: any): void {
    const { roomId, playerId } = socket.data;
    
    if (roomId && playerId) {
      this.handleLeaveRoom(socket, { roomId, playerId });
    }

    console.log(`Client disconnected: ${socket.id}`);
  }

  // Method to emit to specific room
  public emitToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  // Method to emit to specific socket
  public emitToSocket(socketId: string, event: string, data: any): void {
    this.io.to(socketId).emit(event, data);
  }
} 