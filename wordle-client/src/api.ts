// API service for communicating with the Wordle server
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface StartGameResponse {
  gameId: string;
  maxRounds: number;
}

export interface GuessRequest {
  guess: string;
}

export interface GuessResponse {
  evaluation: string[];
  gameStatus: string;
  answer?: string;
  error?: string;
}

export interface GameStatusResponse {
  gameStatus: string;
  guesses: string[];
  maxRounds: number;
  answer?: string;
}

// Start a new game
export const startNewGame = async (): Promise<StartGameResponse> => {
  try {
    const response = await fetch(`${API_BASE}/game/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to start game: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting game:', error);
    throw new Error('Failed to start new game');
  }
};

// Submit a guess
export const submitGuess = async (
  gameId: string,
  guess: string
): Promise<GuessResponse> => {
  try {
    const response = await fetch(`${API_BASE}/game/${gameId}/guess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guess }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error submitting guess:', error);
    throw error;
  }
};

// Get game status (optional)
export const getGameStatus = async (gameId: string): Promise<GameStatusResponse> => {
  try {
    const response = await fetch(`${API_BASE}/game/${gameId}`);

    if (!response.ok) {
      throw new Error(`Failed to get game status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting game status:', error);
    throw error;
  }
}; 