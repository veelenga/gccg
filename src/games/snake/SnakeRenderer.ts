import { BaseRenderer } from '../../core/BaseRenderer';
import type { SnakeGame } from './SnakeGame';
import type { Position } from '../../core/types';
import { COLOR_LEVELS } from '../../core/constants';
import { COLOR_SNAKE_HEAD, COLOR_SNAKE_BODY } from './constants';

const MAX_SNAKE_LENGTH_CACHE = 100;

export class SnakeRenderer extends BaseRenderer {
  private snakeGame: SnakeGame;
  private snakeColorCache: string[] = [];

  constructor(canvas: HTMLCanvasElement, game: SnakeGame) {
    super(canvas, game);
    this.snakeGame = game;
    this.initSnakeColorCache();
  }

  private initSnakeColorCache(): void {
    this.snakeColorCache = [COLOR_SNAKE_HEAD];
    for (let i = 1; i < MAX_SNAKE_LENGTH_CACHE; i++) {
      const factor = i / (MAX_SNAKE_LENGTH_CACHE - 1);
      this.snakeColorCache.push(this.interpolateColor(COLOR_SNAKE_HEAD, COLOR_SNAKE_BODY, factor));
    }
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

        if (isFood && cell.level > 0) {
          this.drawFoodCell(cell.position, cell.level);
        } else {
          this.drawCell(cell.position, COLOR_LEVELS[cell.level]);
        }
      });
    });
  }

  private drawFoodCell(pos: Position, level: number): void {
    const x = pos.x * this.effectiveSize;
    const y = pos.y * this.effectiveSize;
    const size = this.gridConfig.cellSize;
    const radius = Math.min(3, size / 8);

    const time = this.renderTime / 1000;
    const pulse = Math.sin(time * 4) * 0.3 + 0.7;

    const foodColors = ['#ffd700', '#ffcc00', '#ffaa00', '#ff9500', '#ff8800'];
    const baseColor = foodColors[level] || foodColors[1];

    this.ctx.save();
    this.ctx.shadowBlur = 12 + 8 * pulse;
    this.ctx.shadowColor = baseColor;

    this.ctx.fillStyle = baseColor;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, size, size, radius);
    this.ctx.fill();

    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * pulse})`;
    this.ctx.beginPath();
    this.ctx.roundRect(x + 2, y + 2, size - 4, size / 2 - 2, radius);
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawSnake(): void {
    const snake = this.snakeGame.getSnake();
    const body = snake.getBody();

    for (let i = body.length - 1; i >= 0; i--) {
      const isHead = i === 0;
      const isTail = i === body.length - 1;
      this.drawSnakeSegment(body[i], isHead, isTail, i, body.length);
    }
  }

  private drawSnakeSegment(
    position: Position,
    isHead: boolean,
    isTail: boolean,
    index: number,
    totalLength: number
  ): void {
    const x = position.x * this.effectiveSize;
    const y = position.y * this.effectiveSize;
    const size = this.gridConfig.cellSize;
    const radius = Math.min(4, size / 6);

    const cacheIndex = Math.min(
      Math.floor((index / Math.max(1, totalLength - 1)) * (MAX_SNAKE_LENGTH_CACHE - 1)),
      MAX_SNAKE_LENGTH_CACHE - 1
    );
    const color = isHead ? COLOR_SNAKE_HEAD : this.snakeColorCache[cacheIndex];

    const segmentSize = isTail ? size - 4 : size;
    const offset = isTail ? 2 : 0;

    this.ctx.save();

    if (isHead) {
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = COLOR_SNAKE_HEAD;
    }

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.roundRect(x + offset, y + offset, segmentSize, segmentSize, radius);
    this.ctx.fill();

    if (isHead) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      this.ctx.beginPath();
      this.ctx.roundRect(x + 3, y + 3, size - 6, size / 2 - 2, radius / 2);
      this.ctx.fill();

      this.drawSnakeEyes(x, y, size);
    }

    this.ctx.restore();
  }

  private drawSnakeEyes(x: number, y: number, size: number): void {
    const snake = this.snakeGame.getSnake();
    const direction = snake.getDirection();

    const eyeSize = Math.max(3, size / 8);
    const eyeOffset = size / 4;

    let leftEye = { x: x + eyeOffset, y: y + eyeOffset };
    let rightEye = { x: x + size - eyeOffset - eyeSize, y: y + eyeOffset };

    switch (direction) {
      case 'DOWN':
        leftEye = { x: x + eyeOffset, y: y + size - eyeOffset - eyeSize };
        rightEye = { x: x + size - eyeOffset - eyeSize, y: y + size - eyeOffset - eyeSize };
        break;
      case 'LEFT':
        leftEye = { x: x + eyeOffset, y: y + eyeOffset };
        rightEye = { x: x + eyeOffset, y: y + size - eyeOffset - eyeSize };
        break;
      case 'RIGHT':
        leftEye = { x: x + size - eyeOffset - eyeSize, y: y + eyeOffset };
        rightEye = { x: x + size - eyeOffset - eyeSize, y: y + size - eyeOffset - eyeSize };
        break;
    }

    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(leftEye.x + eyeSize / 2, leftEye.y + eyeSize / 2, eyeSize, 0, Math.PI * 2);
    this.ctx.arc(rightEye.x + eyeSize / 2, rightEye.y + eyeSize / 2, eyeSize, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.beginPath();
    this.ctx.arc(leftEye.x + eyeSize / 2, leftEye.y + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
    this.ctx.arc(rightEye.x + eyeSize / 2, rightEye.y + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
