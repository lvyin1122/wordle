import { io, Socket } from 'socket.io-client';

export interface RoomInfo {
  roomId: string;
  status: string;
  players: Array<{
    id: string;
    name: string;
    isReady: boolean;
    isHost: boolean;
  }>;
  gameId?: string;
  maxRounds?: number;
}

export interface GuessResult {
  evaluation: string[];
  gameStatus: string;
  answer?: string;
}

export interface GameOverInfo {
  roomId: string;
  players: Array<{
    id: string;
    name: string;
    gameStatus: string;
    answer?: string;
  }>;
}

export class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });
  }

  // Join a room
  public joinRoom(roomId: string, playerId: string, playerName: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('join-room', { roomId, playerId, playerName });
  }

  // Set player ready status
  public setReady(roomId: string, playerId: string, isReady: boolean): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('set-ready', { roomId, playerId, isReady });
  }

  // Submit a guess
  public submitGuess(roomId: string, playerId: string, guess: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('submit-guess', { roomId, playerId, guess });
  }

  // Leave a room
  public leaveRoom(roomId: string, playerId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('leave-room', { roomId, playerId });
  }

  // Listen for room updates
  public onRoomUpdated(callback: (roomInfo: RoomInfo) => void): void {
    if (!this.socket) return;
    this.socket.on('room-updated', callback);
  }

  // Listen for game start
  public onGameStart(callback: (data: { roomId: string; maxRounds: number }) => void): void {
    if (!this.socket) return;
    this.socket.on('game-start', callback);
  }

  // Listen for guess results
  public onGuessResult(callback: (result: GuessResult) => void): void {
    if (!this.socket) return;
    this.socket.on('guess-result', callback);
  }

  // Listen for game over
  public onGameOver(callback: (data: GameOverInfo) => void): void {
    if (!this.socket) return;
    this.socket.on('game-over', callback);
  }

  // Listen for room deletion
  public onRoomDeleted(callback: (data: { roomId: string }) => void): void {
    if (!this.socket) return;
    this.socket.on('room-deleted', callback);
  }

  // Listen for errors
  public onError(callback: (error: { message: string }) => void): void {
    if (!this.socket) return;
    this.socket.on('error', callback);
  }

  // Remove event listeners
  public off(event: string): void {
    if (!this.socket) return;
    this.socket.off(event);
  }

  // Remove all event listeners
  public offAll(): void {
    if (!this.socket) return;
    this.socket.off();
  }

  // Disconnect socket
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Check if connected
  public getConnected(): boolean {
    return this.isConnected;
  }

  // Get socket instance
  public getSocket(): Socket | null {
    return this.socket;
  }
}

// Create a singleton instance
export const socketService = new SocketService(); 