export const BREAKOUT_GRID_WIDTH = 52;
export const BREAKOUT_GRID_HEIGHT = 12;
export const BREAKOUT_CELL_SIZE = 32;
export const BREAKOUT_CELL_GAP = 5;

export const BLOCK_ROWS = 4;
export const BLOCK_START_ROW = 1;

export const PADDLE_WIDTH = 5;
export const PADDLE_HEIGHT = 1;
export const PADDLE_Y = BREAKOUT_GRID_HEIGHT - 2;
export const PADDLE_MOVE_SPEED = 80;

export const BALL_SPEED = 100;
export const BALL_INITIAL_ANGLE = -Math.PI / 4;

export const INITIAL_LIVES = 3;
export const LAUNCH_DELAY = 500;

export const SCORE_PER_LEVEL: Record<number, number> = {
  1: 10,
  2: 20,
  3: 40,
  4: 80,
};

export const COLOR_PADDLE = '#58a6ff';
export const COLOR_BALL = '#ffffff';
