import { Router, Request, Response } from 'express';
import { multiplayerService } from '../multiplayerService';
import { CreateRoomRequest, JoinRoomRequest, PlayerReadyRequest } from '../types';

const router = Router();

// Create a new room
router.post('/room/create', (req: Request, res: Response) => {
  try {
    const { roomId, playerName }: CreateRoomRequest = req.body;
    
    if (!roomId || !playerName) {
      return res.status(400).json({ error: 'Room ID and player name are required' });
    }

    if (!/^\d{4}$/.test(roomId)) {
      return res.status(400).json({ error: 'Room ID must be a 4-digit number' });
    }

    const { room, player } = multiplayerService.createRoom(roomId, playerName);
    
    res.json({
      roomId: room.roomId,
      status: room.status,
      players: room.players,
      playerId: player.id,
      isHost: player.isHost
    });
  } catch (error) {
    console.error('Error creating room:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create room' });
    }
  }
});

// Join an existing room
router.post('/room/join', (req: Request, res: Response) => {
  try {
    const { roomId, playerName }: JoinRoomRequest = req.body;
    
    if (!roomId || !playerName) {
      return res.status(400).json({ error: 'Room ID and player name are required' });
    }

    const { room, player } = multiplayerService.joinRoom(roomId, playerName);
    
    res.json({
      roomId: room.roomId,
      status: room.status,
      players: room.players,
      playerId: player.id,
      isHost: player.isHost
    });
  } catch (error) {
    console.error('Error joining room:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to join room' });
    }
  }
});

// Get room status
router.get('/room/:roomId', (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const room = multiplayerService.getRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json({
      roomId: room.roomId,
      status: room.status,
      players: room.players,
      gameId: room.gameState?.id,
      maxRounds: room.gameState?.maxRounds
    });
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Set player ready status
router.post('/room/:roomId/ready', (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { playerId, isReady }: PlayerReadyRequest = req.body;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const room = multiplayerService.setPlayerReady(roomId, playerId, isReady);
    
    res.json({
      roomId: room.roomId,
      status: room.status,
      players: room.players,
      gameId: room.gameState?.id,
      maxRounds: room.gameState?.maxRounds
    });
  } catch (error) {
    console.error('Error setting player ready:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to set player ready' });
    }
  }
});

// Submit guess in multiplayer game
router.post('/room/:roomId/guess', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { playerId, guess } = req.body;
    
    if (!playerId || !guess) {
      return res.status(400).json({ error: 'Player ID and guess are required' });
    }

    const result = await multiplayerService.submitMultiplayerGuess(roomId, playerId, guess);
    
    res.json({
      evaluation: result.evaluation,
      gameStatus: result.gameStatus,
      answer: result.answer
    });
  } catch (error) {
    console.error('Error submitting multiplayer guess:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to submit guess' });
    }
  }
});

// Leave room
router.post('/room/:roomId/leave', (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    multiplayerService.leaveRoom(roomId, playerId);
    
    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

export default router; 