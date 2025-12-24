export const GRID_SIZE = 52;
export const CELL_SIZE = 32;
export const CELL_GAP = 5;
export const EFFECTIVE_CELL_SIZE = CELL_SIZE + CELL_GAP;

export const CANVAS_WIDTH = GRID_SIZE * EFFECTIVE_CELL_SIZE;
export const CANVAS_HEIGHT = 7 * EFFECTIVE_CELL_SIZE;

export const INITIAL_SNAKE_LENGTH = 3;
export const INITIAL_SPEED = 100;
export const MIN_SPEED = 40;
export const SPEED_INCREMENT = 3;

export const SCORE_PER_FOOD = 10;
export const INITIAL_FOOD_COUNT = 5;
export const MAX_FOOD_ON_BOARD = 8;

export const MAX_HIGH_SCORES = 10;
export const STORAGE_KEY_SCORES = 'ghc_snake_scores';

export const CONTRIBUTION_LEVELS = 5;
export const CONTRIBUTION_WEEKS = 52;
export const CONTRIBUTION_DAYS = 7;

export const COLOR_LEVELS = [
  '#161b22',
  '#0e4429',
  '#006d32',
  '#26a641',
  '#39d353',
];

export const COLOR_SNAKE_HEAD = '#58a6ff';
export const COLOR_SNAKE_BODY = '#388bfd';
export const COLOR_FOOD_GLOW = '#f78166';
export const COLOR_GRID_BG = '#0d1117';
