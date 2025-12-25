import { Grid } from '../../core/Grid';
import type { GridConfig, GridCell, Position } from '../../core/types';
import { CellType } from '../../core/types';
import {
  BREAKOUT_GRID_WIDTH,
  BREAKOUT_GRID_HEIGHT,
  BREAKOUT_CELL_SIZE,
  BREAKOUT_CELL_GAP,
  BLOCK_ROWS,
  BLOCK_START_ROW,
} from './constants';
import { Block } from './entities/Block';

export interface BreakoutGridResult {
  grid: Grid;
  blocks: Block[];
}

export function generateBreakoutGrid(): BreakoutGridResult {
  const config: GridConfig = {
    width: BREAKOUT_GRID_WIDTH,
    height: BREAKOUT_GRID_HEIGHT,
    cellSize: BREAKOUT_CELL_SIZE,
    gap: BREAKOUT_CELL_GAP,
  };

  const cells: GridCell[][] = [];
  const blocks: Block[] = [];

  for (let y = 0; y < config.height; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < config.width; x++) {
      const position: Position = { x, y };
      const cell = createCell(position, config, blocks);
      row.push(cell);
    }
    cells.push(row);
  }

  return {
    grid: new Grid(config, cells),
    blocks,
  };
}

function createCell(position: Position, config: GridConfig, blocks: Block[]): GridCell {
  if (position.x === 0 || position.x === config.width - 1) {
    return {
      position,
      type: CellType.OBSTACLE,
      level: 4,
    };
  }

  if (isBlockArea(position)) {
    const level = getBlockLevel(position);
    if (shouldPlaceBlock(position)) {
      const block = new Block(position, level);
      blocks.push(block);
      return {
        position,
        type: CellType.OBSTACLE,
        level,
      };
    }
  }

  return {
    position,
    type: CellType.PLAYABLE,
    level: 0,
  };
}

function isBlockArea(position: Position): boolean {
  return position.y >= BLOCK_START_ROW && position.y < BLOCK_START_ROW + BLOCK_ROWS;
}

function getBlockLevel(position: Position): number {
  const rowFromTop = position.y - BLOCK_START_ROW;
  return Math.max(1, BLOCK_ROWS - rowFromTop);
}

function shouldPlaceBlock(position: Position): boolean {
  if (position.x <= 1 || position.x >= BREAKOUT_GRID_WIDTH - 2) {
    return false;
  }

  const hasGap = (position.x + position.y) % 7 === 0;
  if (hasGap && Math.random() < 0.3) {
    return false;
  }

  return Math.random() < 0.85;
}
