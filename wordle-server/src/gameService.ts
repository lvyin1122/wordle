import { GameState, GameStatus } from './types';
import { getRandomWord, GAME_CONFIG } from './config';
import { evaluateGuess, isGameWon, isGameLost, validateGuess } from './gameLogic';
import { validateWord } from './wordValidation';

class GameService {
  private games: Map<string, GameState> = new Map();

  startNewGame(): { gameId: string; maxRounds: number } {
    const gameId = this.generateGameId();
    const answer = getRandomWord();
    
    const gameState: GameState = {
      id: gameId,
      answer,
      guesses: [],
      gameStatus: 'playing',
      maxRounds: 6,
      createdAt: new Date()
    };
    
    this.games.set(gameId, gameState);
    
    return {
      gameId,
      maxRounds: gameState.maxRounds
    };
  }

  async submitGuess(gameId: string, guess: string): Promise<{ 
    evaluation: string[]; 
    gameStatus: GameStatus; 
    answer?: string;
    error?: string;
  }> {
    const game = this.games.get(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    if (game.gameStatus !== 'playing') {
      throw new Error('Game is already finished');
    }
    
    const validation = validateGuess(guess);
    if (!validation.isValid) {
      return {
        evaluation: [],
        gameStatus: game.gameStatus,
        error: validation.error
      };
    }
    
    const normalizedGuess = guess.toUpperCase();
    
    // Use external API validation with fallback to local validation
    const wordValidation = await validateWord(normalizedGuess, GAME_CONFIG.WORDS, true);
    
    if (!wordValidation.isValid) {
      return {
        evaluation: [],
        gameStatus: game.gameStatus,
        error: wordValidation.error || 'Not a valid word'
      };
    }
    
    const { evaluation } = evaluateGuess(normalizedGuess, game.answer);
    game.guesses.push(normalizedGuess);
    
    if (isGameWon(normalizedGuess, game.answer)) {
      game.gameStatus = 'won';
    } else if (isGameLost(game.guesses.length, game.maxRounds)) {
      game.gameStatus = 'lost';
    }
    
    return {
      evaluation,
      gameStatus: game.gameStatus,
      answer: game.gameStatus !== 'playing' ? game.answer : undefined
    };
  }

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  private generateGameId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  cleanupOldGames(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [gameId, game] of this.games.entries()) {
      if (game.createdAt < oneHourAgo || game.gameStatus !== 'playing') {
        this.games.delete(gameId);
      }
    }
  }
}

export const gameService = new GameService(); 