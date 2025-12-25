import { BaseRenderer } from '../../core/BaseRenderer';
import type { BreakoutGame } from './BreakoutGame';
import { CellType } from '../../core/types';
import { COLOR_PADDLE, COLOR_BALL, INITIAL_LIVES } from './constants';
import { COLOR_LEVELS } from '../../core/constants';

export class BreakoutRenderer extends BaseRenderer {
  private breakoutGame: BreakoutGame;

  constructor(canvas: HTMLCanvasElement, game: BreakoutGame) {
    super(canvas, game);
    this.breakoutGame = game;
  }

  protected renderGame(): void {
    this.drawGrid();
    this.drawBlocks();
    this.drawPaddle();
    this.drawBall();
    this.drawLives();
  }

  private drawGrid(): void {
    const grid = this.breakoutGame.getGrid();
    const cells = grid.getAllCells();

    cells.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === CellType.OBSTACLE && cell.level === 4) {
          this.drawWallCell(cell.position);
        } else if (cell.type === CellType.PLAYABLE) {
          this.drawCell(cell.position, COLOR_LEVELS[0]);
        }
      });
    });
  }

  private drawWallCell(position: { x: number; y: number }): void {
    const x = position.x * this.effectiveSize;
    const y = position.y * this.effectiveSize;
    const size = this.gridConfig.cellSize;
    const radius = Math.min(2, size / 10);

    this.ctx.fillStyle = '#30363d';
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, size, size, radius);
    this.ctx.fill();
  }

  private drawBlocks(): void {
    const blocks = this.breakoutGame.getBlocks();
    const size = this.gridConfig.cellSize;
    const radius = Math.min(3, size / 8);

    for (const block of blocks) {
      if (block.isDestroyed()) continue;

      const pos = block.getPosition();
      const level = block.getLevel();
      const color = COLOR_LEVELS[level] || COLOR_LEVELS[1];

      const x = pos.x * this.effectiveSize;
      const y = pos.y * this.effectiveSize;

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, size, size, radius);
      this.ctx.fill();

      if (level >= 2) {
        const highlightAlpha = 0.1 + (level - 1) * 0.05;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${highlightAlpha})`;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 1, y + 1, size - 2, size / 3, radius);
        this.ctx.fill();
      }
    }
  }

  private drawPaddle(): void {
    const paddle = this.breakoutGame.getPaddle();

    const x = paddle.getX() * this.effectiveSize;
    const y = paddle.getY() * this.effectiveSize;
    const width = paddle.getWidth() * this.effectiveSize - this.gridConfig.gap;
    const height = this.gridConfig.cellSize;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.roundRect(x + 2, y + 2, width, height, 6);
    this.ctx.fill();

    const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, this.lightenColor(COLOR_PADDLE, 0.2));
    gradient.addColorStop(0.5, COLOR_PADDLE);
    gradient.addColorStop(1, this.darkenColor(COLOR_PADDLE, 0.2));

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, 6);
    this.ctx.fill();

    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = COLOR_PADDLE;
    this.ctx.strokeStyle = COLOR_PADDLE;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, 6);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.roundRect(x + 4, y + 2, width - 8, height / 3, 3);
    this.ctx.fill();
  }

  private drawBall(): void {
    const ball = this.breakoutGame.getBall();

    const rawPos = ball.getRawPosition();
    const x = rawPos.x * this.effectiveSize + this.gridConfig.cellSize / 2;
    const y = rawPos.y * this.effectiveSize + this.gridConfig.cellSize / 2;
    const radius = this.gridConfig.cellSize / 3;

    if (ball.isLaunched()) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = COLOR_BALL;

    const gradient = this.ctx.createRadialGradient(x - radius / 3, y - radius / 3, 0, x, y, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, COLOR_BALL);
    gradient.addColorStop(1, this.darkenColor(COLOR_BALL, 0.3));

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.beginPath();
    this.ctx.arc(x - radius / 3, y - radius / 3, radius / 3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;

    if (!ball.isLaunched()) {
      this.drawLaunchIndicator(x, y - 40);
    }
  }

  private drawLaunchIndicator(x: number, y: number): void {
    const time = this.renderTime / 1000;
    const pulse = Math.sin(time * 3) * 0.3 + 0.7;

    this.ctx.save();
    this.ctx.globalAlpha = pulse;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowColor = '#000000';
    this.ctx.fillText('Press SPACE to launch', x, y);
    this.ctx.restore();
  }

  private drawLives(): void {
    const lives = this.breakoutGame.getLives();
    const padding = 12;
    const heartSize = 16;
    const heartSpacing = 22;

    const panelWidth = INITIAL_LIVES * heartSpacing + padding;
    const panelHeight = heartSize + padding * 1.5;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.beginPath();
    this.ctx.roundRect(padding - 4, padding - 4, panelWidth, panelHeight, 6);
    this.ctx.fill();

    for (let i = 0; i < INITIAL_LIVES; i++) {
      const x = padding + i * heartSpacing + heartSize / 2;
      const y = padding + heartSize / 2;

      if (i < lives) {
        this.ctx.fillStyle = '#f85149';
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = '#f85149';
        this.drawHeart(x, y, heartSize);
        this.ctx.shadowBlur = 0;
      } else {
        this.ctx.strokeStyle = '#484f58';
        this.ctx.lineWidth = 2;
        this.drawHeartOutline(x, y, heartSize);
      }
    }
  }

  private drawHeart(cx: number, cy: number, size: number): void {
    const x = cx;
    const y = cy - size * 0.1;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y + size * 0.3);
    this.ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
    this.ctx.bezierCurveTo(x - size * 0.5, y + size * 0.6, x, y + size * 0.9, x, y + size);
    this.ctx.bezierCurveTo(x, y + size * 0.9, x + size * 0.5, y + size * 0.6, x + size * 0.5, y + size * 0.3);
    this.ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
    this.ctx.fill();
  }

  private drawHeartOutline(cx: number, cy: number, size: number): void {
    const x = cx;
    const y = cy - size * 0.1;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y + size * 0.3);
    this.ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
    this.ctx.bezierCurveTo(x - size * 0.5, y + size * 0.6, x, y + size * 0.9, x, y + size);
    this.ctx.bezierCurveTo(x, y + size * 0.9, x + size * 0.5, y + size * 0.6, x + size * 0.5, y + size * 0.3);
    this.ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
    this.ctx.stroke();
  }
}
