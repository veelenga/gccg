import type { GameType } from '../core/types';
import { MAX_HIGH_SCORES } from '../core/constants';

export interface GameMetadata {
  snake?: {
    foodEaten: number;
    finalSpeed: number;
    finalLength: number;
  };
  tanks?: {
    tanksDestroyed: number;
    accuracy: number;
    wavesCompleted: number;
  };
  breakout?: {
    blocksDestroyed: number;
    maxCombo: number;
    livesRemaining: number;
  };
}

export interface ScoreEntry {
  score: number;
  username: string;
  date: string;
  timestamp: number;
  gameType: GameType;
  metadata?: GameMetadata;
}

// Separate storage keys per game
const STORAGE_KEYS = {
  snake: 'ghc_snake_scores',
  tanks: 'ghc_tanks_scores',
  breakout: 'ghc_breakout_scores',
} as const;

export function saveScore(
  score: number,
  username: string,
  gameType: GameType,
  metadata?: GameMetadata
): void {
  const scores = getHighScores(gameType);

  const newEntry: ScoreEntry = {
    score,
    username,
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    gameType,
    metadata,
  };

  scores.push(newEntry);
  scores.sort((a, b) => b.score - a.score);

  const topScores = scores.slice(0, MAX_HIGH_SCORES);
  const storageKey = STORAGE_KEYS[gameType];

  try {
    localStorage.setItem(storageKey, JSON.stringify(topScores));
  } catch (error) {
    console.error('Failed to save score to localStorage:', error);
  }
}

export function getHighScores(gameType: GameType): ScoreEntry[] {
  const storageKey = STORAGE_KEYS[gameType];

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return [];
    }

    const scores = JSON.parse(stored);
    return Array.isArray(scores) ? scores : [];
  } catch (error) {
    console.error('Failed to load scores from localStorage:', error);
    return [];
  }
}

export function getHighestScore(gameType: GameType): number {
  const scores = getHighScores(gameType);
  return scores.length > 0 ? scores[0].score : 0;
}

export function isHighScore(score: number, gameType: GameType): boolean {
  const scores = getHighScores(gameType);
  if (scores.length < MAX_HIGH_SCORES) {
    return true;
  }
  return score > scores[scores.length - 1].score;
}

export function clearScores(gameType: GameType): void {
  const storageKey = STORAGE_KEYS[gameType];
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to clear scores from localStorage:', error);
  }
}
