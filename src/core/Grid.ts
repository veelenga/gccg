import type { Position, GridCell, GridConfig, CellType } from './types';

export class Grid {
  private cells: GridCell[][];
  public readonly config: GridConfig;

  constructor(config: GridConfig, cells: GridCell[][]) {
    this.config = config;
    this.cells = cells;
  }

  getCellAt(pos: Position): GridCell | null {
    if (!this.isValidPosition(pos)) {
      return null;
    }
    return this.cells[pos.y][pos.x];
  }

  getAvailableCells(filter?: (cell: GridCell) => boolean): GridCell[] {
    const cells: GridCell[] = [];

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const cell = this.cells[y][x];
        if (!filter || filter(cell)) {
          cells.push(cell);
        }
      }
    }

    return cells;
  }

  isValidPosition(pos: Position): boolean {
    return (
      pos.x >= 0 &&
      pos.x < this.config.width &&
      pos.y >= 0 &&
      pos.y < this.config.height
    );
  }

  getAllCells(): GridCell[][] {
    return this.cells;
  }

  updateCellType(pos: Position, type: CellType): void {
    const cell = this.getCellAt(pos);
    if (cell) {
      cell.type = type;
    }
  }

  updateCellLevel(pos: Position, level: number): void {
    const cell = this.getCellAt(pos);
    if (cell) {
      cell.level = level;
    }
  }
}
