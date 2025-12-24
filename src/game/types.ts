export interface Position {
  x: number;
  y: number;
}

export interface ContributionSquare {
  date: string;
  level: number;
  position: Position;
}

export interface ContributionGraph {
  squares: ContributionSquare[];
  weeks: number;
  days: number;
}

export const Direction = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];

export const GameState = {
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];

export interface ScoreEntry {
  score: number;
  username: string;
  date: string;
  timestamp: number;
}
