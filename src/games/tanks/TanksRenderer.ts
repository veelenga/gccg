import { BaseRenderer } from '../../core/BaseRenderer';
import type { TanksGame } from './TanksGame';
import type { Position, Direction } from '../../core/types';
import { Direction as DirectionEnum, CellType } from '../../core/types';
import { COLOR_PLAYER_TANK, COLOR_ENEMY_TANK, COLOR_BULLET } from './constants';
import { COLOR_LEVELS } from '../../core/constants';

export class TanksRenderer extends BaseRenderer {
  private tanksGame: TanksGame;

  constructor(canvas: HTMLCanvasElement, game: TanksGame) {
    super(canvas, game);
    this.tanksGame = game;
  }

  protected renderGame(): void {
    this.drawGrid();
    this.drawBullets();
    this.drawTanks();
    this.drawPlayerHP();
  }

  private drawGrid(): void {
    const grid = this.tanksGame.getGrid();
    const cells = grid.getAllCells();

    cells.forEach((row) => {
      row.forEach((cell) => {
        const color = COLOR_LEVELS[cell.level] || COLOR_LEVELS[0];
        if (cell.type === CellType.OBSTACLE) {
          this.drawObstacleCell(cell.position, color, cell.level);
        } else {
          this.drawCell(cell.position, color);
        }
      });
    });
  }

  private drawObstacleCell(pos: Position, color: string, level: number): void {
    const x = pos.x * this.effectiveSize;
    const y = pos.y * this.effectiveSize;
    const size = this.gridConfig.cellSize;
    const radius = Math.min(3, size / 8);

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

    if (level === 4) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.roundRect(x + 0.5, y + 0.5, size - 1, size - 1, radius);
      this.ctx.stroke();
    }
  }

  private drawTanks(): void {
    for (const enemy of this.tanksGame.getEnemies()) {
      if (enemy.isAlive()) {
        this.drawTank(enemy.getPosition(), enemy.getDirection(), COLOR_ENEMY_TANK, false);
      }
    }

    const player = this.tanksGame.getPlayer();
    if (player.isAlive()) {
      this.drawTank(player.getPosition(), player.getDirection(), COLOR_PLAYER_TANK, true);
    }
  }

  private drawTank(position: Position, direction: Direction, color: string, isPlayer: boolean): void {
    const x = position.x * this.effectiveSize;
    const y = position.y * this.effectiveSize;
    const size = this.gridConfig.cellSize;

    this.ctx.save();

    const angle = this.getDirectionAngle(direction);
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(angle);
    this.ctx.translate(-centerX, -centerY);

    if (isPlayer) {
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = color;
    }

    const bodyMargin = size * 0.1;
    const bodyWidth = size - bodyMargin * 2;
    const bodyHeight = size - bodyMargin * 2;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.roundRect(x + bodyMargin, y + bodyMargin, bodyWidth, bodyHeight, 3);
    this.ctx.fill();

    this.drawTracks(x, y, size, bodyMargin, color);
    this.drawTurret(centerX, centerY, size, color);
    this.drawBarrel(centerX, y, size, bodyMargin, color);

    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  private getDirectionAngle(direction: Direction): number {
    switch (direction) {
      case DirectionEnum.UP: return 0;
      case DirectionEnum.RIGHT: return Math.PI / 2;
      case DirectionEnum.DOWN: return Math.PI;
      case DirectionEnum.LEFT: return -Math.PI / 2;
    }
  }

  private drawTracks(x: number, y: number, size: number, bodyMargin: number, color: string): void {
    const trackWidth = size * 0.2;
    const trackHeight = size * 0.75;
    const trackY = y + (size - trackHeight) / 2;

    this.ctx.fillStyle = this.darkenColor(color, 0.4);
    this.ctx.beginPath();
    this.ctx.roundRect(x + bodyMargin - trackWidth / 2, trackY, trackWidth, trackHeight, 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.roundRect(x + size - bodyMargin - trackWidth / 2, trackY, trackWidth, trackHeight, 2);
    this.ctx.fill();

    this.ctx.fillStyle = this.darkenColor(color, 0.6);
    const grooveCount = 4;
    const grooveHeight = trackHeight / (grooveCount * 2);
    for (let i = 0; i < grooveCount; i++) {
      const grooveY = trackY + grooveHeight + i * grooveHeight * 2;
      this.ctx.fillRect(x + bodyMargin - trackWidth / 2, grooveY, trackWidth, grooveHeight * 0.5);
      this.ctx.fillRect(x + size - bodyMargin - trackWidth / 2, grooveY, trackWidth, grooveHeight * 0.5);
    }
  }

  private drawTurret(centerX: number, centerY: number, size: number, color: string): void {
    const turretRadius = size * 0.22;
    this.ctx.fillStyle = this.lightenColor(color, 0.15);
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, turretRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = this.darkenColor(color, 0.2);
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, turretRadius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private drawBarrel(centerX: number, y: number, size: number, bodyMargin: number, color: string): void {
    const barrelWidth = size * 0.14;
    const barrelLength = size * 0.4;
    const barrelX = centerX - barrelWidth / 2;
    const barrelY = y + bodyMargin - barrelLength * 0.3;

    this.ctx.fillStyle = this.darkenColor(color, 0.15);
    this.ctx.beginPath();
    this.ctx.roundRect(barrelX, barrelY, barrelWidth, barrelLength, 2);
    this.ctx.fill();

    this.ctx.fillStyle = this.lightenColor(color, 0.3);
    this.ctx.fillRect(barrelX + 2, barrelY, barrelWidth - 4, barrelLength * 0.3);
  }

  private drawBullets(): void {
    for (const bullet of this.tanksGame.getBullets()) {
      if (!bullet.isActive()) continue;

      const pos = bullet.getPosition();
      const x = pos.x * this.effectiveSize + this.gridConfig.cellSize / 2;
      const y = pos.y * this.effectiveSize + this.gridConfig.cellSize / 2;

      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = COLOR_BULLET;

      this.ctx.fillStyle = COLOR_BULLET;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.shadowBlur = 0;
    }
  }

  private drawPlayerHP(): void {
    const player = this.tanksGame.getPlayer();
    const hp = player.getHp();
    const maxHp = player.getMaxHp();

    const padding = 12;
    const heartSize = 18;
    const heartSpacing = 24;
    const panelWidth = maxHp * heartSpacing + padding;
    const panelHeight = heartSize + padding * 1.5;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.beginPath();
    this.ctx.roundRect(padding - 4, padding - 4, panelWidth, panelHeight, 6);
    this.ctx.fill();

    for (let i = 0; i < maxHp; i++) {
      const x = padding + i * heartSpacing + heartSize / 2;
      const y = padding + heartSize / 2;

      if (i < hp) {
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
