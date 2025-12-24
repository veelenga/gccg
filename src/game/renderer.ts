import { Game } from './Game';
import type { Position, ContributionSquare } from './types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CELL_SIZE,
  EFFECTIVE_CELL_SIZE,
  COLOR_LEVELS,
  COLOR_SNAKE_HEAD,
  COLOR_SNAKE_BODY,
  COLOR_GRID_BG,
} from './constants';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private game: Game;

  constructor(canvas: HTMLCanvasElement, game: Game) {
    this.canvas = canvas;
    this.game = game;

    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;

    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.ctx.imageSmoothingEnabled = true;
  }

  render(): void {
    this.clear();
    this.drawContributionGraph();
    this.drawSnake();
  }

  private clear(): void {
    this.ctx.fillStyle = COLOR_GRID_BG;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawContributionGraph(): void {
    const graph = this.game.getContributionGraph();
    const foodSquares = this.game.getFoodSquares();

    graph.squares.forEach((square) => {
      const isFood = foodSquares.has(this.positionToKey(square.position));
      this.drawSquare(square, isFood);
    });
  }

  private drawSquare(square: ContributionSquare, isFood: boolean): void {
    const { x, y } = square.position;
    const pixelX = x * EFFECTIVE_CELL_SIZE;
    const pixelY = y * EFFECTIVE_CELL_SIZE;

    this.ctx.fillStyle = COLOR_LEVELS[square.level];
    this.ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);

    if (isFood && square.level > 0) {
      this.drawFoodGlow(pixelX, pixelY);
    }
  }

  private drawFoodGlow(x: number, y: number): void {
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 5) * 0.5 + 0.5;

    this.ctx.save();

    this.ctx.shadowBlur = 25;
    this.ctx.shadowColor = '#ffcc00';

    this.ctx.fillStyle = '#ffdd33';
    this.ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    this.ctx.strokeStyle = '#ffee66';
    this.ctx.lineWidth = 4;
    this.ctx.globalAlpha = 0.8 + pulse * 0.2;
    this.ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    this.ctx.shadowBlur = 40 * pulse;
    this.ctx.shadowColor = '#ffaa00';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.globalAlpha = pulse;
    this.ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

    this.ctx.restore();
  }

  private drawSnake(): void {
    const snake = this.game.getSnake();
    const body = snake.getBody();

    body.forEach((segment, index) => {
      const isHead = index === 0;
      this.drawSnakeSegment(segment, isHead);
    });
  }

  private drawSnakeSegment(position: Position, isHead: boolean): void {
    const pixelX = position.x * EFFECTIVE_CELL_SIZE;
    const pixelY = position.y * EFFECTIVE_CELL_SIZE;

    this.ctx.fillStyle = isHead ? COLOR_SNAKE_HEAD : COLOR_SNAKE_BODY;

    if (isHead) {
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = COLOR_SNAKE_HEAD;
    }

    this.ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);

    if (isHead) {
      this.ctx.shadowBlur = 0;

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(pixelX + 2, pixelY + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    }
  }

  private positionToKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  startRenderLoop(): void {
    const renderLoop = () => {
      this.render();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }
}
