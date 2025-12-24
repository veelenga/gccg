// Tanks Arena Game Constants

// Grid configuration
export const TANKS_GRID_WIDTH = 40;
export const TANKS_GRID_HEIGHT = 20;
export const TANKS_CELL_SIZE = 24;
export const TANKS_CELL_GAP = 2;

// Tank properties
export const TANK_SIZE = 1; // Occupies 1 cell
export const PLAYER_TANK_HP = 3;
export const ENEMY_TANK_HP = 1;
export const TANK_MOVE_SPEED = 150; // ms per cell
export const TANK_SHOOT_COOLDOWN = 500; // ms between shots

// Bullet properties
export const BULLET_SPEED = 80; // ms per cell (faster than tanks)
export const BULLET_DAMAGE = 1;

// Game settings
export const INITIAL_ENEMY_COUNT = 3;
export const MAX_ENEMIES_ON_FIELD = 5;
export const ENEMY_SPAWN_INTERVAL = 5000; // ms
export const ENEMY_AI_UPDATE_INTERVAL = 300; // ms

// Scoring
export const SCORE_PER_ENEMY = 100;
export const SCORE_PER_WAVE = 500;

// Obstacle density (percentage of cells that are obstacles)
export const OBSTACLE_DENSITY = 0.25;

// Colors
export const COLOR_PLAYER_TANK = '#58a6ff';
export const COLOR_ENEMY_TANK = '#f85149';
export const COLOR_BULLET = '#ffd700';
export const COLOR_WALL = '#484f58';
export const COLOR_DESTRUCTIBLE = '#30363d';
