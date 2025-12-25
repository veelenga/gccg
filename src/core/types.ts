export interface Position {
  x: number;
  y: number;
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

export const CellType = {
  EMPTY: 'EMPTY',
  OBSTACLE: 'OBSTACLE',
  PLAYABLE: 'PLAYABLE',
} as const;

export type CellType = (typeof CellType)[keyof typeof CellType];

export interface GridCell {
  position: Position;
  type: CellType;
  level: number; // 0-4 for visual intensity
}

export interface GridConfig {
  width: number;
  height: number;
  cellSize: number;
  gap: number;
}

export const GameType = {
  SNAKE: 'snake',
  TANKS: 'tanks',
  BREAKOUT: 'breakout',
} as const;

export type GameType = (typeof GameType)[keyof typeof GameType];

export interface GameInput {
  type: 'direction' | 'action' | 'release';
  direction?: Direction;
  action?: string;
}
