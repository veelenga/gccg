import { Grid } from '../../core/Grid';
import type { GridCell, GridConfig } from '../../core/types';
import { CellType } from '../../core/types';
import {
  SNAKE_GRID_WIDTH,
  SNAKE_GRID_HEIGHT,
  SNAKE_CELL_SIZE,
  SNAKE_CELL_GAP,
} from './constants';

export function generateSnakeGrid(): Grid {
  const config: GridConfig = {
    width: SNAKE_GRID_WIDTH,
    height: SNAKE_GRID_HEIGHT,
    cellSize: SNAKE_CELL_SIZE,
    gap: SNAKE_CELL_GAP,
  };

  const cells: GridCell[][] = [];

  for (let y = 0; y < config.height; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < config.width; x++) {
      const level = getSnakeContributionLevel();
      const type = level > 0 ? CellType.PLAYABLE : CellType.EMPTY;

      row.push({
        position: { x, y },
        type,
        level,
      });
    }
    cells.push(row);
  }

  return new Grid(config, cells);
}

function getSnakeContributionLevel(): number {
  const random = Math.random();
  if (random < 0.1) return 0;
  if (random < 0.25) return 1;
  if (random < 0.5) return 2;
  if (random < 0.75) return 3;
  return 4;
}
