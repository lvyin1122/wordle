import { GameConfig } from "./types";

export const GAME_CONFIG: GameConfig = {
  MAX_ROUNDS: 6,
  WORDS: ["after", "beach", "cable", "photo", "usual", "watch"],
};

export const getRandomWord = (): string => {
  const randomIndex = Math.floor(Math.random() * GAME_CONFIG.WORDS.length);
  return GAME_CONFIG.WORDS[randomIndex].toUpperCase();
};

export const isValidWord = (word: string): boolean => {
  return GAME_CONFIG.WORDS.includes(word.toLowerCase());
};
