import { Grid } from '../../core/Grid';
import type { GridConfig, GridCell, Position } from '../../core/types';
import { CellType } from '../../core/types';
import {
  TANKS_GRID_WIDTH,
  TANKS_GRID_HEIGHT,
  TANKS_CELL_SIZE,
  TANKS_CELL_GAP,
} from './constants';

export function generateTanksGrid(): Grid {
  const config: GridConfig = {
    width: TANKS_GRID_WIDTH,
    height: TANKS_GRID_HEIGHT,
    cellSize: TANKS_CELL_SIZE,
    gap: TANKS_CELL_GAP,
  };

  const cells: GridCell[][] = [];

  for (let y = 0; y < config.height; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < config.width; x++) {
      const cell = createCell({ x, y }, config);
      row.push(cell);
    }
    cells.push(row);
  }

  return new Grid(config, cells);
}

function createCell(position: Position, config: GridConfig): GridCell {
  if (isBorderCell(position, config)) {
    return {
      position,
      type: CellType.OBSTACLE,
      level: 4,
    };
  }

  if (isSpawnZone(position, config)) {
    return {
      position,
      type: CellType.PLAYABLE,
      level: 0,
    };
  }

  if (shouldPlaceObstacle(position, config)) {
    const level = getObstacleLevel(position);
    return {
      position,
      type: CellType.OBSTACLE,
      level,
    };
  }

  const bgLevel = getBackgroundLevel(position);
  return {
    position,
    type: CellType.PLAYABLE,
    level: bgLevel,
  };
}

function getObstacleLevel(position: Position): number {
  const pattern = (position.x * 7 + position.y * 13) % 10;
  if (pattern < 2) return 4;
  if (pattern < 5) return 3;
  if (pattern < 8) return 2;
  return 1;
}

function getBackgroundLevel(position: Position): number {
  const noise = Math.sin(position.x * 0.5) * Math.cos(position.y * 0.7);
  return noise > 0.7 ? 1 : 0;
}

function isBorderCell(position: Position, config: GridConfig): boolean {
  return (
    position.x === 0 ||
    position.y === 0 ||
    position.x === config.width - 1 ||
    position.y === config.height - 1
  );
}

function isSpawnZone(position: Position, config: GridConfig): boolean {
  const spawnSize = 3;

  if (position.x <= spawnSize && position.y >= config.height - spawnSize - 1) {
    return true;
  }

  if (position.x <= spawnSize && position.y <= spawnSize) {
    return true;
  }
  if (position.x >= config.width - spawnSize - 1 && position.y <= spawnSize) {
    return true;
  }
  if (
    position.x >= config.width / 2 - 2 &&
    position.x <= config.width / 2 + 2 &&
    position.y <= spawnSize
  ) {
    return true;
  }

  return false;
}

function shouldPlaceObstacle(position: Position, _config: GridConfig): boolean {
  const gridSpacing = 3;
  const clusterX = Math.floor(position.x / gridSpacing);
  const clusterY = Math.floor(position.y / gridSpacing);
  const clusterSeed = (clusterX * 17 + clusterY * 31) % 100;
  const isActiveCluster = clusterSeed < 40;

  if (isActiveCluster) {
    const localX = position.x % gridSpacing;
    const localY = position.y % gridSpacing;
    const localSeed = (localX * 3 + localY * 5 + clusterSeed) % 10;
    return localSeed < 6;
  }

  const sparseSeed = (position.x * 11 + position.y * 23) % 100;
  return sparseSeed < 15;
}

export function getPlayerSpawnPosition(): Position {
  return { x: 2, y: TANKS_GRID_HEIGHT - 3 };
}

export function getEnemySpawnPositions(): Position[] {
  return [
    { x: 2, y: 2 },
    { x: TANKS_GRID_WIDTH - 3, y: 2 },
    { x: Math.floor(TANKS_GRID_WIDTH / 2), y: 2 },
  ];
}
