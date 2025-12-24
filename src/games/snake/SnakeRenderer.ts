import { BaseRenderer } from '../../core/BaseRenderer';
import type { SnakeGame } from './SnakeGame';
import type { Position } from '../../core/types';
import { COLOR_LEVELS } from '../../core/constants';
import { COLOR_SNAKE_HEAD, COLOR_SNAKE_BODY } from './constants';

/**
 * Snake-specific renderer extending BaseRenderer.
 * Handles rendering of contribution grid, food, and snake segments.
 */
export class SnakeRenderer extends BaseRenderer {
  private snakeGame: SnakeGame;

  constructor(canvas: HTMLCanvasElement, game: SnakeGame) {
    super(canvas, game);
    this.snakeGame = game;
  }

  protected renderGame(): void {
    this.drawGrid();
    this.drawSnake();
  }

  private drawGrid(): void {
    const grid = this.snakeGame.getGrid();
    const foodSquares = this.snakeGame.getFoodSquares();
    const cells = grid.getAllCells();

    cells.forEach((row) => {
      row.forEach((cell) => {
        const isFood = foodSquares.has(this.positionToKey(cell.position));
        this.drawCell(cell.position, COLOR_LEVELS[cell.level]);

        if (isFood && cell.level > 0) {
          this.drawFoodGlow(cell.position);
        }
      });
    });
  }

  private drawFoodGlow(pos: Position): void {
    const gridConfig = this.snakeGame.getGrid().config;
    const effectiveSize = gridConfig.cellSize + gridConfig.gap;
    const x = pos.x * effectiveSize;
    const y = pos.y * effectiveSize;

    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 5) * 0.5 + 0.5;

    this.ctx.save();

    this.ctx.shadowBlur = 25;
    this.ctx.shadowColor = '#ffcc00';
    this.ctx.fillStyle = '#ffdd33';
    this.ctx.fillRect(x, y, gridConfig.cellSize, gridConfig.cellSize);

    this.ctx.strokeStyle = '#ffee66';
    this.ctx.lineWidth = 4;
    this.ctx.globalAlpha = 0.8 + pulse * 0.2;
    this.ctx.strokeRect(x + 2, y + 2, gridConfig.cellSize - 4, gridConfig.cellSize - 4);

    this.ctx.shadowBlur = 40 * pulse;
    this.ctx.shadowColor = '#ffaa00';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.globalAlpha = pulse;
    this.ctx.strokeRect(x, y, gridConfig.cellSize, gridConfig.cellSize);

    this.ctx.restore();
  }

  private drawSnake(): void {
    const snake = this.snakeGame.getSnake();
    const body = snake.getBody();

    body.forEach((segment, index) => {
      const isHead = index === 0;
      this.drawSnakeSegment(segment, isHead);
    });
  }

  private drawSnakeSegment(position: Position, isHead: boolean): void {
    const gridConfig = this.snakeGame.getGrid().config;
    const effectiveSize = gridConfig.cellSize + gridConfig.gap;
    const pixelX = position.x * effectiveSize;
    const pixelY = position.y * effectiveSize;

    this.ctx.fillStyle = isHead ? COLOR_SNAKE_HEAD : COLOR_SNAKE_BODY;

    if (isHead) {
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = COLOR_SNAKE_HEAD;
    }

    this.ctx.fillRect(pixelX, pixelY, gridConfig.cellSize, gridConfig.cellSize);

    if (isHead) {
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(
        pixelX + 2,
        pixelY + 2,
        gridConfig.cellSize - 4,
        gridConfig.cellSize - 4
      );
    }
  }
}
