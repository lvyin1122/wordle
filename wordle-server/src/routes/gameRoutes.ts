import { Router, Request, Response } from 'express';
import { gameService } from '../gameService';
import { GuessRequest } from '../types';

const router = Router();

// Start a new game
router.post('/start', (req: Request, res: Response) => {
  try {
    const { gameId, maxRounds } = gameService.startNewGame();
    res.json({ gameId, maxRounds });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Submit a guess
router.post('/:gameId/guess', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { guess }: GuessRequest = req.body;
    
    if (!guess) {
      return res.status(400).json({ error: 'Guess is required' });
    }
    
    const result = await gameService.submitGuess(gameId, guess);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      evaluation: result.evaluation,
      gameStatus: result.gameStatus,
      answer: result.answer
    });
  } catch (error) {
    console.error('Error submitting guess:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Game not found') {
        return res.status(404).json({ error: 'Game not found' });
      }
      if (error.message === 'Game is already finished') {
        return res.status(400).json({ error: 'Game is already finished' });
      }
    }
    
    res.status(500).json({ error: 'Failed to submit guess' });
  }
});

// Get game status (optional endpoint)
router.get('/:gameId', (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = gameService.getGame(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json({
      gameStatus: game.gameStatus,
      guesses: game.guesses,
      maxRounds: game.maxRounds,
      answer: game.gameStatus !== 'playing' ? game.answer : undefined
    });
  } catch (error) {
    console.error('Error getting game:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
});

export default router; 